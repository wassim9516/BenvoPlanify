import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  nbBenevoles: number | null = null;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getStats().subscribe({
      next: stats => this.nbBenevoles = stats.nb_benevoles,
      error: () => this.nbBenevoles = null,
    });
  }
}
