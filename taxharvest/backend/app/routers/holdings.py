from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Holding
from app.schemas.tax import HoldingIn

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


def _to_schema(h: Holding) -> HoldingIn:
    return HoldingIn(
        id=h.id, symbol=h.symbol, name=h.name, segment=h.segment,
        quantity=h.quantity, buy_price=h.buy_price, current_price=h.current_price,
        buy_date=h.buy_date,
    )


@router.get("", response_model=list[HoldingIn])
def list_holdings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Holding).filter(Holding.user_id == user.id).all()
    return [_to_schema(h) for h in rows]


@router.post("", response_model=HoldingIn, status_code=201)
def create_holding(payload: HoldingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    h = Holding(
        user_id=user.id, symbol=payload.symbol, name=payload.name,
        segment=payload.segment.value, quantity=payload.quantity,
        buy_price=payload.buy_price, current_price=payload.current_price,
        buy_date=payload.buy_date,
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return _to_schema(h)


@router.put("/{holding_id}", response_model=HoldingIn)
def update_holding(holding_id: str, payload: HoldingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == holding_id, Holding.user_id == user.id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    h.symbol = payload.symbol
    h.name = payload.name
    h.segment = payload.segment.value
    h.quantity = payload.quantity
    h.buy_price = payload.buy_price
    h.current_price = payload.current_price
    h.buy_date = payload.buy_date
    db.commit()
    db.refresh(h)
    return _to_schema(h)


@router.delete("/{holding_id}", status_code=204)
def delete_holding(holding_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == holding_id, Holding.user_id == user.id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(h)
    db.commit()
    return None


@router.post("/bulk", response_model=list[HoldingIn], status_code=201)
def bulk_create_holdings(payload: list[HoldingIn], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Used by the CSV/XLSX broker-file upload flow."""
    created = []
    for item in payload:
        h = Holding(
            user_id=user.id, symbol=item.symbol, name=item.name,
            segment=item.segment.value, quantity=item.quantity,
            buy_price=item.buy_price, current_price=item.current_price,
            buy_date=item.buy_date,
        )
        db.add(h)
        created.append(h)
    db.commit()
    for h in created:
        db.refresh(h)
    return [_to_schema(h) for h in created]
