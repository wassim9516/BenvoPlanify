export const JOURS: [number, string][] = [
  [0, 'Lundi'], [1, 'Mardi'], [2, 'Mercredi'], [3, 'Jeudi'],
  [4, 'Vendredi'], [5, 'Samedi'], [6, 'Dimanche'],
];

export const CRENEAUX: [number, string][] = [
  [8, '08h - 10h'], [10, '10h - 12h'], [12, '12h - 14h'],
  [14, '14h - 16h'], [16, '16h - 18h'],
];

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
}

export interface Benevole {
  id: number;
  user: number;
  nom: string;
  prenom: string;
}

export interface Message {
  id: number;
  sender_email: string;
  receiver: number;
  receiver_email: string;
  content: string;
  timestamp: string;
  is_read: boolean;
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
