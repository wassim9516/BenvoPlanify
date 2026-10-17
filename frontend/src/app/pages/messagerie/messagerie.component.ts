import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Benevole, Message, messagesErreur } from '../../models';

@Component({
  selector: 'app-messagerie',
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class MessagerieComponent implements OnInit {
  messages: Message[] = [];
  benevoles: Benevole[] = [];
  messageOuvert: Message | null = null;
  destinataire: number | null = null;
  newMessage = '';
  infos: string[] = [];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.chargerMessages();
    this.api.getBenevoles().subscribe(benevoles => this.benevoles = benevoles);
  }

  chargerMessages() {
    this.api.getMessages().subscribe({
      next: messages => this.messages = messages,
      error: err => this.infos = messagesErreur(err),
    });
  }

  ouvrir(message: Message) {
    this.api.getMessage(message.id).subscribe(detail => {
      this.messageOuvert = detail;
      message.is_read = true;
    });
  }

  sendMessage() {
    if (this.destinataire === null || !this.newMessage.trim()) {
      return;
    }
    this.api.sendMessage(this.destinataire, this.newMessage.trim()).subscribe({
      next: () => {
        this.newMessage = '';
        this.infos = ['Message envoyé avec succès.'];
      },
      error: err => this.infos = messagesErreur(err),
    });
  }

  logout() {
    this.auth.logout();
  }
}
