from django.db import connection, transaction
from django.db.models import Count

from .models import CRENEAUX, JOURS, EmploiDuTemps, Indisponibilite

JOURS_IDS = [j[0] for j in JOURS]
CRENEAUX_IDS = [c[0] for c in CRENEAUX]

MAX_BENEVOLES_PAR_CRENEAU = 3
HEURES_PAR_CRENEAU = 2
HEURES_MAX_SEMAINE = 20

# Identifiant arbitraire du verrou PostgreSQL qui sérialise la génération du planning
VERROU_PLANNING = 424242


def creneau_valide(jour, creneau):
    return jour in JOURS_IDS and creneau in CRENEAUX_IDS


def construire_emploi_du_temps():
    """Retourne {jour: {creneau: ["Prénom Nom", ...]}} pour toute la semaine."""
    emploi_du_temps = {j: {c: [] for c in CRENEAUX_IDS} for j in JOURS_IDS}
    for affectation in EmploiDuTemps.objects.select_related('benevole'):
        benevole = affectation.benevole
        emploi_du_temps[affectation.jour][affectation.creneau].append(f"{benevole.prenom} {benevole.nom}")
    return emploi_du_temps


def occupation_par_creneau():
    """Retourne {(jour, creneau): nombre de bénévoles affectés}."""
    return {
        (row['jour'], row['creneau']): row['total']
        for row in EmploiDuTemps.objects.values('jour', 'creneau').annotate(total=Count('id'))
    }


def statistiques_couverture():
    occupation = occupation_par_creneau()
    nb_creneaux = len(JOURS_IDS) * len(CRENEAUX_IDS)
    places_total = nb_creneaux * MAX_BENEVOLES_PAR_CRENEAU
    places_prises = sum(occupation.values())
    return {
        'creneaux_total': nb_creneaux,
        'creneaux_couverts': sum(1 for n in occupation.values() if n > 0),
        'creneaux_complets': sum(1 for n in occupation.values() if n >= MAX_BENEVOLES_PAR_CRENEAU),
        'places_total': places_total,
        'places_prises': places_prises,
        'taux_remplissage': round(100 * places_prises / places_total),
    }


def _verrouiller_planning():
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [VERROU_PLANNING])


@transaction.atomic
def enregistrer_indisponibilites_et_generer(benevole, indisponibilites):
    """
    Remplace les indisponibilités du bénévole puis régénère son planning.

    Les créneaux disponibles les moins remplis sont attribués en premier
    (à égalité : ordre chronologique), avec au plus 3 bénévoles par créneau
    et 20h par semaine. Retourne (liste des (jour, creneau) attribués, heures).
    """
    _verrouiller_planning()

    Indisponibilite.objects.filter(benevole=benevole).delete()
    indispo = set(indisponibilites)
    Indisponibilite.objects.bulk_create(
        Indisponibilite(benevole=benevole, jour=j, creneau=c) for j, c in sorted(indispo)
    )

    EmploiDuTemps.objects.filter(benevole=benevole).delete()
    occupation = occupation_par_creneau()

    candidats = [
        (j, c) for j in JOURS_IDS for c in CRENEAUX_IDS
        if (j, c) not in indispo and occupation.get((j, c), 0) < MAX_BENEVOLES_PAR_CRENEAU
    ]
    candidats.sort(key=lambda jc: (occupation.get(jc, 0), jc))

    nb_creneaux = HEURES_MAX_SEMAINE // HEURES_PAR_CRENEAU
    planning_genere = sorted(candidats[:nb_creneaux])
    EmploiDuTemps.objects.bulk_create(
        EmploiDuTemps(benevole=benevole, jour=j, creneau=c) for j, c in planning_genere
    )
    return planning_genere, len(planning_genere) * HEURES_PAR_CRENEAU
