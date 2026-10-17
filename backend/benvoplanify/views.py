from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login as auth_login, get_user_model, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .models import Benevole, JOURS, CRENEAUX, Indisponibilite, Message
from .forms import BenevoleForm, CustomUserRegistrationForm, CustomAuthenticationForm, MessageForm
from .planning import CRENEAUX_IDS, JOURS_IDS, construire_emploi_du_temps, enregistrer_indisponibilites_et_generer
from django.contrib import messages
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (
    BenevoleSerializer, IndisponibiliteSerializer, MessageSerializer,
    ProfilSerializer, RegisterSerializer,
)
from rest_framework import status
from rest_framework.permissions import AllowAny

User = get_user_model()

@login_required
def emploi_du_temps_view(request):
    return render(request, 'benvoplanify/emploi_du_temps.html', {
        'emploi_du_temps': construire_emploi_du_temps(),
        'jours': JOURS,
        'creneaux': CRENEAUX,
    })

@login_required
def indisponibilite_view(request):
    benevole = get_object_or_404(Benevole, user=request.user)
    context = {'jours': JOURS, 'creneaux': CRENEAUX}

    if request.method == 'POST':
        indisponibilites = []
        for jour in JOURS_IDS:
            toute_journee = request.POST.get(f"jour_{jour}_toute_journee") == "on"
            for creneau in CRENEAUX_IDS:
                if toute_journee or request.POST.get(f"{jour}_{creneau}") == "on":
                    indisponibilites.append((jour, creneau))

        planning_genere, heures = enregistrer_indisponibilites_et_generer(benevole, indisponibilites)
        context.update(planning_genere=planning_genere, heures=heures)

    context['indispo'] = {
        f"{i.jour}_{i.creneau}" for i in Indisponibilite.objects.filter(benevole=benevole)
    }
    return render(request, 'benvoplanify/indisponibilites.html', context)


@login_required
def espace_perso(request):
    benevole = get_object_or_404(Benevole, user=request.user)
    return render(request, 'benvoplanify/espace_perso.html', {'benevole': benevole})



def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            auth_login(request, form.get_user())
            return redirect('espace_perso')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'benvoplanify/login.html', {'form': form})

def logout_view(request):
    auth_logout(request)
    return redirect('home')

def register(request):
    if request.method == 'POST':
        form = CustomUserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            return redirect('success')
    else:
        form = CustomUserRegistrationForm()
    return render(request, 'benvoplanify/register.html', {'form': form})

@login_required
def modif_benev(request):
    benevole = get_object_or_404(Benevole, user=request.user)
    if request.method == 'POST':
        form = BenevoleForm(request.POST, instance=benevole)
        if form.is_valid():
            form.save()
            return redirect('espace_perso')
    else:
        form = BenevoleForm(instance=benevole)
    return render(request, 'benvoplanify/modif_benev.html', {'form': form})

def success(request):
    return render(request, 'benvoplanify/success.html')

def home_view(request):
    return render(request, 'benvoplanify/home.html')

@login_required
def messagerie(request, message_id=None):
    """Gère la messagerie : affichage des messages, envoi et consultation des détails"""
    user = request.user

    messages_recus = Message.objects.filter(receiver=user).select_related('sender').order_by('-timestamp')

    message_detail = None
    if message_id:
        message_detail = get_object_or_404(Message, id=message_id, receiver=user)
        if not message_detail.is_read:
            message_detail.is_read = True
            message_detail.save(update_fields=['is_read'])

    if request.method == 'POST':
        form = MessageForm(request.POST, user=user)
        if form.is_valid():
            message = form.save(commit=False)
            message.sender = user
            message.save()
            messages.success(request, "Message envoyé avec succès.")
            return redirect('messagerie')
    else:
        form = MessageForm(user=user)

    return render(request, 'benvoplanify/messagerie.html', {
        'messages_recus': messages_recus,
        'message_detail': message_detail,
        'form': form,
    })


# ---------------------------------------------------------------- API REST

@api_view(['GET'])
@permission_classes([AllowAny])
def api_stats(request):
    return Response({'nb_benevoles': Benevole.objects.count()})


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'message': 'Inscription réussie'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def benevoles_list(request):
    benevoles = Benevole.objects.exclude(user=request.user).order_by('nom', 'prenom')
    return Response(BenevoleSerializer(benevoles, many=True).data)


class EmploiDuTempsAPIView(APIView):
    def get(self, request):
        return Response({
            "emploi_du_temps": construire_emploi_du_temps(),
            "jours": JOURS,
            "creneaux": CRENEAUX,
        })

class IndisponibiliteAPIView(APIView):
    def get(self, request):
        benevole = get_object_or_404(Benevole, user=request.user)
        indispo = Indisponibilite.objects.filter(benevole=benevole).values('jour', 'creneau')
        return Response({"indisponibilites": list(indispo)})

    def post(self, request):
        benevole = get_object_or_404(Benevole, user=request.user)

        serializer = IndisponibiliteSerializer(data=request.data.get("indisponibilites", []), many=True)
        serializer.is_valid(raise_exception=True)
        indisponibilites = [(e['jour'], e['creneau']) for e in serializer.validated_data]

        planning_genere, heures = enregistrer_indisponibilites_et_generer(benevole, indisponibilites)
        return Response({
            "planning_genere": [{"jour": j, "creneau": c} for j, c in planning_genere],
            "heures": heures,
        }, status=status.HTTP_200_OK)

class EspacePersoAPIView(APIView):
    def get(self, request):
        benevole = get_object_or_404(Benevole, user=request.user)
        return Response(ProfilSerializer(benevole).data)

    def patch(self, request):
        benevole = get_object_or_404(Benevole, user=request.user)
        serializer = ProfilSerializer(benevole, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MessageListAPIView(APIView):
    def get(self, request):
        recus = Message.objects.filter(receiver=request.user).select_related('sender', 'receiver').order_by('-timestamp')
        return Response(MessageSerializer(recus, many=True).data)

    def post(self, request):
        serializer = MessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageDetailAPIView(APIView):
    def get(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, receiver=request.user)
        if not message.is_read:
            message.is_read = True
            message.save(update_fields=['is_read'])
        return Response(MessageSerializer(message).data)
