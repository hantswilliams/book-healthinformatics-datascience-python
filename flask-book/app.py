import os
from flask import Flask, render_template, flash, redirect, url_for, g
from config import get_config
from database import init_db
from auth import auth_bp, login_required, load_logged_in_user
from rbac import init_rbac, permission_required

def create_app(config_class=None):
    """
    Application factory pattern to create and configure the Flask app.
    """
    # Create and configure the app
    app = Flask(__name__)
    
    # Load the appropriate configuration
    if config_class is None:
        config_class = get_config()
    
    app.config.from_object(config_class)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    # Initialize database
    init_db(app)
    
    # Initialize RBAC
    init_rbac(app)
    
    # Register global template functions
    @app.context_processor
    def inject_user():
        return {'user': g.user if hasattr(g, 'user') else None}
    
    # Define routes
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/chapter1')
    @login_required
    def chapter1():
        return render_template('chapter1/page1.html')
    
    @app.route('/admin')
    @login_required
    @permission_required('admin_panel', 'read')
    def admin():
        flash('Welcome to the admin panel', 'info')
        return render_template('admin/index.html')
    
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('error/404.html'), 404
    
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('error/500.html'), 500
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Use port from environment if available
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=port)