import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { CRENEAUX, Creneau, JOURS, libelleCreneau, libelleJour, messagesErreur } from '../../models';

@Component({
  selector: 'app-disponibilites',
  imports: [RouterLink, IconComponent],
  templateUrl: './disponibilites.component.html',
  styleUrl: './disponibilites.component.css',
})
export class DisponibilitesComponent implements OnInit {
  readonly jours = JOURS;
  readonly creneaux = CRENEAUX;
  readonly libelleJour = libelleJour;
  readonly libelleCreneau = libelleCreneau;

  /** Clés "jour_creneau" des créneaux où le bénévole est indisponible */
  readonly indispo = signal<Set<string>>(new Set());
  readonly charge = signal(false);
  readonly enCours = signal(false);
  readonly modifie = signal(false);
  readonly resultat = signal<{ planning_genere: Creneau[]; heures: number } | null>(null);

  readonly nbDisponibles = computed(() => JOURS.length * CRENEAUX.length - this.indispo().size);

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getIndisponibilites().subscribe({
      next: res => {
        this.indispo.set(new Set(res.indisponibilites.map(i => this.cle(i.jour, i.creneau))));
        this.charge.set(true);
      },
      error: err => this.toast.error(messagesErreur(err)[0]),
    });
  }

  cle(jour: number, creneau: number): string {
    return `${jour}_${creneau}`;
  }

  estIndispo(jour: number, creneau: number): boolean {
    return this.indispo().has(this.cle(jour, creneau));
  }

  basculer(jour: number, creneau: number) {
    this.modifier(set => {
      const cle = this.cle(jour, creneau);
      set.has(cle) ? set.delete(cle) : set.add(cle);
    });
  }

  journeeIndispo(jour: number): boolean {
    return CRENEAUX.every(([c]) => this.estIndispo(jour, c));
  }

  basculerJournee(jour: number) {
    const indispo = !this.journeeIndispo(jour);
    this.modifier(set => CRENEAUX.forEach(([c]) => indispo ? set.add(this.cle(jour, c)) : set.delete(this.cle(jour, c))));
  }

  toutDisponible() {
    this.modifier(set => set.clear());
  }

  enregistrer() {
    const indisponibilites = [...this.indispo()].map(cle => {
      const [jour, creneau] = cle.split('_').map(Number);
      return { jour, creneau };
    });

    this.enCours.set(true);
    this.api.saveIndisponibilites(indisponibilites).subscribe({
      next: res => {
        this.enCours.set(false);
        this.modifie.set(false);
        this.resultat.set(res);
        this.toast.success(`Planning mis à jour : ${res.heures}h attribuées.`);
      },
      error: err => {
        this.enCours.set(false);
        this.toast.error(messagesErreur(err)[0]);
      },
    });
  }

  private modifier(action: (set: Set<string>) => void) {
    const copie = new Set(this.indispo());
    action(copie);
    this.indispo.set(copie);
    this.modifie.set(true);
  }
}
