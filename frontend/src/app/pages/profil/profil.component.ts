import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { Profil, initiales, messagesErreur } from '../../models';

@Component({
  selector: 'app-profil',
  imports: [FormsModule, IconComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css',
})
export class ProfilComponent implements OnInit {
  readonly profil = signal<Profil | null>(null);
  readonly initiales = computed(() => {
    const p = this.profil();
    return p ? initiales(`${p.prenom} ${p.nom}`) : '';
  });

  edition = { nom: '', prenom: '', email: '', date_naiss: '' };
  erreursProfil: string[] = [];
  enregistrementProfil = false;

  motDePasse = { ancien: '', nouveau: '', confirmation: '' };
  erreursMotDePasse: string[] = [];
  enregistrementMotDePasse = false;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private session: SessionService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.api.getProfil().subscribe({
      next: profil => this.remplir(profil),
      error: err => this.erreursProfil = messagesErreur(err),
    });
  }

  enregistrerProfil() {
    this.erreursProfil = [];
    this.enregistrementProfil = true;
    this.api.updateProfil(this.edition).subscribe({
      next: profil => {
        this.enregistrementProfil = false;
        this.remplir(profil);
        this.session.profil.set(profil);
        this.toast.success('Informations mises à jour.');
      },
      error: err => {
        this.enregistrementProfil = false;
        this.erreursProfil = messagesErreur(err);
      },
    });
  }

  annuler() {
    const p = this.profil();
    if (p) {
      this.remplir(p);
    }
  }

  changerMotDePasse() {
    if (this.motDePasse.nouveau !== this.motDePasse.confirmation) {
      this.erreursMotDePasse = ['Les mots de passe ne correspondent pas'];
      return;
    }
    this.erreursMotDePasse = [];
    this.enregistrementMotDePasse = true;
    this.api.changerMotDePasse(this.motDePasse.ancien, this.motDePasse.nouveau).subscribe({
      next: () => {
        this.enregistrementMotDePasse = false;
        this.motDePasse = { ancien: '', nouveau: '', confirmation: '' };
        this.toast.success('Mot de passe modifié.');
      },
      error: err => {
        this.enregistrementMotDePasse = false;
        this.erreursMotDePasse = messagesErreur(err);
      },
    });
  }

  private remplir(profil: Profil) {
    this.profil.set(profil);
    const { nom, prenom, email, date_naiss } = profil;
    this.edition = { nom, prenom, email, date_naiss };
  }
}
