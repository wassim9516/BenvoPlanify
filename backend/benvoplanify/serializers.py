# serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from .models import Benevole, Message, CRENEAUX, JOURS

User = get_user_model()


class BenevoleSerializer(serializers.ModelSerializer):
    """Vue publique d'un bénévole (sans données personnelles)."""
    class Meta:
        model = Benevole
        fields = ['id', 'user', 'nom', 'prenom']


class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Benevole
        fields = ['id', 'nom', 'prenom', 'email', 'date_naiss']

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
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender_email', 'receiver', 'receiver_email', 'content', 'timestamp', 'is_read']
        read_only_fields = ['timestamp', 'is_read']

    def validate_receiver(self, receiver):
        if receiver == self.context['request'].user:
            raise serializers.ValidationError("Vous ne pouvez pas vous envoyer un message")
        return receiver
