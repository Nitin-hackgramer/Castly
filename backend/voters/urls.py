from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_digilocker),
    path('verify/', views.verify_digilocker),
    path('status/', views.token_status),
]