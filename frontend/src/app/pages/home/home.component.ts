import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CRENEAUX, JOURS } from '../../models';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  readonly nbBenevoles = signal<number | null>(null);
  readonly annee = new Date().getFullYear();

  readonly fonctionnalites = [
    { icone: 'sparkles', titre: 'Planning automatique', texte: 'Indiquez vos indisponibilités : les créneaux vous sont attribués en équilibrant la charge de toute l’équipe.' },
    { icone: 'users', titre: '3 bénévoles par créneau', texte: 'Chaque créneau de 2h accueille jusqu’à trois bénévoles, pour une couverture fiable toute la semaine.' },
    { icone: 'mail', titre: 'Messagerie intégrée', texte: 'Échangez avec les autres bénévoles et la coordination sans quitter la plateforme.' },
    { icone: 'download', titre: 'Export agenda', texte: 'Ajoutez vos créneaux à Google Agenda, Outlook ou Calendrier en un clic (.ics).' },
  ];

  readonly etapes = [
    { titre: 'Créez votre compte', texte: 'Inscription en moins d’une minute.' },
    { titre: 'Indiquez vos indisponibilités', texte: 'Cochez simplement les créneaux où vous n’êtes pas libre.' },
    { titre: 'Recevez votre planning', texte: 'Jusqu’à 20h par semaine, réparties automatiquement.' },
  ];

  // Aperçu décoratif du planning affiché dans le bandeau
  readonly apercuJours = JOURS.slice(0, 5).map(([, nom]) => nom.slice(0, 3));
  readonly apercuCreneaux = CRENEAUX.slice(0, 4).map(([, nom]) => nom.slice(0, 3));
  readonly apercu = [
    [3, 2, 1, 3, 2],
    [2, 3, 3, 1, 0],
    [1, 2, 3, 2, 3],
    [3, 1, 2, 3, 2],
  ];

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getStats().subscribe({
      next: stats => this.nbBenevoles.set(stats.nb_benevoles),
      error: () => this.nbBenevoles.set(null),
    });
  }
}
