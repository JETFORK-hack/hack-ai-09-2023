
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException

from app.deps.db import get_async_session
from app.models.receipts import Receipts
from app.schemas.receipts import ReceiptsByIdOut, ReceiptsItemOut
from sqlalchemy import exc, select, or_
from sqlalchemy.ext.asyncio.session import AsyncSession


router = APIRouter(prefix="/matching")

@router.get('/find_by_name', tags=['matching'], summary='Поиск товара по названию', 
            response_model=list[ReceiptsItemOut])
async def find_product_by_name(
    session: AsyncSession = Depends(get_async_session),
    q: str | None = None,
    _type: Annotated[str | None, Query(alias="type")] = None,
):
    try:
        result = None
        if _type and q:
            if q.isdigit():
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.item_id == int(q))
                    .where(Receipts.type.ilike(f'%{_type}%'))
                    .limit(10)
                )
            else:
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.name.ilike(f'%{q}%'))
                    .where(Receipts.type == _type)
                    .limit(10)
                )
        elif _type:
            result = await session.execute(
                select(Receipts)
                .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                .where(Receipts.type == _type)
                .limit(10)
            )
        elif q:
            if q.isdigit():
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.item_id == int(q))
                    .limit(10)
                )
            else:
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.name.ilike(f'%{q}%'))
                    .limit(10)
                )
        else:
            result = await session.execute(
                select(Receipts)
                .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                .limit(10)
            )
        return result.scalars().all()
    except exc.SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/receipts_by_id', tags=['matching'], summary='Поиск по номеру чека', 
            response_model=ReceiptsByIdOut
)
async def find_receipts_by_id(
    session: AsyncSession = Depends(get_async_session),
    _id: Annotated[int, Query(alias="id")] = None,
):
    try:
        result = await session.execute(
                    select(Receipts)
                    .where(Receipts.receipt_id == _id)
                )
        items = result.scalars().all()
        return ReceiptsByIdOut(items=items, predict=None)
    except exc.SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))