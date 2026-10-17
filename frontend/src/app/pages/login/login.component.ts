import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { messagesErreur } from '../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class LoginComponent {
  messages: string[] = [];
  enCours = false;

  formFields = [
    { name: 'email', label: 'Email', type: 'email', value: '' },
    { name: 'password', label: 'Mot de passe', type: 'password', value: '' }
  ];

  constructor(public auth: AuthService, private router: Router) {}

  onSubmit() {
    const [email, password] = this.formFields.map(f => f.value);
    this.messages = [];
    this.enCours = true;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/espace-perso']),
      error: err => {
        this.enCours = false;
        this.messages = err.status === 401 ? ['Email ou mot de passe incorrect'] : messagesErreur(err);
      },
    });
  }
}
