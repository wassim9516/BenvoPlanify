from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings

JOURS = [
    (0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'),
    (4, 'Vendredi'), (5, 'Samedi'), (6, 'Dimanche'),
]

CRENEAUX = [
    (8, '08h - 10h'), (10, '10h - 12h'), (12, '12h - 14h'),
    (14, '14h - 16h'), (16, '16h - 18h'),
]

class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Utilise le modèle utilisateur personnalisé
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Utilise le modèle utilisateur personnalisé
        on_delete=models.CASCADE,
        related_name='received_messages'
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Message de {self.sender.email} à {self.receiver.email}"


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est requis")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=255)
    prenom = models.CharField(max_length=255)
    date_naiss = models.DateField()

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom', 'date_naiss']

    def __str__(self):
        return self.email


class Benevole(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    date_naiss = models.DateField()

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Indisponibilite(models.Model):
    benevole = models.ForeignKey(Benevole, on_delete=models.CASCADE)
    jour = models.IntegerField(choices=JOURS)
    creneau = models.IntegerField(choices=CRENEAUX)

    def __str__(self):
        return f"{self.benevole} - {self.get_jour_display()} {self.get_creneau_display()}"


class EmploiDuTemps(models.Model):
    benevole = models.ForeignKey(Benevole, on_delete=models.CASCADE)
    jour = models.IntegerField(choices=JOURS)
    creneau = models.IntegerField(choices=CRENEAUX)

    class Meta:
        unique_together = ('benevole', 'jour', 'creneau')

    def __str__(self):
        return f"{self.benevole} - {self.get_jour_display()} {self.get_creneau_display()}"
