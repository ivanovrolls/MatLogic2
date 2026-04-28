"""Minimal settings override for running tests with SQLite in-memory."""
from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Silence password hashers for speed
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
