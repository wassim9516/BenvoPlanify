import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { Benevole, Message, initiales, messagesErreur } from '../../models';

type Boite = 'recus' | 'envoyes';

@Component({
  selector: 'app-messagerie',
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.css'],
  imports: [FormsModule, DatePipe, IconComponent]
})
export class MessagerieComponent implements OnInit {
  readonly boite = signal<Boite>('recus');
  readonly messages = signal<Message[] | null>(null);
  readonly selection = signal<Message | null>(null);
  readonly redaction = signal(false);
  readonly enCours = signal(false);
  benevoles: Benevole[] = [];

  destinataire: number | null = null;
  contenu = '';

  readonly initiales = initiales;

  constructor(private api: ApiService, private session: SessionService, private toast: ToastService) {}

  ngOnInit() {
    this.charger();
    this.api.getBenevoles().subscribe(benevoles => this.benevoles = benevoles);
  }

  changerBoite(boite: Boite) {
    this.boite.set(boite);
    this.selection.set(null);
    this.charger();
  }

  charger() {
    this.messages.set(null);
    this.api.getMessages(this.boite()).subscribe({
      next: messages => this.messages.set(messages),
      error: err => {
        this.messages.set([]);
        this.toast.error(messagesErreur(err)[0]);
      },
    });
  }

  correspondant(message: Message): string {
    return this.boite() === 'recus' ? message.sender_nom : message.receiver_nom;
  }

  ouvrir(message: Message) {
    this.redaction.set(false);
    this.selection.set(message);
    if (this.boite() === 'recus' && !message.is_read) {
      this.api.getMessage(message.id).subscribe(() => {
        this.messages.update(liste => liste?.map(m => m.id === message.id ? { ...m, is_read: true } : m) ?? null);
        this.session.rafraichir();
      });
    }
  }

  nouveau(destinataire: number | null = null) {
    this.selection.set(null);
    this.destinataire = destinataire;
    this.contenu = '';
    this.redaction.set(true);
  }

  repondre(message: Message) {
    this.nouveau(message.sender);
  }

  envoyer() {
    if (this.destinataire === null || !this.contenu.trim()) {
      return;
    }
    this.enCours.set(true);
    this.api.sendMessage(this.destinataire, this.contenu.trim()).subscribe({
      next: () => {
        this.enCours.set(false);
        this.redaction.set(false);
        this.toast.success('Message envoyé.');
        if (this.boite() === 'envoyes') {
          this.charger();
        }
      },
      error: err => {
        this.enCours.set(false);
        this.toast.error(messagesErreur(err)[0]);
      },
    });
  }
}
