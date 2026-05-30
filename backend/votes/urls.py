from django.urls import path
from . import views

urlpatterns = [
    path("elections/", views.list_elections),
    path("admin-login/", views.admin_login_by_password),
    path("election/unlock/", views.unlock_election_by_password),
    path("election/resolve/", views.resolve_election_for_receipt),
    path("election/<uuid:election_id>/", views.election_detail),
    path("election/<uuid:election_id>/admin-login/", views.admin_login),
    path("election/<uuid:election_id>/unlock/", views.unlock_election),
    path("election/<uuid:election_id>/force-close/", views.force_close_election),
    path("election/start/", views.start_election),
    path("election/current/", views.current_election),
    path("cast/", views.cast_vote),
    path("verify/<str:receipt_hash>/", views.verify_receipt),
    path("stats/", views.get_stats),
    path("count/", views.trigger_count),
    path("repair-chain/", views.repair_chain),
]
