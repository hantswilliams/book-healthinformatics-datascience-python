"""
Role-Based Access Control (RBAC) module for the application.
This module manages roles, permissions, and access control.
"""
from functools import wraps
from flask import current_app, g, redirect, url_for, flash, request
from database.models import Role, Permission, User

def init_rbac(app):
    """
    Initialize the RBAC system.
    Creates default roles and permissions if they don't exist.
    """
    with app.app_context():
        db_session = current_app.db_session
        
        # Define default roles
        default_roles = {
            'admin': 'Administrator with full system access',
            'instructor': 'Instructor with content management access',
            'student': 'Student with limited access'
        }
        
        # Define default permissions
        default_permissions = {
            'admin': [
                ('admin_panel_access', 'admin_panel', 'read'),
                ('manage_users', 'user', 'write'),
                ('manage_content', 'content', 'write'),
                ('view_analytics', 'analytics', 'read')
            ],
            'instructor': [
                ('create_content', 'content', 'write'),
                ('edit_content', 'content', 'update'),
                ('view_student_progress', 'student_progress', 'read')
            ],
            'student': [
                ('view_content', 'content', 'read'),
                ('submit_exercises', 'exercise', 'write'),
                ('view_own_progress', 'own_progress', 'read')
            ]
        }
        
        # Create roles if they don't exist
        for role_name, role_desc in default_roles.items():
            role = Role.query.filter_by(name=role_name).first()
            if role is None:
                role = Role(name=role_name, description=role_desc)
                db_session.add(role)
        
        # Commit roles first to get IDs
        db_session.commit()
        
        # Create permissions if they don't exist
        for role_name, perms in default_permissions.items():
            role = Role.query.filter_by(name=role_name).first()
            if role:
                for perm_name, resource, action in perms:
                    permission = Permission.query.filter_by(
                        name=perm_name, 
                        resource=resource, 
                        action=action,
                        role_id=role.id
                    ).first()
                    
                    if permission is None:
                        permission = Permission(
                            name=perm_name,
                            resource=resource,
                            action=action,
                            role_id=role.id
                        )
                        db_session.add(permission)
        
        # Commit all changes
        db_session.commit()

def has_permission(user, resource, action):
    """
    Check if a user has a specific permission.
    """
    if user is None:
        return False
    
    # Admin role has all permissions
    if user.has_role('admin'):
        return True
    
    # Check user's roles for the specific permission
    for role in user.roles:
        for permission in role.permissions:
            if permission.resource == resource and permission.action == action:
                return True
    
    return False

def permission_required(resource, action):
    """
    Decorator to require a specific permission for a view.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not g.user:
                return redirect(url_for('auth.login', next=request.endpoint))
            
            if not has_permission(g.user, resource, action):
                flash('You do not have permission to access this resource.', 'error')
                return redirect(url_for('index'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def assign_role_to_user(user, role_name):
    """
    Assign a role to a user.
    """
    db_session = current_app.db_session
    role = Role.query.filter_by(name=role_name).first()
    
    if role is None:
        raise ValueError(f"Role {role_name} does not exist")
    
    if role not in user.roles:
        user.roles.append(role)
        db_session.commit()
        return True
    
    return False

def remove_role_from_user(user, role_name):
    """
    Remove a role from a user.
    """
    db_session = current_app.db_session
    role = Role.query.filter_by(name=role_name).first()
    
    if role is None:
        raise ValueError(f"Role {role_name} does not exist")
    
    if role in user.roles:
        user.roles.remove(role)
        db_session.commit()
        return True
    
    return False
