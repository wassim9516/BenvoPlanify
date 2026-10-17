import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Annonce, CRENEAUX, Coordination, JOURS, MAX_PAR_CRENEAU, initiales, messagesErreur } from '../../models';

@Component({
  selector: 'app-coordination',
  imports: [FormsModule, DatePipe, IconComponent],
  templateUrl: './coordination.component.html',
  styleUrl: './coordination.component.css',
})
export class CoordinationComponent implements OnInit {
  readonly jours = JOURS;
  readonly creneaux = CRENEAUX;
  readonly max = MAX_PAR_CRENEAU;
  readonly initiales = initiales;

  readonly data = signal<Coordination | null>(null);
  readonly annonces = signal<Annonce[]>([]);
  readonly recherche = signal('');

  readonly benevolesFiltres = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const liste = this.data()?.benevoles ?? [];
    return terme
      ? liste.filter(b => `${b.prenom} ${b.nom} ${b.email}`.toLowerCase().includes(terme))
      : liste;
  });

  readonly creneauxVides = computed(() => {
    const c = this.data()?.couverture;
    return c ? c.creneaux_total - c.creneaux_couverts : 0;
  });

  nouvelleAnnonce = { titre: '', contenu: '' };
  publication = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getCoordination().subscribe({
      next: data => this.data.set(data),
      error: err => this.toast.error(messagesErreur(err)[0]),
    });
    this.api.getAnnonces().subscribe(annonces => this.annonces.set(annonces));
  }

  occupation(jour: number, creneau: number): number {
    return this.data()?.occupation[jour]?.[creneau] ?? 0;
  }

  progression(heures: number): number {
    const objectif = this.data()?.heures_objectif ?? 20;
    return Math.min(100, Math.round(100 * heures / objectif));
  }

  publier() {
    const { titre, contenu } = this.nouvelleAnnonce;
    if (!titre.trim() || !contenu.trim()) {
      return;
    }
    this.publication = true;
    this.api.publierAnnonce(titre.trim(), contenu.trim()).subscribe({
      next: annonce => {
        this.publication = false;
        this.annonces.update(liste => [annonce, ...liste]);
        this.nouvelleAnnonce = { titre: '', contenu: '' };
        this.toast.success('Annonce publiée.');
      },
      error: err => {
        this.publication = false;
        this.toast.error(messagesErreur(err)[0]);
      },
    });
  }

  supprimer(annonce: Annonce) {
    if (!confirm(`Supprimer l’annonce « ${annonce.titre} » ?`)) {
      return;
    }
    this.api.supprimerAnnonce(annonce.id).subscribe({
      next: () => {
        this.annonces.update(liste => liste.filter(a => a.id !== annonce.id));
        this.toast.success('Annonce supprimée.');
      },
      error: err => this.toast.error(messagesErreur(err)[0]),
    });
  }
}
