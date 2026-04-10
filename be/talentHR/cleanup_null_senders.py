#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'talentHR.settings')
django.setup()

from chat.models import ChatMessage

null_msgs = ChatMessage.objects.filter(sender__isnull=True, is_ai=False)
count = null_msgs.count()
print(f'Found {count} messages with NULL sender (non-AI)')
null_msgs.delete()
print(f'Deleted {count} messages')
