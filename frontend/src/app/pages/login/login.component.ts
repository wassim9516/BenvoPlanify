import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { AuthService } from '../../services/auth.service';
import { messagesErreur } from '../../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, RouterLink, IconComponent]
})
export class LoginComponent {
  email = '';
  password = '';
  messages: string[] = [];
  enCours = false;

  constructor(public auth: AuthService, private router: Router) {}

  onSubmit() {
    this.messages = [];
    this.enCours = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/tableau-de-bord']),
      error: err => {
        this.enCours = false;
        this.messages = err.status === 401 ? ['Email ou mot de passe incorrect'] : messagesErreur(err);
      },
    });
  }
}
