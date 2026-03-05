"""
Notification Schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    notification_ids: List[int]