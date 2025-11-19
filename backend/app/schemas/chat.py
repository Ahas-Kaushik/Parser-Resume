"""
Chat Schemas
Pydantic models for chat validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatMessageCreate(BaseModel):
    """Chat message creation schema"""
    message: str = Field(..., min_length=1, max_length=1000)
    receiver_id: Optional[int] = None  # NULL for global chat
    is_global: bool = False


class ChatMessageResponse(BaseModel):
    """Chat message response schema"""
    id: int
    sender_id: int
    sender_name: str
    receiver_id: Optional[int] = None
    message: str
    is_global: bool
    created_at: datetime
    
    class Config:
        from_attributes = True