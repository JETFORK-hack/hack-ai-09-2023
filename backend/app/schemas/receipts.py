from pydantic import BaseModel


class ReceiptsItemOut(BaseModel):
    item_id: int
    name: str
    type: str

    class Config:
        orm_mode = True

class ReceiptsOut(BaseModel):
    receipt_id: int
    item_id: int
    name: str
    type: str
    quantity: float
    price: float

    class Config:
        orm_mode = True

class ReceiptsByIdOut(BaseModel):
    items: list[ReceiptsOut]
    predict: ReceiptsOut | None

    class Config:
        orm_mode = True