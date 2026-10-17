import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import {
  Creneau, TableauDeBord, jourCourant, libelleCreneau, libelleJour, messagesErreur, trierParProchaineOccurrence,
} from '../../models';

@Component({
  selector: 'app-tableau-de-bord',
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './tableau-de-bord.component.html',
  styleUrl: './tableau-de-bord.component.css',
})
export class TableauDeBordComponent implements OnInit {
  readonly data = signal<TableauDeBord | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly profil = inject(SessionService).profil;

  readonly prochains = computed(() => trierParProchaineOccurrence(this.data()?.mes_creneaux ?? []).slice(0, 5));
  readonly progression = computed(() => {
    const d = this.data();
    return d ? Math.min(100, Math.round(100 * d.heures / d.heures_objectif)) : 0;
  });
  readonly salutation = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

  readonly libelleJour = libelleJour;
  readonly libelleCreneau = libelleCreneau;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getTableauDeBord().subscribe({
      next: data => this.data.set(data),
      error: err => this.erreur.set(messagesErreur(err)[0]),
    });
  }

  quand(c: Creneau): string {
    const ecart = (c.jour - jourCourant() + 7) % 7;
    if (ecart === 0) {
      return "Aujourd'hui";
    }
    return ecart === 1 ? 'Demain' : libelleJour(c.jour);
  }
}
