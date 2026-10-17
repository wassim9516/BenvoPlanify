import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ShellComponent } from './layout/shell.component';
import { TableauDeBordComponent } from './pages/tableau-de-bord/tableau-de-bord.component';
import { PlanningComponent } from './pages/planning/planning.component';
import { DisponibilitesComponent } from './pages/disponibilites/disponibilites.component';
import { MessagerieComponent } from './pages/messagerie/messagerie.component';
import { ProfilComponent } from './pages/profil/profil.component';
import { CoordinationComponent } from './pages/coordination/coordination.component';
import { authGuard, coordinateurGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: HomeComponent, title: 'Benvoplanify — Planning des bénévoles' },
    { path: 'login', component: LoginComponent, title: 'Connexion · Benvoplanify' },
    { path: 'register', component: RegisterComponent, title: 'Inscription · Benvoplanify' },

    // Anciennes adresses
    { path: 'espace-perso', redirectTo: 'tableau-de-bord' },
    { path: 'saisie', redirectTo: 'disponibilites' },

    {
        path: '',
        component: ShellComponent,
        canActivate: [authGuard],
        children: [
            { path: 'tableau-de-bord', component: TableauDeBordComponent, title: 'Tableau de bord · Benvoplanify' },
            { path: 'planning', component: PlanningComponent, title: 'Planning · Benvoplanify' },
            { path: 'disponibilites', component: DisponibilitesComponent, title: 'Disponibilités · Benvoplanify' },
            { path: 'messagerie', component: MessagerieComponent, title: 'Messagerie · Benvoplanify' },
            { path: 'profil', component: ProfilComponent, title: 'Mon profil · Benvoplanify' },
            {
                path: 'coordination', component: CoordinationComponent, canActivate: [coordinateurGuard],
                title: 'Coordination · Benvoplanify',
            },
        ],
    },
    { path: '**', redirectTo: '' },
  ];
