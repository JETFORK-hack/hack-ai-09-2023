
from fastapi import Body

from app.deps.db import get_async_session
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio.session import AsyncSession


router = APIRouter(prefix="/matching")

@router.get('/find')
async def find_product_by_name(
    session: AsyncSession = Depends(get_async_session),
    product_name: str = Body(default='', title="Название продукта")
):
    return {'status': 'ok', 'data': product_name}