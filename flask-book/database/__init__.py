"""
Database configuration module for the application.
This module handles the setup and configuration of the SQLAlchemy ORM
based on environment variables.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from flask import current_app

Base = declarative_base()

def get_db_url():
    """
    Generate database URL based on environment variables.
    Supports SQLite and MySQL.
    """
    db_type = os.getenv("DB_TYPE", "sqlite")
    
    if db_type == "sqlite":
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.getenv("DB_NAME", "app.db"))
        return f"sqlite:///{db_path}"
    
    elif db_type == "mysql":
        db_user = os.getenv("DB_USER", "root")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "3306")
        db_name = os.getenv("DB_NAME", "app")
        return f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    else:
        current_app.logger.error(f"Unsupported database type: {db_type}")
        raise ValueError(f"Unsupported database type: {db_type}")

def init_db(app):
    """
    Initialize the database connection and create tables.
    """
    with app.app_context():
        db_url = get_db_url()
        engine = create_engine(db_url, pool_pre_ping=True)
        app.db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
        Base.query = app.db_session.query_property()
        
        # Import all models to ensure they're registered with Base
        from . import models
        from . import progress_models
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        @app.teardown_appcontext
        def shutdown_session(exception=None):
            """
            Remove the database session at the end of the request or when the app shuts down.
            """
            app.db_session.remove()
