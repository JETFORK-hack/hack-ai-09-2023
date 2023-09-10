from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import BIGINT


from app.db import Base


class Categories(Base):
    __tablename__ = 'categories'

    category: Mapped[str] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column()

    receipts: Mapped["Receipts"] = relationship("Receipts", back_populates="category")
    # receipts = relationship("Receipts", back_populates="category")


class Receipts(Base):
    __tablename__ = "receipts"

    receipt_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    device_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    item_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
    quantity: Mapped[float] = mapped_column()
    price: Mapped[float] = mapped_column()
    category_noun: Mapped[str] = mapped_column(ForeignKey("categories.category"))
    
    category: Mapped[Categories] = relationship("Categories", back_populates="receipts")
    # category = relationship("Categories", back_populates="receipts")


class PredictCart(Base):
    __tablename__ = "predict"

    receipt_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    target: Mapped[int] = mapped_column(primary_key=True)
    candidate: Mapped[int] = mapped_column(primary_key=True)
    proba: Mapped[float] = mapped_column()
