import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Inscription, messagesErreur } from '../../models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, RouterLink, IconComponent]
})
export class RegisterComponent {
  data: Inscription = { email: '', nom: '', prenom: '', date_naiss: '', password: '', password2: '' };
  messages: string[] = [];
  enCours = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
  ) {}

  onSubmit() {
    if (this.data.password !== this.data.password2) {
      this.messages = ['Les mots de passe ne correspondent pas'];
      return;
    }

    this.messages = [];
    this.enCours = true;
    this.api.register(this.data).pipe(
      switchMap(() => this.auth.login(this.data.email, this.data.password))
    ).subscribe({
      next: () => {
        this.toast.success('Bienvenue sur Benvoplanify !');
        this.router.navigate(['/disponibilites']);
      },
      error: err => {
        this.enCours = false;
        this.messages = messagesErreur(err);
      },
    });
  }
}
