"""
Database models for the application.
This module defines all SQLAlchemy ORM models including User, Role, and UserRole.
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

# Association table for many-to-many relationship between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)

class User(Base):
    """
    User model for authentication and authorization.
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    first_name = Column(String(64))
    last_name = Column(String(64))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with roles (many-to-many)
    roles = relationship('Role', secondary=user_roles, back_populates='users')
    # Relationship with progress tracking
    progress = relationship('UserProgress', uselist=False, back_populates='user')
    
    def __init__(self, username, email, password, first_name=None, last_name=None):
        self.username = username
        self.email = email
        self.set_password(password)
        self.first_name = first_name
        self.last_name = last_name
    
    def set_password(self, password):
        """
        Hash and set the user's password.
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Verify a password against the stored hash.
        """
        return check_password_hash(self.password_hash, password)
    
    def has_role(self, role_name):
        """
        Check if the user has a specific role.
        """
        return any(role.name == role_name for role in self.roles)
    
    def get_full_name(self):
        """
        Return the user's full name, if available.
        """
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def __repr__(self):
        return f"<User {self.username}>"

class Role(Base):
    """
    Role model for RBAC.
    """
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False)
    description = Column(String(256))
    
    # Relationship with users (many-to-many)
    users = relationship('User', secondary=user_roles, back_populates='roles')
    # Relationship with permissions (one-to-many)
    permissions = relationship('Permission', back_populates='role')
    
    def __init__(self, name, description=None):
        self.name = name
        self.description = description
    
    def __repr__(self):
        return f"<Role {self.name}>"

class Permission(Base):
    """
    Permission model for fine-grained access control.
    """
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False)
    resource = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)  # e.g., 'read', 'write', 'delete'
    role_id = Column(Integer, ForeignKey('roles.id'))
    
    # Relationship with roles (many-to-one)
    role = relationship('Role', back_populates='permissions')
    
    def __init__(self, name, resource, action, role_id):
        self.name = name
        self.resource = resource
        self.action = action
        self.role_id = role_id
    
    def __repr__(self):
        return f"<Permission {self.name} ({self.action} on {self.resource})>"
