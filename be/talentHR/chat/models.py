from django.db import models
from accounts.models import AccountsUser
from jobs.models import JobApplication


class ChatMessage(models.Model):
    """Store chat messages for conversations (both HR-Candidate and AI chat)"""
    
    # Conversation reference - can be application ID or AI conversation
    application = models.ForeignKey(JobApplication, null=True, blank=True, on_delete=models.CASCADE, related_name='chat_messages')
    
    # For AI chat, store which user initiated (both can access)
    ai_chat_user = models.ForeignKey(AccountsUser, null=True, blank=True, on_delete=models.CASCADE, related_name='ai_chat_messages')
    
    # Sender
    sender = models.ForeignKey(AccountsUser, null=True, blank=True, on_delete=models.SET_NULL, related_name='sent_messages')
    
    # Message content
    text = models.TextField()
    
    # Is this an AI-generated message?
    is_ai = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['application', 'created_at']),
            models.Index(fields=['ai_chat_user', 'created_at']),
        ]
    
    def __str__(self):
        conv_type = f"App#{self.application.id}" if self.application else f"AI#{self.ai_chat_user.id}"
        return f"{self.sender.username if self.sender else 'AI'} -> {conv_type}: {self.text[:50]}"
