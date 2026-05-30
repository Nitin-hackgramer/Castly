from django.urls import path
from . import views

urlpatterns = [
    path("verify-chain/", views.verify_chain),
    path("tamper-test/", views.tamper_test),
    path("restore-tamper/", views.restore_tamper),
]
