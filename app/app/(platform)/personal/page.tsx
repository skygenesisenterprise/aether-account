"use client";

import { User, Mail, Phone, Calendar, Globe, MapPin, Building, Key } from "lucide-react";

export default function PersonalPage() {
  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-col items-center flex-1 overflow-y-auto px-8 py-12">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <h1 className="text-2xl font-medium font-sans text-foreground">
            Informations personnelles
          </h1>

          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
                LV
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-medium font-sans text-foreground">Photo de profil</h2>
                <p className="text-sm text-muted-foreground">
                  Une photo aide les autres à vous reconna&icirc;tre
                </p>
              </div>
              <button className="mt-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Ajouter une photo
              </button>
            </div>

            <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3 py-2 border-b border-border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Nom</span>
                  <span className="text-base font-medium text-foreground">Liam Von Astoria</span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Genre</span>
                  <span className="text-base font-medium text-foreground">Homme</span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Adresses e-mail</span>
                  <span className="text-base font-medium text-foreground">
                    starslabstechnology@gmail.com
                  </span>
                  <span className="text-base font-medium text-foreground">
                    liam.dispa@aethermail.me
                  </span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <span className="text-base font-medium text-foreground">0470 03 97 11</span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Date de naissance</span>
                  <span className="text-base font-medium text-foreground">6 juin 2005</span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Langue</span>
                  <span className="text-base font-medium text-foreground">
                    Fran&ccedil;ais (France)
                  </span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Adresse domicile</span>
                  <span className="text-base font-medium text-foreground">
                    Rue des Joncs fleuris 10, Neupr&eacute;
                  </span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Adresse professionnelle</span>
                  <span className="text-base font-medium text-foreground">
                    Rue des Roseaux 10, Neupr&eacute;
                  </span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-border">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Autres adresses</span>
                  <span className="text-base text-muted-foreground">Aucune autre adresse</span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Ajouter
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-muted-foreground">Mot de passe Aether</span>
                  <span className="text-xs text-muted-foreground">
                    Derni&egrave;re modification : 30 juil. 2022
                  </span>
                </div>
                <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
