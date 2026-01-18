from django.db import models

class Task(models.Model):
    # Opcje priorytetów
    PRIORITY_CHOICES = [
        ('low', 'Niski'),
        ('medium', 'Średni'),
        ('high', 'Wysoki'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)
    
    # Pola dodatkowe dla Twojego Frontendu
    assignee = models.CharField(max_length=100, blank=True, default='')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    deadline = models.CharField(max_length=20, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
