from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from benvoplanify import views
from .views import (
    AnnonceDetailAPIView, AnnonceListAPIView, ChangerMotDePasseAPIView, CoordinationAPIView,
    EmploiDuTempsAPIView, EspacePersoAPIView, IndisponibiliteAPIView, JetonAPIView,
    MessageDetailAPIView, MessageListAPIView, TableauDeBordAPIView,
)

urlpatterns = [
    path('', views.home_view, name='home'),
    path('register/', views.register, name='register'),
    path('success/', views.success, name='success'),
    path('espace-personnel/', views.espace_perso, name='espace_perso'),
    path('modifier-benevole/', views.modif_benev, name='modif_benev'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('indisponibilites/', views.indisponibilite_view, name='indisponibilite_view'),
    path('emploi-du-temps/', views.emploi_du_temps_view, name='emploi_du_temps_view'),
    path('messagerie/', views.messagerie, name='messagerie'),
    path('messagerie/<int:message_id>/', views.messagerie, name='messagerie_detail'),

    # API REST (authentification JWT)
    path('api/token/', JetonAPIView.as_view(), name='api_token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/stats/', views.api_stats, name='api_stats'),
    path('api/benevoles/', views.benevoles_list, name='api_benevoles'),
    path('api/emploi-du-temps/', EmploiDuTempsAPIView.as_view(), name='api-emploi-du-temps'),
    path('api/indisponibilites/', IndisponibiliteAPIView.as_view(), name='api-indisponibilites'),
    path('api/espace-perso/', EspacePersoAPIView.as_view(), name='api-espace-perso'),
    path('api/messages/', MessageListAPIView.as_view(), name='api-messages'),
    path('api/messages/<int:message_id>/', MessageDetailAPIView.as_view(), name='api-message-detail'),
    path('api/tableau-de-bord/', TableauDeBordAPIView.as_view(), name='api-tableau-de-bord'),
    path('api/coordination/', CoordinationAPIView.as_view(), name='api-coordination'),
    path('api/annonces/', AnnonceListAPIView.as_view(), name='api-annonces'),
    path('api/annonces/<int:annonce_id>/', AnnonceDetailAPIView.as_view(), name='api-annonce-detail'),
    path('api/mot-de-passe/', ChangerMotDePasseAPIView.as_view(), name='api-mot-de-passe'),
]
