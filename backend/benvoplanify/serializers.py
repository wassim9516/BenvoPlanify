# serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Annonce, Benevole, Message, CRENEAUX, JOURS

User = get_user_model()


class BenevoleSerializer(serializers.ModelSerializer):
    """Vue publique d'un bénévole (sans données personnelles)."""
    class Meta:
        model = Benevole
        fields = ['id', 'user', 'nom', 'prenom']


class JetonSerializer(TokenObtainPairSerializer):
    """Ajoute le rôle au jeton JWT pour que le frontend adapte la navigation."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        return token


class ProfilSerializer(serializers.ModelSerializer):
    is_coordinateur = serializers.BooleanField(source='user.is_staff', read_only=True)
    messages_non_lus = serializers.SerializerMethodField()

    class Meta:
        model = Benevole
        fields = ['id', 'nom', 'prenom', 'email', 'date_naiss', 'is_coordinateur', 'messages_non_lus']

    def get_messages_non_lus(self, benevole):
        return Message.objects.filter(receiver=benevole.user, is_read=False).count()

    def validate_email(self, email):
        if User.objects.filter(email=email).exclude(pk=self.instance.user_id).exists():
            raise serializers.ValidationError("Email déjà existant")
        return email

    @transaction.atomic
    def update(self, instance, validated_data):
        benevole = super().update(instance, validated_data)
        user = benevole.user
        for champ, valeur in validated_data.items():
            setattr(user, champ, valeur)
        user.save()
        return benevole


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'nom', 'prenom', 'date_naiss', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': "Les mots de passe ne correspondent pas"})
        validate_password(data['password'])
        return data

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        Benevole.objects.create(
            user=user, nom=user.nom, prenom=user.prenom,
            email=user.email, date_naiss=user.date_naiss,
        )
        return user


class IndisponibiliteSerializer(serializers.Serializer):
    jour = serializers.ChoiceField(choices=JOURS)
    creneau = serializers.ChoiceField(choices=CRENEAUX)


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_nom = serializers.SerializerMethodField()
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)
    receiver_nom = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_email', 'sender_nom', 'receiver', 'receiver_email',
                  'receiver_nom', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp', 'is_read']

    def get_sender_nom(self, message):
        return f"{message.sender.prenom} {message.sender.nom}"

    def get_receiver_nom(self, message):
        return f"{message.receiver.prenom} {message.receiver.nom}"

    def validate_receiver(self, receiver):
        if receiver == self.context['request'].user:
            raise serializers.ValidationError("Vous ne pouvez pas vous envoyer un message")
        return receiver


class AnnonceSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = ['id', 'titre', 'contenu', 'date', 'auteur_nom']
        read_only_fields = ['date']

    def get_auteur_nom(self, annonce):
        return f"{annonce.auteur.prenom} {annonce.auteur.nom}" if annonce.auteur else "Coordination"


class ChangerMotDePasseSerializer(serializers.Serializer):
    ancien = serializers.CharField(write_only=True)
    nouveau = serializers.CharField(write_only=True)

    def validate_ancien(self, ancien):
        if not self.context['request'].user.check_password(ancien):
            raise serializers.ValidationError("Mot de passe actuel incorrect")
        return ancien

    def validate_nouveau(self, nouveau):
        validate_password(nouveau, self.context['request'].user)
        return nouveau
