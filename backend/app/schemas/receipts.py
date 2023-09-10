from pydantic import BaseModel


class ReceiptsItemOut(BaseModel):
    item_id: int
    name: str
    type: str

    class Config:
        orm_mode = True

class ReceiptsOut(BaseModel):
    # device_id: int
    receipt_id: int
    item_id: int
    name: str
    type: str
    quantity: float
    price: float
    category_noun: str
    category_url: str | None

    class Config:
        orm_mode = True

class PredictCartOut(BaseModel):
    target: ReceiptsOut | None
    candidate: ReceiptsOut | None
    proba: float | None

    class Config:
        orm_mode = True

class ReceiptsByIdOut(BaseModel):
    items: list[ReceiptsOut]
    predict: PredictCartOut | None

    class Config:
        orm_mode = True


class ReceiptsIdsOut(BaseModel):
    receipt_id: int

    class Config:
        orm_mode = True