from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, IncomeProfile, Holding
from app.schemas.tax import TaxCalculationRequest, TaxCalculationResponse, IncomeProfileIn, HoldingIn
from app.services.tax_engine import calculate_tax

router = APIRouter(prefix="/api/calculate", tags=["calculate"])


@router.post("", response_model=TaxCalculationResponse)
def calculate_ad_hoc(payload: TaxCalculationRequest):
    """Stateless calculation — pass income + holdings directly. Used by the
    'what-if' scenario modeling tool and for users who aren't logged in."""
    return calculate_tax(payload)


@router.get("/me", response_model=TaxCalculationResponse)
def calculate_for_current_user(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculates tax using the logged-in user's saved income profile and holdings."""
    profile = db.query(IncomeProfile).filter(IncomeProfile.user_id == user.id).first()
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()

    income = IncomeProfileIn(
        regime=profile.regime if profile else "new",
        annual_salary=profile.annual_salary if profile else 0,
        other_income=profile.other_income if profile else 0,
        section_80_deductions=profile.section_80_deductions if profile else 0,
        business_expenses=profile.business_expenses if profile else 0,
        tds_paid=profile.tds_paid if profile else 0,
    )
    holding_schemas = [
        HoldingIn(
            id=h.id, symbol=h.symbol, name=h.name, segment=h.segment,
            quantity=h.quantity, buy_price=h.buy_price, current_price=h.current_price,
            buy_date=h.buy_date,
        )
        for h in holdings
    ]
    req = TaxCalculationRequest(income=income, holdings=holding_schemas)
    return calculate_tax(req)
