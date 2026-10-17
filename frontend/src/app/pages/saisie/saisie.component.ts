import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CRENEAUX, Creneau, JOURS, messagesErreur } from '../../models';

@Component({
  selector: 'app-saisie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './saisie.component.html',
  styleUrls: ['./saisie.component.css']
})
export class SaisieComponent implements OnInit {
  jours = JOURS;
  creneaux = CRENEAUX;
  /** indispo["jour_creneau"] = true si le bénévole est indisponible */
  indispo: Record<string, boolean> = {};
  planningGenere: Creneau[] | null = null;
  heures = 0;
  messages: string[] = [];
  enCours = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getIndisponibilites().subscribe(res => {
      for (const i of res.indisponibilites) {
        this.indispo[this.cle(i.jour, i.creneau)] = true;
      }
    });
  }

  cle(jour: number, creneau: number): string {
    return `${jour}_${creneau}`;
  }

  journeeEntiere(jour: number): boolean {
    return this.creneaux.every(([c]) => this.indispo[this.cle(jour, c)]);
  }

  basculerJournee(jour: number, valeur: boolean) {
    for (const [c] of this.creneaux) {
      this.indispo[this.cle(jour, c)] = valeur;
    }
  }

  libelleJour(jour: number): string {
    return JOURS.find(([j]) => j === jour)?.[1] ?? '';
  }

  libelleCreneau(creneau: number): string {
    return CRENEAUX.find(([c]) => c === creneau)?.[1] ?? '';
  }

  onSubmit() {
    const indisponibilites: Creneau[] = [];
    for (const [jour] of this.jours) {
      for (const [creneau] of this.creneaux) {
        if (this.indispo[this.cle(jour, creneau)]) {
          indisponibilites.push({ jour, creneau });
        }
      }
    }

    this.enCours = true;
    this.messages = [];
    this.api.saveIndisponibilites(indisponibilites).subscribe({
      next: res => {
        this.enCours = false;
        this.planningGenere = res.planning_genere;
        this.heures = res.heures;
      },
      error: err => {
        this.enCours = false;
        this.messages = messagesErreur(err);
      },
    });
  }

  logout() {
    this.auth.logout();
  }
}
