"""
Tax constants for FY 2025-26 (AY 2026-27), India.

⚠️ IMPORTANT: These figures are compiled from public guidance current as of
mid-2026 and are provided for planning/educational purposes only. Tax law
changes with every Union Budget. Always have a Chartered Accountant verify
figures before relying on them for an actual filing.

Sources cross-checked (June 2026): Budget 2025 new-regime slab revision,
Section 112A/111A capital gains rates post Budget 2024 amendment.
"""

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# New Tax Regime (Section 115BAC) slabs — FY 2025-26 / AY 2026-27
# ---------------------------------------------------------------------------
NEW_REGIME_SLABS = [
    (0, 400_000, 0.00),
    (400_000, 800_000, 0.05),
    (800_000, 1_200_000, 0.10),
    (1_200_000, 1_600_000, 0.15),
    (1_600_000, 2_000_000, 0.20),
    (2_000_000, 2_400_000, 0.25),
    (2_400_000, float("inf"), 0.30),
]

# Old regime slabs (unchanged for several years) — individuals < 60 yrs
OLD_REGIME_SLABS = [
    (0, 250_000, 0.00),
    (250_000, 500_000, 0.05),
    (500_000, 1_000_000, 0.20),
    (1_000_000, float("inf"), 0.30),
]

STANDARD_DEDUCTION_NEW_REGIME = 75_000
STANDARD_DEDUCTION_OLD_REGIME = 50_000

# Section 87A rebate — new regime: full rebate (up to ₹60,000) if taxable
# slab income <= ₹12,00,000. Does NOT apply to capital gains taxed at
# special rates (111A / 112A) even if total income is below the threshold.
REBATE_87A_NEW_REGIME_THRESHOLD = 1_200_000
REBATE_87A_NEW_REGIME_MAX = 60_000

REBATE_87A_OLD_REGIME_THRESHOLD = 500_000
REBATE_87A_OLD_REGIME_MAX = 12_500

# ---------------------------------------------------------------------------
# Capital gains — equity & equity-oriented funds (STT paid)
# ---------------------------------------------------------------------------
LTCG_EQUITY_RATE = 0.125          # Section 112A, for transfers on/after 23 Jul 2024
LTCG_EQUITY_EXEMPTION = 125_000   # Annual exemption under 112A
STCG_EQUITY_RATE = 0.20           # Section 111A

# Other (non-equity) capital assets
LTCG_OTHER_RATE = 0.125           # Section 112, no indexation, post 23 Jul 2024
# STCG on non-equity assets is taxed at slab rate (added to normal income)

# ---------------------------------------------------------------------------
# Cess & surcharge
# ---------------------------------------------------------------------------
HEALTH_EDUCATION_CESS = 0.04

SURCHARGE_BRACKETS = [
    (5_000_000, 10_000_000, 0.10),
    (10_000_000, 20_000_000, 0.15),
    (20_000_000, float("inf"), 0.25),  # capped effectively for capital gains; simplified here
]

# Holding period thresholds (in days) to classify LT vs ST
LISTED_EQUITY_LT_HOLDING_DAYS = 365
UNLISTED_LT_HOLDING_DAYS = 730

# Set-off & carry-forward rules (Sections 70, 71, 74) — simplified for MVP
# Order applied: LTCL -> can only offset LTCG (any asset class)
#                STCL -> can offset both STCG and LTCG
#                Speculative loss -> can only offset speculative business income
#                Non-speculative business loss -> can offset most business/other
#                income but NOT salary
CARRY_FORWARD_YEARS = {
    "LTCL": 8,
    "STCL": 8,
    "SPECULATIVE_LOSS": 4,
    "BUSINESS_LOSS": 8,
}


@dataclass
class TaxBreakdownLine:
    label: str
    amount: float
    note: str = ""
