"""Pydantic schemas shared across the API."""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Regime(str, Enum):
    NEW = "new"
    OLD = "old"


class Segment(str, Enum):
    LTCG_EQUITY = "ltcg_equity"
    STCG_EQUITY = "stcg_equity"
    LTCG_OTHER = "ltcg_other"
    STCG_OTHER = "stcg_other"
    FNO = "fno"            # non-speculative business income
    INTRADAY = "intraday"  # speculative business income
    COMMODITY = "commodity"
    CURRENCY = "currency"


class IncomeProfileIn(BaseModel):
    regime: Regime = Regime.NEW
    annual_salary: float = Field(0, ge=0)
    other_income: float = Field(0, ge=0, description="Rent, interest, etc.")
    section_80_deductions: float = Field(0, ge=0, description="Old regime only")
    business_expenses: float = Field(0, ge=0, description="Trading-related deductible expenses")
    tds_paid: float = Field(0, ge=0)


class HoldingIn(BaseModel):
    id: Optional[str] = None
    symbol: str
    name: Optional[str] = None
    segment: Segment
    quantity: float
    buy_price: float
    current_price: float
    buy_date: date


class SegmentResultIn(BaseModel):
    """Pre-aggregated P&L per trading segment, used when the user enters
    totals directly rather than holding-by-holding."""
    segment: Segment
    realized_pnl: float = 0
    unrealized_pnl: float = 0


class TaxCalculationRequest(BaseModel):
    income: IncomeProfileIn
    holdings: list[HoldingIn] = []
    segment_totals: list[SegmentResultIn] = []


class WaterfallStep(BaseModel):
    step: int
    label: str
    description: str
    amount: float
    running_total: float


class TaxLineItem(BaseModel):
    label: str
    amount: float
    note: str = ""


class CarryForwardItem(BaseModel):
    loss_type: str
    amount: float
    origin_year: str
    expiry_year: str
    years_remaining: int
    usable_now: bool


class SegmentBreakdown(BaseModel):
    segment: Segment
    label: str
    realized_pnl: float
    unrealized_pnl: float
    tax_impact: float


class HarvestOpportunity(BaseModel):
    holding_id: str
    symbol: str
    segment: Segment
    unrealized_loss: float
    tax_savings: float
    priority: str  # "harvest_first" | "monitor" | "low_priority" | "ignore"


class TaxCalculationResponse(BaseModel):
    gross_income: float
    slab_taxable_income: float
    slab_tax: float
    ltcg_taxable: float
    ltcg_tax: float
    stcg_taxable: float
    stcg_tax: float
    business_income: float
    business_tax: float
    cess: float
    surcharge: float
    rebate_87a: float
    total_tax_before_credits: float
    tds_paid: float
    net_tax_payable: float
    effective_rate: float
    waterfall: list[WaterfallStep]
    detailed_lines: list[TaxLineItem]
    carry_forwards: list[CarryForwardItem]
    segment_breakdown: list[SegmentBreakdown]
    harvest_opportunities: list[HarvestOpportunity]
    potential_savings: float
    audit_threshold_warning: Optional[str] = None
