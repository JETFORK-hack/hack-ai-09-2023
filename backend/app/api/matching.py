
import asyncio
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query, HTTPException
from sqlalchemy import exc, func, select, cast, String
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.deps.db import get_async_session
from app.deps.model.cosmetics.predict import predict as cosmetics_predict
from app.deps.model.super.predict import predict as super_predict
from app.models.receipts import Categories, PredictCart, Receipts
from app.schemas.receipts import PredictCartOut, ReceiptsByIdOut, ReceiptsIdsOut, ReceiptsItemOut, ReceiptsOut


router = APIRouter(prefix="/matching")

@router.get('/find_by_name', tags=['matching'], summary='Поиск товара по названию', 
            response_model=list[ReceiptsItemOut])
async def find_product_by_name(
    device_id: int,
    _type: Annotated[str, Query(alias="type")],
    q: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        result = None
        if q:
            if q.isdigit():
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.device_id == device_id)
                    .where(Receipts.item_id == int(q))
                    .where(Receipts.type == _type)
                    .limit(10)
                )
            else:
                result = await session.execute(
                    select(Receipts)
                    .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                    .where(Receipts.device_id == device_id)
                    .where(Receipts.name.ilike(f'%{q}%'))
                    .where(Receipts.type == _type)
                    .limit(10)
                )
        else:
            result = await session.execute(
                select(Receipts)
                .distinct(Receipts.name, Receipts.type, Receipts.item_id)
                .where(Receipts.device_id == device_id)
                .where(Receipts.type == _type)
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
                    select(
                        Receipts.receipt_id, Receipts.item_id, Receipts.name,
                        Receipts.type, Receipts.quantity, Receipts.price,
                        Receipts.category_noun, Categories.url.label('category_url')
                        )
                    .join(Categories, Receipts.category_noun == Categories.category)
                    .where(Receipts.receipt_id == _id)
                )
        items = result.all()
        predict = await session.execute(
            select(PredictCart)
            .where(PredictCart.receipt_id == _id)
        )
        predict = predict.scalars().first()
        if predict:
            target = session.execute(
                select(
                    Receipts.receipt_id, Receipts.item_id, Receipts.name,
                    Receipts.type, Receipts.quantity, Receipts.price,
                    Receipts.category_noun, Categories.url.label('category_url'))
                .join(Categories, Receipts.category_noun == Categories.category)
                .where(Receipts.item_id == predict.target)
                .order_by(Receipts.price.desc())
            )
            candidate = session.execute(
                select(
                    Receipts.receipt_id, Receipts.item_id, Receipts.name,
                    Receipts.type, Receipts.quantity, Receipts.price,
                    Receipts.category_noun, Categories.url.label('category_url'))
                .join(Categories, Receipts.category_noun == Categories.category)
                .where(Receipts.item_id == predict.candidate)
                .order_by(Receipts.price.desc())
            )
            target, candidate = await asyncio.gather(target, candidate)

            return ReceiptsByIdOut(items=items, predict=PredictCartOut(
                target=target.first(),
                candidate=candidate.first(),
                proba=predict.proba
            ))
        
        return ReceiptsByIdOut(items=items, predict=None)
    except exc.SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get('/receipts', tags=['matching'], summary='Поиск по номеру чека', 
            response_model=list[int]
)
async def find_receipts(
    session: AsyncSession = Depends(get_async_session),
    _id: Annotated[int, Query(alias="id")] = None,
):
    try:
        if _id:
            result = await session.execute(
                        select(Receipts.receipt_id)
                        .distinct(Receipts.receipt_id)
                        .where(cast(Receipts.receipt_id, String).like(f'%{_id}%'))
                        .where(Receipts.val == True)
                        .limit(10)
                    )
        else:
            result = await session.execute(
                        select(Receipts.receipt_id)
                        .distinct(Receipts.receipt_id)
                        .where(Receipts.val == True)
                        .limit(10)
                    )
        r = result.scalars().all()
        return r
    except exc.SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get('/devices', tags=['matching'], summary='Код заведения', 
            response_model=list[int]
)
async def find_devices(
    session: AsyncSession = Depends(get_async_session),
    _id: Annotated[int, Query(alias="id")] = None,
    _type: Annotated[str | None, Query(alias="type")] = None,
):
    try:
        if _id and _type:
            result = await session.execute(
                select(Receipts.device_id)
                .distinct(Receipts.device_id)
                .where(Receipts.type == _type)
                .where(cast(Receipts.device_id, String).like(f'%{_id}%'))
                .limit(10)
            )
        elif _type:
            result = await session.execute(
                select(Receipts.device_id)
                .distinct(Receipts.device_id)
                .where(Receipts.type == _type)
                .limit(10)
            )
        else:
            result = await session.execute(
                select(Receipts.device_id)
                .distinct(Receipts.device_id)
                .where(Receipts.type == _type)
                .limit(10)
            )
        r = result.scalars().all()
        return r
    except exc.SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post(
        '/cart_predict', tags=['matching'], 
        summary='Предсказание товара по корзине',
        response_model=ReceiptsOut
)
async def cart_predict(
    device_id: int,
    items: list[int] = Body(..., title="Элементы корзины"),
    _type: Annotated[str, Query(alias="type")] = None,
    session: AsyncSession = Depends(get_async_session),
):
    if _type == 'cosmetic':
        item_id = cosmetics_predict(tuple(items), device_id)
    elif _type == 'super':
        item_id = super_predict(tuple(items), device_id)
    else:
        raise HTTPException(status_code=404, detail="Type not found")
    if not item_id:
        raise HTTPException(status_code=404, detail="Item not found")
    result = await session.execute(
        select(Receipts)
        .where(Receipts.item_id == item_id)
        .order_by(Receipts.price.desc())
        .limit(1)
    )  
    return result.scalars().first()
