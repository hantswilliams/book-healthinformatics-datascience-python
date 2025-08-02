import os
from flask import Flask, render_template, flash, redirect, url_for, g
from config import get_config
from database import init_db
from auth import auth_bp, login_required, load_logged_in_user
from rbac import init_rbac, permission_required
from progress import progress_bp
from datetime import datetime, timedelta
import glob

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
    app.register_blueprint(progress_bp)
    
    # Initialize database
    init_db(app)
    
    # Initialize RBAC
    init_rbac(app)
    
    # Register global template functions
    @app.context_processor
    def inject_user():
        return {'user': g.user if hasattr(g, 'user') else None}
    
    @app.context_processor
    def inject_date_utils():
        return {
            'now': datetime.utcnow(),
            'timedelta': timedelta
        }
    
    @app.context_processor
    def inject_chapters():
        """
        Get all available chapters from the templates/chapters directory
        and make them available to all templates
        """
        chapters = []
        chapter_dirs = glob.glob(os.path.join(app.root_path, 'templates/chapters/*'))
        
        for chapter_dir in sorted(chapter_dirs):
            if os.path.isdir(chapter_dir):
                chapter_id = os.path.basename(chapter_dir)
                # Customize the chapter title and emoji based on the ID
                emoji = "📚"  # Default emoji
                if "chapter1" in chapter_id:
                    title = "Getting Started"
                else:
                    # Generate title from the chapter ID (e.g., "chapter1" -> "Chapter 1")
                    title = chapter_id.replace('chapter', 'Chapter ')
                
                chapters.append({
                    'id': chapter_id,
                    'title': title,
                    'emoji': emoji
                })
        
        return {'chapters': chapters}
    
    # Define routes
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/chapter/<chapter_id>')
    @login_required
    def chapter(chapter_id):
        """
        Generic route for any chapter
        """
        chapter_path = os.path.join(app.root_path, f'templates/chapters/{chapter_id}')
        
        if not os.path.exists(chapter_path):
            flash(f'Chapter {chapter_id} not found', 'error')
            return redirect(url_for('index'))
        
        # Get chapter title from context processor
        chapter_title = f"Chapter {chapter_id.replace('chapter', '')}"
        for chapter in g.get('chapters', []):
            if chapter['id'] == chapter_id:
                chapter_title = f"Chapter {chapter_id.replace('chapter', '')}: {chapter['title']}"
                break
        
        return render_template(f'chapters/{chapter_id}/index.html', 
                            chapter_id=chapter_id, 
                            page_id="index",
                            page_title=chapter_title)
    
    @app.route('/chapter1')
    @login_required
    def chapter1():
        """Legacy route - redirects to new chapter route"""
        return redirect(url_for('chapter', chapter_id='chapter1'))
    
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