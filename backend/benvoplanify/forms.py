from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.db import transaction
from .models import Benevole, Message

User = get_user_model()

class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['receiver', 'content']
        widgets = {
            'receiver': forms.Select(attrs={'class': 'form-control'}),
            'content': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user is not None:
            # On ne s'envoie pas de message à soi-même
            self.fields['receiver'].queryset = User.objects.exclude(pk=user.pk)


class BenevoleForm(forms.ModelForm):
    """Modifie le bénévole et garde son compte utilisateur synchronisé."""

    class Meta:
        model = Benevole
        fields = ['nom', 'prenom', 'email', 'date_naiss']
        widgets = {
            'date_naiss': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exclude(pk=self.instance.user_id).exists():
            raise forms.ValidationError("Email déjà existant")
        return email

    @transaction.atomic
    def save(self, commit=True):
        benevole = super().save(commit=commit)
        if commit:
            user = benevole.user
            for champ in self.Meta.fields:
                setattr(user, champ, getattr(benevole, champ))
            user.save(update_fields=self.Meta.fields)
        return benevole

class CustomUserRegistrationForm(forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput, label="Mot de passe")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirmer le mot de passe")

    class Meta:
        model = User
        fields = ['email', 'nom', 'prenom', 'date_naiss']
        widgets = {
            'date_naiss': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email déjà existant")
        return email

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Les mots de passe ne correspondent pas")
        return password2

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
            Benevole.objects.create(
                user=user,
                nom=user.nom,
                prenom=user.prenom,
                email=user.email,
                date_naiss=user.date_naiss,
            )
        return user

class CustomAuthenticationForm(AuthenticationForm):
    error_messages = {
        'invalid_login': "Email ou mot de passe incorrect",
        'inactive': "Ce compte est désactivé",
    }
