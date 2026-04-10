"""
ASGI config for talentHR project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
import logging

logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'talentHR.settings')

# Initialize Django first
django.setup()

from django.core.asgi import get_asgi_application

# Get Django ASGI app first
django_asgi_app = get_asgi_application()

# Try to wrap with Socket.IO
try:
	from chat.socketio_server import sio
	import socketio as socketio_module
	logger.info('Loading Socket.IO...')
	application = socketio_module.ASGIApp(sio, django_asgi_app)
	logger.info('✓ Socket.IO loaded successfully')
except Exception as e:
	logger.error(f'Error loading Socket.IO: {e}')
	application = django_asgi_app
