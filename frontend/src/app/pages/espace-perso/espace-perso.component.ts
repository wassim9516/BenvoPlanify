import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Profil, messagesErreur } from '../../models';

@Component({
  selector: 'app-espace-perso',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './espace-perso.component.html',
  styleUrl: './espace-perso.component.css'
})
export class EspacePersoComponent implements OnInit {
  user: Profil | null = null;
  edition: Profil | null = null;
  messages: string[] = [];

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.api.getProfil().subscribe({
      next: profil => this.user = profil,
      error: err => this.messages = messagesErreur(err),
    });
  }

  navigateTo(page: string) {
    this.router.navigate(['/', page]);
  }

  modifier() {
    this.edition = this.user ? { ...this.user } : null;
    this.messages = [];
  }

  enregistrer() {
    if (!this.edition) {
      return;
    }
    const { nom, prenom, email, date_naiss } = this.edition;
    this.api.updateProfil({ nom, prenom, email, date_naiss }).subscribe({
      next: profil => {
        this.user = profil;
        this.edition = null;
        this.messages = ['Informations mises à jour'];
      },
      error: err => this.messages = messagesErreur(err),
    });
  }

  logout() {
    this.auth.logout();
  }
}
