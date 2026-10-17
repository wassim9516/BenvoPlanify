import { Routes } from '@angular/router';
import { EspacePersoComponent } from './pages/espace-perso/espace-perso.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MessagerieComponent } from './pages/messagerie/messagerie.component';
import { SaisieComponent } from './pages/saisie/saisie.component';
import { PlanningComponent } from './pages/planning/planning.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'espace-perso', component: EspacePersoComponent, canActivate: [authGuard] },
    { path: 'messagerie', component: MessagerieComponent, canActivate: [authGuard] },
    { path: 'saisie', component: SaisieComponent, canActivate: [authGuard] },
    { path: 'planning', component: PlanningComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' },
  ];
