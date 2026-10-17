import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { CRENEAUX, EmploiDuTemps, JOURS, MAX_PAR_CRENEAU, jourCourant, messagesErreur } from '../../models';

@Component({
  selector: 'app-planning',
  imports: [RouterLink, IconComponent],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit {
  readonly jours = JOURS;
  readonly creneaux = CRENEAUX;
  readonly max = MAX_PAR_CRENEAU;
  readonly aujourdHui = jourCourant();

  readonly emploiDuTemps = signal<EmploiDuTemps['emploi_du_temps'] | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly vue = signal<'tous' | 'moi'>('tous');

  readonly moi = computed(() => {
    const p = this.session.profil();
    return p ? `${p.prenom} ${p.nom}` : '';
  });

  readonly mesCreneaux = computed(() => {
    const edt = this.emploiDuTemps();
    const moi = this.moi();
    if (!edt || !moi) {
      return [];
    }
    return JOURS.flatMap(([j]) => CRENEAUX
      .filter(([c]) => edt[j]?.[c]?.includes(moi))
      .map(([c]) => ({ jour: j, creneau: c })));
  });

  constructor(private api: ApiService, private session: SessionService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getEmploiDuTemps().subscribe({
      next: res => this.emploiDuTemps.set(res.emploi_du_temps),
      error: err => this.erreur.set(messagesErreur(err)[0]),
    });
  }

  benevoles(jour: number, creneau: number): string[] {
    return this.emploiDuTemps()?.[jour]?.[creneau] ?? [];
  }

  estMoi(jour: number, creneau: number): boolean {
    return this.benevoles(jour, creneau).includes(this.moi());
  }

  niveau(jour: number, creneau: number): 'vide' | 'partiel' | 'complet' {
    const n = this.benevoles(jour, creneau).length;
    return n === 0 ? 'vide' : n >= this.max ? 'complet' : 'partiel';
  }

  /** Exporte mes créneaux au format iCalendar (événements hebdomadaires récurrents). */
  exporterIcs() {
    const creneaux = this.mesCreneaux();
    if (!creneaux.length) {
      this.toast.info("Vous n'avez aucun créneau à exporter.");
      return;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const format = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const maintenant = new Date();
    const lundi = new Date(maintenant);
    lundi.setHours(0, 0, 0, 0);
    lundi.setDate(lundi.getDate() - jourCourant(maintenant));

    const evenements = creneaux.map(({ jour, creneau }) => {
      const debut = new Date(lundi);
      debut.setDate(lundi.getDate() + jour);
      debut.setHours(creneau);
      const fin = new Date(debut);
      fin.setHours(creneau + 2);
      return [
        'BEGIN:VEVENT',
        `UID:benvoplanify-${jour}-${creneau}@benvoplanify`,
        `DTSTAMP:${format(maintenant)}`,
        `DTSTART:${format(debut)}`,
        `DTEND:${format(fin)}`,
        'RRULE:FREQ=WEEKLY',
        'SUMMARY:Bénévolat — Benvoplanify',
        'END:VEVENT',
      ].join('\r\n');
    });

    const contenu = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Benvoplanify//FR', ...evenements, 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([contenu], { type: 'text/calendar;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = 'mon-planning-benvoplanify.ics';
    lien.click();
    URL.revokeObjectURL(url);
    this.toast.success(`${creneaux.length} créneaux exportés vers votre agenda.`);
  }
}
