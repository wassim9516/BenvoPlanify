Nom projet  : projet_L2ab/Benvplanify

Descrition  : Creer une application pour la gestion du planning de benevol.

Ressources  : - Python3
              - Django + Django REST Framework (JWT)
              - PostgreSQL
              - Angular 19 (dossier ../frontend)

## Installation

```bash
cd backend
pip install -r requirements.txt
```

Créer `projet_l2ab/.env` :

```
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=...
DEBUG=True
```

Variables facultatives : `ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS` (listes séparées par des virgules).

```bash
python manage.py migrate
python manage.py runserver        # http://localhost:8000
python manage.py test benvoplanify
```

Frontend : `cd ../frontend && npm install && npm start` (http://localhost:4200).

## API (préfixe /api/)

| Méthode | Route | Auth |
|---|---|---|
| POST | token/ (email, password) → access, refresh | non |
| POST | token/refresh/ | non |
| POST | register/ | non |
| GET | stats/ | non |
| GET | benevoles/ | JWT |
| GET, PATCH | espace-perso/ | JWT |
| GET | emploi-du-temps/ | JWT |
| GET, POST | indisponibilites/ | JWT |
| GET, POST | messages/ | JWT |
| GET | messages/<id>/ | JWT |
| GET | tableau-de-bord/ | JWT |
| POST | mot-de-passe/ (ancien, nouveau) | JWT |
| GET | annonces/ | JWT |
| POST | annonces/ | JWT coordinateur |
| DELETE | annonces/<id>/ | JWT coordinateur |
| GET | coordination/ | JWT coordinateur |

`messages/?boite=envoyes` renvoie les messages envoyés.

## Rôle coordinateur

Un coordinateur est un compte `is_staff`. Il accède à la page « Coordination »
(suivi des bénévoles, carte de couverture, annonces). Pour en créer un :

```bash
python manage.py createsuperuser
```

ou cocher « Statut équipe » sur un utilisateur dans l'admin (http://localhost:8000/admin).
L'utilisateur doit se reconnecter pour que son nouveau rôle soit pris en compte.
