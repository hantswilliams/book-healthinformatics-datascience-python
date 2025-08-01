# Health Informatics Learning Platform

A Flask-based web application for learning Python in the context of healthcare data analysis.

## Features

- User authentication (login, registration, session management)
- Role-Based Access Control (RBAC) with predefined roles and permissions
- Database ORM with SQLAlchemy supporting SQLite (development) and MySQL (production)
- Environment-based configuration management

## Project Structure

```
flask-book/
├── app.py                  # Main application entry point
├── config.py               # Configuration handling
├── requirements.txt        # Project dependencies
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── .env.example            # Example environment variables
├── database/               # Database models and configuration
│   ├── __init__.py
│   └── models.py
├── auth/                   # Authentication module
│   └── __init__.py
├── rbac/                   # Role-Based Access Control module
│   └── __init__.py
├── static/                 # Static assets (CSS, JS, images)
└── templates/              # HTML templates
    ├── admin/              # Admin panel templates
    ├── auth/               # Authentication templates
    ├── error/              # Error page templates
    ├── chapter1/           # Course content templates
    ├── base.html           # Base template with layout
    └── index.html          # Homepage template
```

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Development Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd flask-book
```

2. **Create and activate a virtual environment**

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment variables**

```bash
cp .env.example .env.development
# Edit .env.development with your settings
```

5. **Run the application**

```bash
flask run
# or
python app.py
```

The application will be available at http://localhost:5002

### Production Setup

1. **Create and configure production environment**

```bash
cp .env.example .env.production
# Edit .env.production with your production settings
```

2. **Set the environment to production**

```bash
export FLASK_ENV=production
# On Windows: set FLASK_ENV=production
```

3. **Run with a production WSGI server**

```bash
gunicorn app:app
# or
waitress-serve --port=8000 app:app
```

## Database Migration

The application will automatically create the necessary database tables on first run. For schema changes:

1. **Update models in `database/models.py`**
2. **Force recreation of tables** (development only)

```python
# Modify the init_db function in database/__init__.py temporarily
Base.metadata.drop_all(bind=engine)  # Add this line before create_all
Base.metadata.create_all(bind=engine)
```

## Default Roles

The application comes with three predefined roles:

- **Admin**: Full system access
- **Instructor**: Content management and student progress tracking
- **Student**: Content access and exercise submission

## License

[MIT License](LICENSE)
