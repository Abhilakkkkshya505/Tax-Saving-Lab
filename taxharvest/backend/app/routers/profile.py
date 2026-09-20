from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, IncomeProfile
from app.schemas.tax import IncomeProfileIn

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/income")
def get_income_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(IncomeProfile).filter(IncomeProfile.user_id == user.id).first()
    if not profile:
        return IncomeProfileIn()
    return IncomeProfileIn(
        regime=profile.regime,
        annual_salary=profile.annual_salary,
        other_income=profile.other_income,
        section_80_deductions=profile.section_80_deductions,
        business_expenses=profile.business_expenses,
        tds_paid=profile.tds_paid,
    )


@router.put("/income")
def upsert_income_profile(
    payload: IncomeProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(IncomeProfile).filter(IncomeProfile.user_id == user.id).first()
    if not profile:
        profile = IncomeProfile(user_id=user.id)
        db.add(profile)

    profile.regime = payload.regime.value
    profile.annual_salary = payload.annual_salary
    profile.other_income = payload.other_income
    profile.section_80_deductions = payload.section_80_deductions
    profile.business_expenses = payload.business_expenses
    profile.tds_paid = payload.tds_paid

    db.commit()
    db.refresh(profile)
    return {"status": "saved"}
