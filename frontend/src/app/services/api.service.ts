import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Benevole, Creneau, EmploiDuTemps, Inscription, Message, Profil } from "../models";

export const API_URL = 'http://localhost:8000/api';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    constructor(private http: HttpClient) {}

    getStats(): Observable<{ nb_benevoles: number }> {
        return this.http.get<{ nb_benevoles: number }>(`${API_URL}/stats/`);
    }

    register(data: Inscription): Observable<unknown> {
        return this.http.post(`${API_URL}/register/`, data);
    }

    getProfil(): Observable<Profil> {
        return this.http.get<Profil>(`${API_URL}/espace-perso/`);
    }

    updateProfil(data: Partial<Profil>): Observable<Profil> {
        return this.http.patch<Profil>(`${API_URL}/espace-perso/`, data);
    }

    getEmploiDuTemps(): Observable<EmploiDuTemps> {
        return this.http.get<EmploiDuTemps>(`${API_URL}/emploi-du-temps/`);
    }

    getIndisponibilites(): Observable<{ indisponibilites: Creneau[] }> {
        return this.http.get<{ indisponibilites: Creneau[] }>(`${API_URL}/indisponibilites/`);
    }

    saveIndisponibilites(indisponibilites: Creneau[]): Observable<{ planning_genere: Creneau[]; heures: number }> {
        return this.http.post<{ planning_genere: Creneau[]; heures: number }>(
            `${API_URL}/indisponibilites/`, { indisponibilites });
    }

    getBenevoles(): Observable<Benevole[]> {
        return this.http.get<Benevole[]>(`${API_URL}/benevoles/`);
    }

    getMessages(): Observable<Message[]> {
        return this.http.get<Message[]>(`${API_URL}/messages/`);
    }

    getMessage(id: number): Observable<Message> {
        return this.http.get<Message>(`${API_URL}/messages/${id}/`);
    }

    sendMessage(receiver: number, content: string): Observable<Message> {
        return this.http.post<Message>(`${API_URL}/messages/`, { receiver, content });
    }
}
