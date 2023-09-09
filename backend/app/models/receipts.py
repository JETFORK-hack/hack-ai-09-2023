from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import BIGINT


from app.db import Base


class Receipts(Base):
    __tablename__ = "receipts"

    receipt_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    item_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
