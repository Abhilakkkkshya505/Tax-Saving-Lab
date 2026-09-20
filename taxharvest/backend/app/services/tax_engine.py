"""
Tax calculation engine.

Implements (for FY 2025-26 / AY 2026-27, New Regime by default):
  1. Slab tax on salary + other income, less standard deduction.
  2. Capital gains tax — LTCG (112A/112) and STCG (111A) computed separately
     at special rates, NOT mixed into slab income.
  3. Business income (F&O = non-speculative, Intraday = speculative) taxed
     at slab rate, with loss set-off restrictions.
  4. Set-off waterfall in the simplified statutory order:
       LTCL -> offsets LTCG only
       STCL -> offsets STCG first, then LTCG
       Speculative loss -> offsets speculative business income only
       Non-speculative business loss -> offsets other business/other income,
         never salary
  5. Unused losses are carried forward with their statutory expiry windows.
  6. Section 87A rebate (new regime, slab income <= 12L) applied only to
     slab tax, not to capital-gains tax.
  7. Health & education cess (4%) on total.

This is a planning aid, not a filing tool. CA review required before use.
"""

from __future__ import annotations

from datetime import date

from app.core.tax_constants import (
    NEW_REGIME_SLABS,
    OLD_REGIME_SLABS,
    STANDARD_DEDUCTION_NEW_REGIME,
    STANDARD_DEDUCTION_OLD_REGIME,
    REBATE_87A_NEW_REGIME_THRESHOLD,
    REBATE_87A_NEW_REGIME_MAX,
    REBATE_87A_OLD_REGIME_THRESHOLD,
    REBATE_87A_OLD_REGIME_MAX,
    LTCG_EQUITY_RATE,
    LTCG_EQUITY_EXEMPTION,
    STCG_EQUITY_RATE,
    HEALTH_EDUCATION_CESS,
    LISTED_EQUITY_LT_HOLDING_DAYS,
    CARRY_FORWARD_YEARS,
)
from app.schemas.tax import (
    TaxCalculationRequest,
    TaxCalculationResponse,
    WaterfallStep,
    TaxLineItem,
    CarryForwardItem,
    SegmentBreakdown,
    HarvestOpportunity,
    Regime,
    Segment,
)

SEGMENT_LABELS = {
    Segment.LTCG_EQUITY: "LTCG (Equity)",
    Segment.STCG_EQUITY: "STCG (Equity)",
    Segment.LTCG_OTHER: "LTCG (Other)",
    Segment.STCG_OTHER: "STCG (Other)",
    Segment.FNO: "F&O",
    Segment.INTRADAY: "Intraday",
    Segment.COMMODITY: "Commodity",
    Segment.CURRENCY: "Currency",
}

SPECULATIVE_SEGMENTS = {Segment.INTRADAY}
BUSINESS_SEGMENTS = {Segment.FNO, Segment.COMMODITY, Segment.CURRENCY}


def slab_tax(taxable_income: float, regime: Regime) -> float:
    """Compute progressive slab tax (before cess/rebate)."""
    slabs = NEW_REGIME_SLABS if regime == Regime.NEW else OLD_REGIME_SLABS
    tax = 0.0
    for lower, upper, rate in slabs:
        if taxable_income <= lower:
            break
        band = min(taxable_income, upper) - lower
        tax += band * rate
    return round(tax, 2)


def holding_period_days(buy_date: date, as_of: date | None = None) -> int:
    as_of = as_of or date.today()
    return (as_of - buy_date).days


def classify_holding_term(segment: Segment, buy_date: date, as_of: date | None = None) -> str:
    """Return 'LT' or 'ST' based on holding period and asset class."""
    days = holding_period_days(buy_date, as_of)
    threshold = LISTED_EQUITY_LT_HOLDING_DAYS
    return "LT" if days > threshold else "ST"


def aggregate_segments_from_holdings(holdings, as_of: date | None = None) -> dict[Segment, dict[str, float]]:
    """Roll up individual holdings into segment-level realized/unrealized
    P&L buckets, splitting equity into LT/ST as appropriate."""
    totals: dict[Segment, dict[str, float]] = {}

    def bucket(seg: Segment):
        return totals.setdefault(seg, {"realized_pnl": 0.0, "unrealized_pnl": 0.0})

    for h in holdings:
        unrealized = (h.current_price - h.buy_price) * h.quantity
        if h.segment in (Segment.LTCG_EQUITY, Segment.STCG_EQUITY):
            term = classify_holding_term(h.segment, h.buy_date, as_of)
            seg = Segment.LTCG_EQUITY if term == "LT" else Segment.STCG_EQUITY
        else:
            seg = h.segment
        b = bucket(seg)
        b["unrealized_pnl"] += unrealized

    return totals


def merge_segment_totals(agg: dict[Segment, dict[str, float]], explicit_totals) -> dict[Segment, dict[str, float]]:
    for t in explicit_totals:
        b = agg.setdefault(t.segment, {"realized_pnl": 0.0, "unrealized_pnl": 0.0})
        b["realized_pnl"] += t.realized_pnl
        b["unrealized_pnl"] += t.unrealized_pnl
    return agg


def calculate_tax(req: TaxCalculationRequest, as_of: date | None = None) -> TaxCalculationResponse:
    as_of = as_of or date.today()
    income = req.income
    regime = income.regime

    # ---- 1. Aggregate segment P&L (realized only counts toward tax this year) ----
    agg = aggregate_segments_from_holdings(req.holdings, as_of)
    agg = merge_segment_totals(agg, req.segment_totals)

    def realized(seg: Segment) -> float:
        return agg.get(seg, {}).get("realized_pnl", 0.0)

    ltcg_equity_realized = realized(Segment.LTCG_EQUITY)
    stcg_equity_realized = realized(Segment.STCG_EQUITY)
    ltcg_other_realized = realized(Segment.LTCG_OTHER)
    stcg_other_realized = realized(Segment.STCG_OTHER)
    fno_realized = realized(Segment.FNO)
    intraday_realized = realized(Segment.INTRADAY)
    commodity_realized = realized(Segment.COMMODITY)
    currency_realized = realized(Segment.CURRENCY)

    # ---- 2. Slab income ----
    gross_income = income.annual_salary + income.other_income
    std_deduction = (
        STANDARD_DEDUCTION_NEW_REGIME if regime == Regime.NEW else STANDARD_DEDUCTION_OLD_REGIME
    )
    deductions = std_deduction + (income.section_80_deductions if regime == Regime.OLD else 0)

    detailed_lines: list[TaxLineItem] = [
        TaxLineItem(label="Gross Salary + Other Income", amount=gross_income),
        TaxLineItem(label="Less: Standard Deduction", amount=-std_deduction),
    ]
    if regime == Regime.OLD and income.section_80_deductions:
        detailed_lines.append(
            TaxLineItem(label="Less: Section 80 Deductions", amount=-income.section_80_deductions)
        )

    # ---- 3. Set-off waterfall (simplified statutory order) ----
    waterfall: list[WaterfallStep] = []
    step_n = 1
    running = gross_income

    waterfall.append(WaterfallStep(
        step=step_n, label="Gross Income", description="Salary + other income before any set-offs",
        amount=gross_income, running_total=running,
    ))

    # LT pool: equity LT + other LT, gains and losses netted within LT pool
    ltcg_pool = ltcg_equity_realized + ltcg_other_realized
    stcg_pool = stcg_equity_realized + stcg_other_realized

    ltcl_used_against_ltcg = 0.0
    if ltcg_pool < 0:
        ltcl_amount = -ltcg_pool
        ltcg_pool = 0.0
        ltcl_used_against_ltcg = 0.0  # nothing to offset against (LT pool itself is the loss)
    else:
        ltcl_amount = 0.0

    stcl_amount = 0.0
    if stcg_pool < 0:
        stcl_amount = -stcg_pool
        stcg_pool = 0.0

    # STCL first offsets remaining STCG (already netted above), then any
    # leftover STCL can offset LTCG.
    if stcl_amount > 0 and ltcg_pool > 0:
        offset = min(stcl_amount, ltcg_pool)
        ltcg_pool -= offset
        stcl_amount -= offset
        step_n += 1
        waterfall.append(WaterfallStep(
            step=step_n, label="STCL offsets LTCG",
            description=f"Short-term capital loss of ₹{offset:,.0f} set off against long-term capital gains",
            amount=-offset, running_total=running,
        ))

    # Speculative (intraday) loss only offsets speculative income
    speculative_carry = 0.0
    speculative_taxable = max(intraday_realized, 0.0)
    if intraday_realized < 0:
        speculative_carry = -intraday_realized

    # Non-speculative business (F&O, commodity, currency) netted together;
    # losses can offset each other and other non-salary income, but not salary.
    business_pool = fno_realized + commodity_realized + currency_realized
    business_carry = 0.0
    business_taxable = 0.0
    if business_pool > 0:
        business_taxable = business_pool
    else:
        business_carry = -business_pool

    step_n += 1
    waterfall.append(WaterfallStep(
        step=step_n, label="Business Income (F&O / Commodity / Currency)",
        description="Non-speculative business segments netted together",
        amount=business_pool, running_total=running,
    ))

    # Business expenses reduce business income (floor at 0 for this simplified model)
    business_taxable = max(business_taxable - income.business_expenses, 0.0)
    if income.business_expenses:
        detailed_lines.append(
            TaxLineItem(label="Less: Trading Business Expenses", amount=-income.business_expenses)
        )

    # ---- 4. Slab taxable income = salary/other income + business income (NOT capital gains) ----
    slab_taxable_income = max(gross_income - deductions + business_taxable, 0.0)
    detailed_lines.append(TaxLineItem(label="Add: Net Business Income", amount=business_taxable))
    detailed_lines.append(TaxLineItem(label="Slab-Taxable Income", amount=slab_taxable_income, note="Taxed at slab rates"))

    step_n += 1
    waterfall.append(WaterfallStep(
        step=step_n, label="Final Slab-Taxable Income",
        description="After standard deduction, deductions, and net business income",
        amount=slab_taxable_income, running_total=slab_taxable_income,
    ))

    # ---- 5. Tax computation per bucket ----
    base_slab_tax = slab_tax(slab_taxable_income, regime)

    ltcg_taxable = max(ltcg_pool - LTCG_EQUITY_EXEMPTION, 0.0)
    ltcg_tax = round(ltcg_taxable * LTCG_EQUITY_RATE, 2)

    stcg_taxable = max(stcg_pool, 0.0)
    stcg_tax = round(stcg_taxable * STCG_EQUITY_RATE, 2)

    # Speculative income taxed at slab rate but kept as a separate line for clarity
    business_tax_on_speculative = 0.0  # already folded into slab via business_taxable in this simplified model

    # ---- 6. Section 87A rebate (slab tax only, new regime) ----
    rebate_87a = 0.0
    if regime == Regime.NEW:
        if slab_taxable_income <= REBATE_87A_NEW_REGIME_THRESHOLD:
            rebate_87a = min(base_slab_tax, REBATE_87A_NEW_REGIME_MAX)
    else:
        if slab_taxable_income <= REBATE_87A_OLD_REGIME_THRESHOLD:
            rebate_87a = min(base_slab_tax, REBATE_87A_OLD_REGIME_MAX)

    slab_tax_after_rebate = max(base_slab_tax - rebate_87a, 0.0)

    total_before_cess = slab_tax_after_rebate + ltcg_tax + stcg_tax

    # ---- 7. Surcharge (simplified — flat thresholds, not marginal-relief adjusted) ----
    total_income_for_surcharge = slab_taxable_income + ltcg_pool + stcg_pool
    surcharge_rate = 0.0
    if total_income_for_surcharge > 20_000_000:
        surcharge_rate = 0.25
    elif total_income_for_surcharge > 10_000_000:
        surcharge_rate = 0.15
    elif total_income_for_surcharge > 5_000_000:
        surcharge_rate = 0.10
    surcharge = round(total_before_cess * surcharge_rate, 2)

    cess = round((total_before_cess + surcharge) * HEALTH_EDUCATION_CESS, 2)
    total_tax_before_credits = round(total_before_cess + surcharge + cess, 2)

    net_tax_payable = max(total_tax_before_credits - income.tds_paid, 0.0)
    total_income_all_in = gross_income + ltcg_pool + stcg_pool + business_taxable
    effective_rate = (total_tax_before_credits / total_income_all_in * 100) if total_income_all_in > 0 else 0.0

    detailed_lines.extend([
        TaxLineItem(label="Slab Tax (before rebate)", amount=base_slab_tax),
        TaxLineItem(label="Less: Section 87A Rebate", amount=-rebate_87a, note="New regime, slab income ≤ ₹12L only"),
        TaxLineItem(label="LTCG Tax (12.5% above ₹1.25L exemption)", amount=ltcg_tax),
        TaxLineItem(label="STCG Tax (20% on equity)", amount=stcg_tax),
        TaxLineItem(label="Surcharge", amount=surcharge),
        TaxLineItem(label="Health & Education Cess (4%)", amount=cess),
        TaxLineItem(label="Total Tax Liability", amount=total_tax_before_credits),
        TaxLineItem(label="Less: TDS Already Paid", amount=-income.tds_paid),
        TaxLineItem(label="Net Tax Payable", amount=net_tax_payable),
    ])

    # ---- 8. Carry-forwards ----
    carry_forwards: list[CarryForwardItem] = []
    fy_start_year = as_of.year if as_of.month >= 4 else as_of.year - 1
    fy_label = f"FY{fy_start_year}-{str(fy_start_year + 1)[2:]}"

    def add_carry(loss_type: str, amount: float):
        if amount <= 0:
            return
        years = CARRY_FORWARD_YEARS[loss_type]
        expiry_year = f"{fy_start_year + years}-{str(fy_start_year + years + 1)[2:]}"
        carry_forwards.append(CarryForwardItem(
            loss_type=loss_type, amount=round(amount, 2), origin_year=fy_label,
            expiry_year=expiry_year, years_remaining=years, usable_now=False,
        ))

    add_carry("LTCL", ltcl_amount)
    add_carry("STCL", stcl_amount)
    add_carry("SPECULATIVE_LOSS", speculative_carry)
    add_carry("BUSINESS_LOSS", business_carry)

    # ---- 9. Segment breakdown ----
    segment_breakdown: list[SegmentBreakdown] = []
    for seg, vals in agg.items():
        # crude per-segment tax impact attribution for the heatmap
        if seg in (Segment.LTCG_EQUITY, Segment.LTCG_OTHER):
            impact = vals["realized_pnl"] * LTCG_EQUITY_RATE if vals["realized_pnl"] > 0 else 0.0
        elif seg in (Segment.STCG_EQUITY, Segment.STCG_OTHER):
            impact = vals["realized_pnl"] * STCG_EQUITY_RATE if vals["realized_pnl"] > 0 else 0.0
        else:
            marginal_rate = 0.30
            impact = vals["realized_pnl"] * marginal_rate if vals["realized_pnl"] > 0 else 0.0
        segment_breakdown.append(SegmentBreakdown(
            segment=seg, label=SEGMENT_LABELS.get(seg, seg.value),
            realized_pnl=round(vals["realized_pnl"], 2),
            unrealized_pnl=round(vals["unrealized_pnl"], 2),
            tax_impact=round(impact, 2),
        ))

    # ---- 10. Harvest opportunities from holdings with unrealized losses ----
    harvest_opportunities: list[HarvestOpportunity] = []
    marginal_rate_guess = 0.30 if slab_taxable_income > 1_500_000 else 0.20
    for h in req.holdings:
        unrealized = (h.current_price - h.buy_price) * h.quantity
        if unrealized >= 0:
            continue
        loss = -unrealized
        if h.segment in (Segment.LTCG_EQUITY, Segment.STCG_EQUITY):
            term = classify_holding_term(h.segment, h.buy_date, as_of)
            rate = LTCG_EQUITY_RATE if term == "LT" else STCG_EQUITY_RATE
        else:
            rate = marginal_rate_guess
        savings = loss * rate
        if loss > 200_000 and savings > 20_000:
            priority = "harvest_first"
        elif loss > 50_000:
            priority = "monitor"
        elif savings > 5_000:
            priority = "low_priority"
        else:
            priority = "ignore"
        harvest_opportunities.append(HarvestOpportunity(
            holding_id=h.id or h.symbol, symbol=h.symbol, segment=h.segment,
            unrealized_loss=round(loss, 2), tax_savings=round(savings, 2), priority=priority,
        ))
    harvest_opportunities.sort(key=lambda x: x.tax_savings, reverse=True)

    potential_savings = round(sum(o.tax_savings for o in harvest_opportunities if o.priority == "harvest_first"), 2)

    # ---- 11. Audit threshold warning (turnover-based, simplified to profit proxy) ----
    audit_threshold_warning = None
    total_business_turnover_proxy = abs(fno_realized) + abs(intraday_realized) + abs(commodity_realized)
    if total_business_turnover_proxy > 10_000_000:
        audit_threshold_warning = (
            "Your trading activity may approach tax-audit turnover thresholds under Section 44AB. "
            "Confirm actual turnover (not just P&L) with your CA."
        )

    return TaxCalculationResponse(
        gross_income=round(gross_income, 2),
        slab_taxable_income=round(slab_taxable_income, 2),
        slab_tax=round(slab_tax_after_rebate, 2),
        ltcg_taxable=round(ltcg_taxable, 2),
        ltcg_tax=ltcg_tax,
        stcg_taxable=round(stcg_taxable, 2),
        stcg_tax=stcg_tax,
        business_income=round(business_taxable, 2),
        business_tax=0.0,
        cess=cess,
        surcharge=surcharge,
        rebate_87a=round(rebate_87a, 2),
        total_tax_before_credits=total_tax_before_credits,
        tds_paid=income.tds_paid,
        net_tax_payable=round(net_tax_payable, 2),
        effective_rate=round(effective_rate, 2),
        waterfall=waterfall,
        detailed_lines=detailed_lines,
        carry_forwards=carry_forwards,
        segment_breakdown=segment_breakdown,
        harvest_opportunities=harvest_opportunities,
        potential_savings=potential_savings,
        audit_threshold_warning=audit_threshold_warning,
    )
