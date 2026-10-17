import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Inscription, messagesErreur } from '../../models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class RegisterComponent {
  formFields = [
    { name: 'email', label: 'Email', type: 'email', value: '' },
    { name: 'nom', label: 'Nom', type: 'text', value: '' },
    { name: 'prenom', label: 'Prénom', type: 'text', value: '' },
    { name: 'date_naiss', label: 'Date de naissance', type: 'date', value: '' },
    { name: 'password', label: 'Mot de passe', type: 'password', value: '' },
    { name: 'password2', label: 'Confirmer le mot de passe', type: 'password', value: '' }
  ];
  messages: string[] = [];
  enCours = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  onSubmit() {
    const data = Object.fromEntries(this.formFields.map(f => [f.name, f.value])) as unknown as Inscription;
    if (data.password !== data.password2) {
      this.messages = ['Les mots de passe ne correspondent pas'];
      return;
    }

    this.messages = [];
    this.enCours = true;
    this.api.register(data).pipe(
      switchMap(() => this.auth.login(data.email, data.password))
    ).subscribe({
      next: () => this.router.navigate(['/espace-perso']),
      error: err => {
        this.enCours = false;
        this.messages = messagesErreur(err);
      },
    });
  }
}
