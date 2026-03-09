"""
Django settings for collaboration_platform project.
"""

import os
import re
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ==================== СЕКРЕТНЫЕ ДАННЫЕ (БЕРУТСЯ ИЗ .ENV) ====================
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG') == '1'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Application definition
INSTALLED_APPS = [
    'users',
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'social_django',
    'questionnaires',
    'projects',
    'conferences',
    'invitations',
    'notifications',
]

AUTH_USER_MODEL = 'users.CustomUser'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "collaboration_platform.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "collaboration_platform.wsgi.application"

# ==================== БАЗА ДАННЫХ (PostgreSQL) ====================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'collab_db',
        'USER': 'collab_user',
        'PASSWORD': 'mirkuw-9benhy-povBut',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Europe/Moscow"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LOCALE_PATHS = [BASE_DIR / 'locale']

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATICFILES_DIRS = []

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ==================== CORS (твой домен) ====================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://fincollab.ru",
    "https://www.fincollab.ru",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# Настройки файлов
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760

ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.md', '.rtf', '.jpg', '.jpeg', '.png', '.gif',
    '.bmp', '.svg', '.webp', '.zip', '.rar', '.7z', '.tar',
    '.gz', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv',
]

MAX_ATTACHMENTS_PER_COMMENT = 5
THUMBNAIL_SIZE = (200, 200)

# VK ID Settings
SOCIAL_AUTH_VK_OAUTH2_KEY = '54454413'
SOCIAL_AUTH_VK_OAUTH2_SECRET = 'uw0BJzPlVJXWjp7rHlhd'
SOCIAL_AUTH_VK_OAUTH2_SCOPE = ['email', 'photos']
SOCIAL_AUTH_VK_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
    'v': '5.199',
    'revoke': 1,
    'response_type': 'code'
}
SOCIAL_AUTH_VK_OAUTH2_EXTRA_DATA = [
    ('email', 'email'),
    ('access_token', 'access_token'),
    ('user_id', 'user_id'),
    ('expires_in', 'expires_in')
]

SOCIAL_AUTH_ASSOCIATE_BY_MAIL = True
SOCIAL_AUTH_USER_FIELDS = ['email', 'username', 'first_name', 'last_name']
SOCIAL_AUTH_VK_OAUTH2_USERNAME_IS_FULL_EMAIL = False

def social_username_from_email(email):
    if email:
        username = email.split('@')[0].replace('.', '_')
        username = re.sub(r'[^\w]', '_', username)
        return username
    return None

SOCIAL_AUTH_USERNAME_FIXER = social_username_from_email

# Email settings (пока консоль, потом настроим SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ==================== SITE URL (твой домен) ====================
SITE_URL = 'https://fincollab.ru'