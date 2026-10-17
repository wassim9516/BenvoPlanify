export const JOURS: [number, string][] = [
  [0, 'Lundi'], [1, 'Mardi'], [2, 'Mercredi'], [3, 'Jeudi'],
  [4, 'Vendredi'], [5, 'Samedi'], [6, 'Dimanche'],
];

export const CRENEAUX: [number, string][] = [
  [8, '08h - 10h'], [10, '10h - 12h'], [12, '12h - 14h'],
  [14, '14h - 16h'], [16, '16h - 18h'],
];

export const MAX_PAR_CRENEAU = 3;

export interface Creneau {
  jour: number;
  creneau: number;
}

export interface Profil {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  date_naiss: string;
  is_coordinateur: boolean;
  messages_non_lus: number;
}

export interface Benevole {
  id: number;
  user: number;
  nom: string;
  prenom: string;
}

export interface Message {
  id: number;
  sender: number;
  sender_email: string;
  sender_nom: string;
  receiver: number;
  receiver_email: string;
  receiver_nom: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  date: string;
  auteur_nom: string;
}

export interface Couverture {
  creneaux_total: number;
  creneaux_couverts: number;
  creneaux_complets: number;
  places_total: number;
  places_prises: number;
  taux_remplissage: number;
}

export interface TableauDeBord {
  mes_creneaux: Creneau[];
  heures: number;
  heures_objectif: number;
  nb_indisponibilites: number;
  messages_non_lus: number;
  nb_benevoles: number;
  couverture: Couverture;
  annonces: Annonce[];
}

export interface BenevoleSuivi {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  heures: number;
  nb_indisponibilites: number;
}

export interface Coordination {
  benevoles: BenevoleSuivi[];
  // Les clés JSON sont des chaînes : occupation["0"]["8"]
  occupation: Record<string, Record<string, number>>;
  couverture: Couverture;
  heures_objectif: number;
}

export interface EmploiDuTemps {
  // Les clés JSON sont des chaînes : emploi_du_temps["0"]["8"]
  emploi_du_temps: Record<string, Record<string, string[]>>;
  jours: [number, string][];
  creneaux: [number, string][];
}

export interface Inscription {
  email: string;
  nom: string;
  prenom: string;
  date_naiss: string;
  password: string;
  password2: string;
}

export function libelleJour(jour: number): string {
  return JOURS.find(([j]) => j === jour)?.[1] ?? '';
}

export function libelleCreneau(creneau: number): string {
  return CRENEAUX.find(([c]) => c === creneau)?.[1] ?? '';
}

export function initiales(nomComplet: string): string {
  return nomComplet.split(' ').filter(Boolean).slice(0, 2).map(m => m[0].toUpperCase()).join('');
}

/** Jour de la semaine courant au format du backend (0 = lundi). */
export function jourCourant(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

/** Trie les créneaux à partir d'aujourd'hui, dans l'ordre où ils vont arriver. */
export function trierParProchaineOccurrence(creneaux: Creneau[], date = new Date()): Creneau[] {
  const aujourdHui = jourCourant(date);
  const heure = date.getHours();
  const rang = (c: Creneau) => {
    let ecart = (c.jour - aujourdHui + 7) % 7;
    if (ecart === 0 && c.creneau + 2 <= heure) {
      ecart = 7;  // créneau déjà passé aujourd'hui : la semaine prochaine
    }
    return ecart * 24 + c.creneau;
  };
  return [...creneaux].sort((a, b) => rang(a) - rang(b));
}

/** Transforme une erreur DRF ({champ: [messages]}) en liste de messages lisibles. */
export function messagesErreur(err: any, defaut = 'Une erreur est survenue'): string[] {
  const body = err?.error;
  if (!body || typeof body !== 'object') {
    return [err?.status === 0 ? 'Serveur injoignable' : defaut];
  }
  if (body.detail) {
    return [body.detail];
  }
  return Object.values(body).flat().map(String);
}
