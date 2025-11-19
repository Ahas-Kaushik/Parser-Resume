"""
Chat Message Model
Stores chat messages (both global and direct messages)
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for global chat
    
    # Message Content
    message = Column(Text, nullable=False)
    is_global = Column(Boolean, default=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender_id={self.sender_id}, is_global={self.is_global})>"