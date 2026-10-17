import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Annonce, Benevole, EmploiDuTemps, Indisponibilite, Message
from .planning import enregistrer_indisponibilites_et_generer

User = get_user_model()
MOT_DE_PASSE = 'MotDePasse!2024'


def creer_benevole(email, nom='Nom', prenom='Prenom'):
    user = User.objects.create_user(
        email=email, password=MOT_DE_PASSE, nom=nom, prenom=prenom,
        date_naiss=datetime.date(2000, 1, 1),
    )
    benevole = Benevole.objects.create(
        user=user, nom=nom, prenom=prenom, email=email, date_naiss=user.date_naiss,
    )
    return user, benevole


class PlanningTests(TestCase):
    def test_vingt_heures_hors_indisponibilites(self):
        _, benevole = creer_benevole('a@test.fr')
        indispo = [(0, c) for c in (8, 10, 12, 14, 16)]  # tout le lundi
        planning, heures = enregistrer_indisponibilites_et_generer(benevole, indispo)

        self.assertEqual(heures, 20)
        self.assertEqual(len(planning), 10)
        self.assertFalse(any(jour == 0 for jour, _ in planning))
        self.assertEqual(Indisponibilite.objects.filter(benevole=benevole).count(), 5)

    def test_max_trois_benevoles_par_creneau(self):
        benevoles = [creer_benevole(f'b{i}@test.fr')[1] for i in range(4)]
        # Seul le lundi 8h est disponible pour tout le monde
        indispo = [(j, c) for j in range(7) for c in (8, 10, 12, 14, 16) if (j, c) != (0, 8)]
        heures = [enregistrer_indisponibilites_et_generer(b, indispo)[1] for b in benevoles]

        self.assertEqual(heures, [2, 2, 2, 0])
        self.assertEqual(EmploiDuTemps.objects.filter(jour=0, creneau=8).count(), 3)

    def test_repartition_sur_les_creneaux_les_moins_remplis(self):
        _, b1 = creer_benevole('c1@test.fr')
        _, b2 = creer_benevole('c2@test.fr')
        p1, _ = enregistrer_indisponibilites_et_generer(b1, [])
        p2, _ = enregistrer_indisponibilites_et_generer(b2, [])
        self.assertTrue(set(p1).isdisjoint(p2))

    def test_regeneration_remplace_l_ancien_planning(self):
        _, benevole = creer_benevole('d@test.fr')
        enregistrer_indisponibilites_et_generer(benevole, [])
        enregistrer_indisponibilites_et_generer(benevole, [])
        self.assertEqual(EmploiDuTemps.objects.filter(benevole=benevole).count(), 10)


class VuesHtmlTests(TestCase):
    def setUp(self):
        self.user, self.benevole = creer_benevole('moi@test.fr')
        self.autre, _ = creer_benevole('autre@test.fr')
        self.client.login(email='moi@test.fr', password=MOT_DE_PASSE)

    def test_inscription_cree_le_benevole(self):
        self.client.logout()
        response = self.client.post(reverse('register'), {
            'email': 'nouveau@test.fr', 'nom': 'N', 'prenom': 'P', 'date_naiss': '1999-05-05',
            'password1': MOT_DE_PASSE, 'password2': MOT_DE_PASSE,
        })
        self.assertRedirects(response, reverse('success'))
        self.assertTrue(Benevole.objects.filter(email='nouveau@test.fr').exists())

    def test_messagerie_avec_messages_et_detail(self):
        message = Message.objects.create(sender=self.autre, receiver=self.user, content='Salut')
        self.assertEqual(self.client.get(reverse('messagerie')).status_code, 200)

        response = self.client.get(reverse('messagerie_detail', args=[message.id]))
        self.assertContains(response, 'Salut')
        message.refresh_from_db()
        self.assertTrue(message.is_read)

    def test_modif_benev_synchronise_le_compte(self):
        self.client.post(reverse('modif_benev'), {
            'nom': 'Dupont', 'prenom': 'Jean', 'email': 'nouveau-mail@test.fr', 'date_naiss': '2000-01-01',
        })
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'nouveau-mail@test.fr')
        self.assertEqual(self.user.nom, 'Dupont')

    def test_modif_benev_refuse_un_email_pris(self):
        response = self.client.post(reverse('modif_benev'), {
            'nom': 'X', 'prenom': 'Y', 'email': 'autre@test.fr', 'date_naiss': '2000-01-01',
        })
        self.assertContains(response, 'Email déjà existant')

    def test_indisponibilites_et_planning(self):
        response = self.client.post(reverse('indisponibilite_view'), {'jour_0_toute_journee': 'on'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['heures'], 20)
        self.assertEqual(self.client.get(reverse('emploi_du_temps_view')).status_code, 200)

    def test_pages_protegees(self):
        self.client.logout()
        response = self.client.get(reverse('espace_perso'))
        self.assertEqual(response.status_code, 302)


class ApiTests(APITestCase):
    def setUp(self):
        self.user, self.benevole = creer_benevole('api@test.fr')
        self.autre, _ = creer_benevole('autre@test.fr')

    def authentifier(self):
        response = self.client.post(reverse('api_token'), {'email': 'api@test.fr', 'password': MOT_DE_PASSE})
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_endpoints_proteges_sans_jeton(self):
        for nom in ('api-espace-perso', 'api-emploi-du-temps', 'api_benevoles', 'api-messages'):
            self.assertEqual(self.client.get(reverse(nom)).status_code, 401, nom)

    def test_stats_publiques(self):
        self.assertEqual(self.client.get(reverse('api_stats')).data, {'nb_benevoles': 2})

    def test_inscription(self):
        response = self.client.post(reverse('api_register'), {
            'email': 'n@test.fr', 'nom': 'N', 'prenom': 'P', 'date_naiss': '1999-05-05',
            'password': MOT_DE_PASSE, 'password2': MOT_DE_PASSE,
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Benevole.objects.filter(user__email='n@test.fr').exists())

    def test_profil_lecture_et_modification(self):
        self.authentifier()
        self.assertEqual(self.client.get(reverse('api-espace-perso')).data['email'], 'api@test.fr')
        response = self.client.patch(reverse('api-espace-perso'), {'prenom': 'Alice'})
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.prenom, 'Alice')

    def test_indisponibilites_invalides_refusees(self):
        self.authentifier()
        response = self.client.post(reverse('api-indisponibilites'),
                                    {'indisponibilites': [{'jour': 9, 'creneau': 8}]}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_indisponibilites_et_emploi_du_temps(self):
        self.authentifier()
        response = self.client.post(reverse('api-indisponibilites'),
                                    {'indisponibilites': [{'jour': 0, 'creneau': 8}]}, format='json')
        self.assertEqual(response.data['heures'], 20)
        self.assertEqual(self.client.get(reverse('api-indisponibilites')).data,
                         {'indisponibilites': [{'jour': 0, 'creneau': 8}]})
        self.assertIn('emploi_du_temps', self.client.get(reverse('api-emploi-du-temps')).data)

    def test_benevoles_sans_donnees_personnelles(self):
        self.authentifier()
        data = self.client.get(reverse('api_benevoles')).data
        self.assertEqual(len(data), 1)  # soi-même exclu
        self.assertNotIn('email', data[0])

    def test_messages(self):
        self.authentifier()
        response = self.client.post(reverse('api-messages'), {'receiver': self.autre.id, 'content': 'Coucou'})
        self.assertEqual(response.status_code, 201)
        response = self.client.post(reverse('api-messages'), {'receiver': self.user.id, 'content': 'Moi'})
        self.assertEqual(response.status_code, 400)

        recu = Message.objects.create(sender=self.autre, receiver=self.user, content='Réponse')
        self.assertEqual(len(self.client.get(reverse('api-messages')).data), 1)
        self.client.get(reverse('api-message-detail', args=[recu.id]))
        recu.refresh_from_db()
        self.assertTrue(recu.is_read)


class ApiFonctionnalitesTests(APITestCase):
    def setUp(self):
        self.user, self.benevole = creer_benevole('vol@test.fr', nom='Martin', prenom='Léa')
        self.coord, _ = creer_benevole('coord@test.fr', nom='Durand', prenom='Paul')
        self.coord.is_staff = True
        self.coord.save()

    def authentifier(self, email):
        response = self.client.post(reverse('api_token'), {'email': email, 'password': MOT_DE_PASSE})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    def test_jeton_contient_le_role(self):
        import base64, json
        access = self.authentifier('coord@test.fr').data['access']
        payload = access.split('.')[1]
        payload += '=' * (-len(payload) % 4)
        self.assertTrue(json.loads(base64.urlsafe_b64decode(payload))['is_staff'])

    def test_tableau_de_bord(self):
        enregistrer_indisponibilites_et_generer(self.benevole, [])
        Message.objects.create(sender=self.coord, receiver=self.user, content='Bienvenue')
        Annonce.objects.create(auteur=self.coord, titre='Réunion', contenu='Lundi 18h')
        self.authentifier('vol@test.fr')
        data = self.client.get(reverse('api-tableau-de-bord')).data
        self.assertEqual(data['heures'], 20)
        self.assertEqual(len(data['mes_creneaux']), 10)
        self.assertEqual(data['messages_non_lus'], 1)
        self.assertEqual(data['couverture']['places_prises'], 10)
        self.assertEqual(data['annonces'][0]['titre'], 'Réunion')

    def test_coordination_reservee_aux_coordinateurs(self):
        self.authentifier('vol@test.fr')
        self.assertEqual(self.client.get(reverse('api-coordination')).status_code, 403)
        self.authentifier('coord@test.fr')
        data = self.client.get(reverse('api-coordination')).data
        self.assertEqual(len(data['benevoles']), 2)
        self.assertEqual(data['occupation'][0][8], 0)

    def test_annonces(self):
        self.authentifier('vol@test.fr')
        response = self.client.post(reverse('api-annonces'), {'titre': 'X', 'contenu': 'Y'})
        self.assertEqual(response.status_code, 403)

        self.authentifier('coord@test.fr')
        response = self.client.post(reverse('api-annonces'), {'titre': 'Collecte', 'contenu': 'Samedi'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['auteur_nom'], 'Paul Durand')
        annonce_id = response.data['id']
        self.assertEqual(len(self.client.get(reverse('api-annonces')).data), 1)
        self.assertEqual(self.client.delete(reverse('api-annonce-detail', args=[annonce_id])).status_code, 204)

    def test_messages_envoyes(self):
        Message.objects.create(sender=self.user, receiver=self.coord, content='Question')
        self.authentifier('vol@test.fr')
        data = self.client.get(reverse('api-messages'), {'boite': 'envoyes'}).data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['receiver_nom'], 'Paul Durand')
        self.assertEqual(self.client.get(reverse('api-messages')).data, [])

    def test_changer_mot_de_passe(self):
        self.authentifier('vol@test.fr')
        url = reverse('api-mot-de-passe')
        self.assertEqual(self.client.post(url, {'ancien': 'faux', 'nouveau': 'Nouveau!2025x'}).status_code, 400)
        self.assertEqual(self.client.post(url, {'ancien': MOT_DE_PASSE, 'nouveau': '123'}).status_code, 400)
        self.assertEqual(self.client.post(url, {'ancien': MOT_DE_PASSE, 'nouveau': 'Nouveau!2025x'}).status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Nouveau!2025x'))


class SuperUtilisateurTests(TestCase):
    def test_createsuperuser_cree_un_profil_benevole(self):
        user = User.objects.create_superuser(
            email='admin@test.fr', password=MOT_DE_PASSE, nom='Admin', prenom='Chef',
            date_naiss=datetime.date(1990, 1, 1),
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(Benevole.objects.filter(user=user).exists())
