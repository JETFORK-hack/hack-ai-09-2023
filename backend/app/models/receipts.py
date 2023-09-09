from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import BIGINT


from app.db import Base


class Receipts(Base):
    __tablename__ = "receipts"

    receipt_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    item_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
    quantity: Mapped[float] = mapped_column()
    price: Mapped[float] = mapped_column()
    category_noun: Mapped[str] = mapped_column()

class PredictCart(Base):
    __tablename__ = "predict"

    receipt_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    target: Mapped[int] = mapped_column(primary_key=True)
    candidate: Mapped[int] = mapped_column(primary_key=True)
    proba: Mapped[float] = mapped_column()
