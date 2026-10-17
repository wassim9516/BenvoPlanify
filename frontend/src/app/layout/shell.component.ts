import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../components/icon.component';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { initiales } from '../models';

interface LienNav {
  lien: string;
  libelle: string;
  icone: string;
}

/** Mise en page des pages connectées : barre latérale + barre supérieure. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  readonly liens: LienNav[] = [
    { lien: '/tableau-de-bord', libelle: 'Tableau de bord', icone: 'dashboard' },
    { lien: '/planning', libelle: 'Planning', icone: 'calendar' },
    { lien: '/disponibilites', libelle: 'Mes disponibilités', icone: 'clock' },
    { lien: '/messagerie', libelle: 'Messagerie', icone: 'mail' },
    { lien: '/profil', libelle: 'Mon profil', icone: 'user' },
  ];

  private session = inject(SessionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly menuOuvert = signal(false);
  readonly profil = this.session.profil;
  readonly nomComplet = computed(() => {
    const p = this.profil();
    return p ? `${p.prenom} ${p.nom}` : '';
  });
  readonly initiales = computed(() => initiales(this.nomComplet()));

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.session.rafraichir();
    // Met à jour le compteur de messages non lus à chaque changement de page
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.menuOuvert.set(false);
      this.session.rafraichir();
    });
  }

  logout() {
    this.auth.logout();
    this.session.vider();
    this.router.navigate(['/login']);
  }
}
