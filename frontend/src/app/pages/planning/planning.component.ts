import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CRENEAUX, EmploiDuTemps, JOURS, messagesErreur } from '../../models';

@Component({
  selector: 'app-planning',
  imports: [CommonModule, RouterLink],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit {
  jours = JOURS;
  creneaux = CRENEAUX;
  emploiDuTemps: EmploiDuTemps['emploi_du_temps'] = {};
  moi = '';
  messages: string[] = [];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getEmploiDuTemps().subscribe({
      next: res => this.emploiDuTemps = res.emploi_du_temps,
      error: err => this.messages = messagesErreur(err),
    });
    this.api.getProfil().subscribe(profil => this.moi = `${profil.prenom} ${profil.nom}`);
  }

  benevoles(jour: number, creneau: number): string[] {
    return this.emploiDuTemps[jour]?.[creneau] ?? [];
  }

  logout() {
    this.auth.logout();
  }
}
