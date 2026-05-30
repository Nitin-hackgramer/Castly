from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/digilocker/', include('voters.urls')),
    path('api/votes/', include('votes.urls')),
    path('api/audit/', include('audit.urls')),
]