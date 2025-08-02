"""
Progress tracking models for the application.
This module defines SQLAlchemy ORM models for tracking user progress and interactions.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base

class UserProgress(Base):
    """
    Overall user progress across all chapters.
    """
    __tablename__ = 'user_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    total_chapters_viewed = Column(Integer, default=0)
    total_chapters_completed = Column(Integer, default=0)  # Fully completed chapters
    total_pages_viewed = Column(Integer, default=0)
    total_exercises_completed = Column(Integer, default=0)
    overall_progress_percent = Column(Float, default=0.0)  # 0-100
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='progress')
    page_views = relationship('UserPageView', back_populates='progress')
    
    def __repr__(self):
        return f"<UserProgress user_id={self.user_id} progress={self.overall_progress_percent:.1f}%>"

class UserPageView(Base):
    """
    Track individual page views for users.
    """
    __tablename__ = 'user_page_views'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    progress_id = Column(Integer, ForeignKey('user_progress.id'), nullable=False)
    chapter_id = Column(String(64), nullable=False, index=True)  # e.g., 'chapter1'
    page_id = Column(String(64), nullable=False, index=True)     # e.g., 'page1'
    page_title = Column(String(256))
    is_completed = Column(Boolean, default=False)
    completion_percent = Column(Float, default=0.0)  # 0-100
    time_spent_seconds = Column(Integer, default=0)
    first_viewed_at = Column(DateTime, default=datetime.utcnow)
    last_viewed_at = Column(DateTime, default=datetime.utcnow)
    view_count = Column(Integer, default=1)
    
    # Relationships
    user = relationship('User')
    progress = relationship('UserProgress', back_populates='page_views')
    interactions = relationship('UserInteraction', back_populates='page_view')
    
    def __repr__(self):
        return f"<UserPageView user_id={self.user_id} chapter={self.chapter_id} page={self.page_id} completed={self.is_completed}>"

class UserInteraction(Base):
    """
    Detailed user interaction tracking.
    """
    __tablename__ = 'user_interactions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    page_view_id = Column(Integer, ForeignKey('user_page_views.id'), nullable=False)
    interaction_type = Column(String(64), nullable=False)  # 'scroll', 'click', 'exercise', etc.
    interaction_data = Column(JSON)  # Store additional data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User')
    page_view = relationship('UserPageView', back_populates='interactions')
    
    def __repr__(self):
        return f"<UserInteraction user_id={self.user_id} type={self.interaction_type}>"

class UserExercise(Base):
    """
    Track exercise completions and submissions.
    """
    __tablename__ = 'user_exercises'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    chapter_id = Column(String(64), nullable=False, index=True)
    exercise_id = Column(String(64), nullable=False, index=True)
    exercise_title = Column(String(256))
    is_completed = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    score = Column(Float, nullable=True)  # Score if applicable
    code_submitted = Column(Text, nullable=True)  # Store submitted code
    first_attempt_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User')
    
    def __repr__(self):
        return f"<UserExercise user_id={self.user_id} exercise={self.exercise_id} completed={self.is_completed}>"
