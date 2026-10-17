from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Benevole, CustomUser, EmploiDuTemps, Indisponibilite, Message


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    ordering = ['email']
    list_display = ['email', 'prenom', 'nom', 'is_staff', 'is_active']
    search_fields = ['email', 'nom', 'prenom']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('nom', 'prenom', 'date_naiss')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'nom', 'prenom', 'date_naiss', 'password1', 'password2')}),
    )


@admin.register(Benevole)
class BenevoleAdmin(admin.ModelAdmin):
    list_display = ['prenom', 'nom', 'email']
    search_fields = ['nom', 'prenom', 'email']


@admin.register(Indisponibilite, EmploiDuTemps)
class CreneauAdmin(admin.ModelAdmin):
    list_display = ['benevole', 'jour', 'creneau']
    list_filter = ['jour', 'creneau']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'timestamp', 'is_read']
