"""
Authentication module for the application.
This module handles user login, registration, and session management.
"""
import functools
from flask import Blueprint, request, redirect, url_for, flash, render_template, session, g, current_app
from werkzeug.security import check_password_hash
from database.models import User

# Create the blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=('GET', 'POST'))
def register():
    """
    Handle user registration.
    """
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        
        error = None
        
        # Basic validation
        if not username:
            error = 'Username is required.'
        elif not email:
            error = 'Email is required.'
        elif not password:
            error = 'Password is required.'
        elif password != confirm_password:
            error = 'Passwords do not match.'
        
        # Check if username or email already exists
        if not error:
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                if existing_user.username == username:
                    error = f'User {username} is already registered.'
                else:
                    error = f'Email {email} is already registered.'
        
        # Create new user if validation passes
        if not error:
            new_user = User(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            db_session = current_app.db_session
            db_session.add(new_user)
            db_session.commit()
            
            flash('Registration successful! You can now log in.', 'success')
            return redirect(url_for('auth.login'))
        
        flash(error, 'error')
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=('GET', 'POST'))
def login():
    """
    Handle user login.
    """
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False) == 'on'
        
        error = None
        
        # Basic validation
        if not username:
            error = 'Username is required.'
        elif not password:
            error = 'Password is required.'
        
        # Authenticate user
        if not error:
            user = User.query.filter_by(username=username).first()
            
            if user is None or not user.check_password(password):
                error = 'Invalid username or password.'
            elif not user.is_active:
                error = 'This account has been deactivated.'
        
        # Set up session if authentication succeeds
        if not error:
            session.clear()
            session['user_id'] = user.id
            session.permanent = remember
            
            flash('Login successful!', 'success')
            
            # Redirect to requested page or default to index
            next_page = request.args.get('next', 'index')
            return redirect(url_for(next_page))
        
        flash(error, 'error')
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    """
    Handle user logout.
    """
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@auth_bp.route('/account', methods=('GET', 'POST'))
def account_settings():
    """
    Handle user account settings.
    """
    # Redirect to login if user is not logged in
    if g.user is None:
        return redirect(url_for('auth.login', next=request.endpoint))
        
    if request.method == 'POST':
        # Get form data
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        error = None
        success_msg = None
        
        # Get current user
        user = g.user
        db_session = current_app.db_session
        
        # Handle profile update (name and email)
        if 'update_profile' in request.form:
            # Check if email already exists (but not for current user)
            if email != user.email:
                existing_user = User.query.filter_by(email=email).first()
                if existing_user:
                    error = f'Email {email} is already registered.'
            
            if not error:
                # Update user profile
                user.first_name = first_name
                user.last_name = last_name
                user.email = email
                db_session.commit()
                success_msg = 'Profile updated successfully!'
        
        # Handle password change
        elif 'change_password' in request.form:
            # Validate current password
            if not current_password:
                error = 'Current password is required.'
            elif not user.check_password(current_password):
                error = 'Current password is incorrect.'
            elif not new_password:
                error = 'New password is required.'
            elif new_password != confirm_password:
                error = 'New passwords do not match.'
            
            if not error:
                # Update password
                user.set_password(new_password)
                db_session.commit()
                success_msg = 'Password changed successfully!'
        
        if error:
            flash(error, 'error')
        if success_msg:
            flash(success_msg, 'success')
    
    return render_template('auth/account.html')
def account():
    """
    Handle user account settings.
    """
    if request.method == 'POST':
        # Get form data
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        error = None
        success_msg = None
        
        # Get current user
        user = g.user
        db_session = current_app.db_session
        
        # Handle profile update (name and email)
        if 'update_profile' in request.form:
            # Check if email already exists (but not for current user)
            if email != user.email:
                existing_user = User.query.filter_by(email=email).first()
                if existing_user:
                    error = f'Email {email} is already registered.'
            
            if not error:
                # Update user profile
                user.first_name = first_name
                user.last_name = last_name
                user.email = email
                db_session.commit()
                success_msg = 'Profile updated successfully!'
        
        # Handle password change
        elif 'change_password' in request.form:
            # Validate current password
            if not current_password:
                error = 'Current password is required.'
            elif not user.check_password(current_password):
                error = 'Current password is incorrect.'
            elif not new_password:
                error = 'New password is required.'
            elif new_password != confirm_password:
                error = 'New passwords do not match.'
            
            if not error:
                # Update password
                user.set_password(new_password)
                db_session.commit()
                success_msg = 'Password changed successfully!'
        
        if error:
            flash(error, 'error')
        if success_msg:
            flash(success_msg, 'success')
    
    return render_template('auth/account.html')

@auth_bp.before_app_request
def load_logged_in_user():
    """
    Load the current user before each request.
    """
    user_id = session.get('user_id')
    
    if user_id is None:
        g.user = None
    else:
        g.user = User.query.get(user_id)

def login_required(view):
    """
    Decorator to require login for views.
    """
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('auth.login', next=request.endpoint))
        
        return view(**kwargs)
    
    return wrapped_view

def role_required(role_name):
    """
    Decorator to require a specific role for views.
    """
    def decorator(view):
        @functools.wraps(view)
        def wrapped_view(**kwargs):
            if g.user is None:
                return redirect(url_for('auth.login', next=request.endpoint))
            
            if not g.user.has_role(role_name):
                flash(f"You don't have permission to access this page. Required role: {role_name}", "error")
                return redirect(url_for('index'))
            
            return view(**kwargs)
        
        return wrapped_view
    
    return decorator
