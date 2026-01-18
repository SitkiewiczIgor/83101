from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import TaskViewSet, health_check

# Router automatycznie tworzy adresy typu /tasks/, /tasks/1/
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', health_check),
    path('', include(router.urls)),
]