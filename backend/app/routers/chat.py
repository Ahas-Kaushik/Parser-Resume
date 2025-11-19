"""
Chat Router
Handles real-time chat messages (global and direct)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter()


@router.post("/send", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a chat message (global or direct)
    
    - **message**: Message content (max 1000 characters)
    - **receiver_id**: Recipient user ID (null for global chat)
    - **is_global**: True for global chat, False for direct message
    """
    
    # Validate receiver exists if direct message
    if not message_data.is_global and message_data.receiver_id:
        receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receiver not found"
            )
    
    # Create message
    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        message=message_data.message,
        is_global=message_data.is_global
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Return with sender name
    return {
        "id": new_message.id,
        "sender_id": new_message.sender_id,
        "sender_name": current_user.name,
        "receiver_id": new_message.receiver_id,
        "message": new_message.message,
        "is_global": new_message.is_global,
        "created_at": new_message.created_at
    }


@router.get("/global", response_model=List[ChatMessageResponse])
async def get_global_messages(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get global chat messages
    
    - **limit**: Maximum number of messages to return (default: 50)
    """
    
    # Get recent messages within history window
    cutoff_date = datetime.utcnow() - timedelta(days=settings.CHAT_HISTORY_DAYS)
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.is_global == True,
        ChatMessage.created_at >= cutoff_date
    ).order_by(
        ChatMessage.created_at.desc()
    ).limit(min(limit, settings.CHAT_MESSAGE_LIMIT)).all()
    
    # Reverse to show oldest first
    messages = messages[::-1]
    
    # Add sender names
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown",
            "receiver_id": None,
            "message": msg.message,
            "is_global": True,
            "created_at": msg.created_at
        })
    
    return result


@router.get("/direct/{user_id}", response_model=List[ChatMessageResponse])
async def get_direct_messages(
    user_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get direct messages between current user and another user
    
    - **user_id**: ID of the other user
    - **limit**: Maximum number of messages to return (default: 50)
    """
    
    # Verify other user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get messages between users
    cutoff_date = datetime.utcnow() - timedelta(days=settings.CHAT_HISTORY_DAYS)
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.is_global == False,
        ChatMessage.created_at >= cutoff_date,
        (
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == user_id)) |
            ((ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == current_user.id))
        )
    ).order_by(
        ChatMessage.created_at.desc()
    ).limit(min(limit, settings.CHAT_MESSAGE_LIMIT)).all()
    
    # Reverse to show oldest first
    messages = messages[::-1]
    
    # Add sender names
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown",
            "receiver_id": msg.receiver_id,
            "message": msg.message,
            "is_global": False,
            "created_at": msg.created_at
        })
    
    return result


@router.get("/users", response_model=List[dict])
async def get_chat_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of users for direct messaging
    """
    
    users = db.query(User).filter(User.id != current_user.id).all()
    
    return [
        {
            "id": user.id,
            "name": user.name,
            "role": user.role.value
        }
        for user in users
    ]