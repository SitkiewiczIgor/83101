from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
from datetime import datetime

# 1. Główny mechanizm (CRUD) dla zadań
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

# 2. Dodatkowy endpoint /health (o który prosiłeś wcześniej)
@api_view(['GET'])
def health_check(request):
    return Response({
        "status": "OK",
        "timestamp": datetime.now().isoformat()
    })
