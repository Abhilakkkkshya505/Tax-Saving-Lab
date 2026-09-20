"""
Unit tests for the tax calculation engine.

Run with: pytest tests/test_tax_engine.py -v
"""

import sys
import os
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.schemas.tax import (
    TaxCalculationRequest, IncomeProfileIn, HoldingIn, SegmentResultIn, Segment, Regime,
)
from app.services.tax_engine import calculate_tax, slab_tax


def test_slab_tax_new_regime_zero_below_exemption():
    assert slab_tax(400_000, Regime.NEW) == 0


def test_slab_tax_new_regime_known_value():
    # 49,25,000 taxable income under new regime
    assert slab_tax(4_925_000, Regime.NEW) == 1_057_500.0


def test_slab_tax_progressive_bands():
    # 8,00,000 exactly at boundary -> only the 5% band on 4L applies
    assert slab_tax(800_000, Regime.NEW) == 20_000.0


def test_ltcg_exemption_applied():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=2_000_000),
        holdings=[],
        segment_totals=[SegmentResultIn(segment=Segment.LTCG_EQUITY, realized_pnl=100_000)],
    )
    result = calculate_tax(req)
    assert result.ltcg_tax == 0  # under 1.25L exemption


def test_ltcg_taxed_above_exemption():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=2_000_000),
        holdings=[],
        segment_totals=[SegmentResultIn(segment=Segment.LTCG_EQUITY, realized_pnl=225_000)],
    )
    result = calculate_tax(req)
    # (2.25L - 1.25L) * 12.5% = 12,500
    assert result.ltcg_tax == 12_500.0


def test_stcl_offsets_ltcg_after_stcg():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=2_000_000),
        holdings=[],
        segment_totals=[
            SegmentResultIn(segment=Segment.LTCG_EQUITY, realized_pnl=300_000),
            SegmentResultIn(segment=Segment.STCG_EQUITY, realized_pnl=-100_000),
        ],
    )
    result = calculate_tax(req)
    # STCL fully offsets against LTCG since there's no STCG to absorb it first
    # LTCG pool: 300,000 - 100,000 = 200,000 -> taxable = 200,000-125,000=75,000
    assert result.ltcg_taxable == 75_000.0


def test_business_loss_carried_forward_not_offset_against_salary():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=5_000_000),
        holdings=[],
        segment_totals=[SegmentResultIn(segment=Segment.FNO, realized_pnl=-300_000)],
    )
    result = calculate_tax(req)
    # Business loss must NOT reduce slab income from salary
    assert result.slab_taxable_income == 5_000_000 - 75_000
    carry_types = [c.loss_type for c in result.carry_forwards]
    assert "BUSINESS_LOSS" in carry_types


def test_rebate_87a_applies_below_threshold():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=1_200_000),
        holdings=[],
    )
    result = calculate_tax(req)
    assert result.slab_tax == 0  # rebate cancels out tax fully at slab income <= 12L


def test_rebate_87a_does_not_apply_to_capital_gains():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=1_000_000),
        holdings=[],
        segment_totals=[SegmentResultIn(segment=Segment.LTCG_EQUITY, realized_pnl=300_000)],
    )
    result = calculate_tax(req)
    assert result.ltcg_tax > 0  # rebate must not zero this out


def test_harvest_opportunity_detected_for_unrealized_loss():
    req = TaxCalculationRequest(
        income=IncomeProfileIn(regime=Regime.NEW, annual_salary=2_000_000),
        holdings=[
            HoldingIn(symbol="INFY", segment=Segment.LTCG_EQUITY, quantity=200,
                      buy_price=2500, current_price=2000, buy_date=date(2023, 1, 1)),
        ],
    )
    result = calculate_tax(req, as_of=date(2026, 6, 20))
    assert len(result.harvest_opportunities) == 1
    assert result.harvest_opportunities[0].unrealized_loss == 100_000.0


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
