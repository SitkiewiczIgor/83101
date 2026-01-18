from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        # Ten kod mówi: weź wszystkie pola z modelu i zamień je na JSON
        fields = '__all__'