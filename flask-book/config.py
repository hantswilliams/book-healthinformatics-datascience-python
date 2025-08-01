"""
Configuration module for the application.
This module handles loading environment variables and configuring the app.
"""
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

class Config:
    """
    Base configuration class.
    """
    # Load environment file based on FLASK_ENV
    ENV_FILE = os.getenv('ENV_FILE', '.env.development')
    
    @staticmethod
    def load_env():
        """
        Load environment variables from the appropriate .env file.
        """
        # Get the directory containing the application
        env_file = os.getenv('ENV_FILE', '.env.development')
        app_dir = Path(__file__).parent
        env_path = app_dir / env_file
        
        # Check if the file exists
        if env_path.exists():
            load_dotenv(env_path)
        else:
            # Fallback to .env if specific file doesn't exist
            load_dotenv(app_dir / '.env')
    
    # Call the method to load environment variables
    load_env = staticmethod(load_env)
    load_env()
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_key_replace_in_production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't', 'y', 'yes']
    
    # Session settings
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV', 'development') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Database settings are loaded dynamically from the database module

class DevelopmentConfig(Config):
    """
    Development configuration.
    """
    ENV_FILE = '.env.development'
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """
    Testing configuration.
    """
    ENV_FILE = '.env.testing'
    DEBUG = True
    TESTING = True
    
class ProductionConfig(Config):
    """
    Production configuration.
    """
    ENV_FILE = '.env.production'
    DEBUG = False
    TESTING = False
    
    # Enhanced security settings for production
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True

# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """
    Get the appropriate configuration based on FLASK_ENV.
    """
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
