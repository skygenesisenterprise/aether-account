"use client";

import {
  Shield,
  Key,
  Smartphone,
  CheckCircle,
  Laptop,
  Gamepad2,
  Eye,
  SmartphoneIcon,
  Mail,
  ChevronRight,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-col items-center flex-1 overflow-y-auto px-8 py-12">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <h1 className="text-2xl font-medium font-sans text-foreground">Sécurité et connexion</h1>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-2 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Conseils de sécurité du Check-up Sécurité
                </span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Complétez le Check-up Sécurité pour renforcer la protection de votre compte.
              </p>
            </div>

            <div className="flex flex-col gap-2 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-foreground">
                  Activité récente liée à la sécurité de votre compte
                </span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Pas d&apos;activités ni d&apos;alertes liées à la sécurité au cours des 28 derniers
                jours
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-medium text-foreground pb-2 border-b border-border">
              Comment vous connecter à Aether Office
            </h2>
            <p className="text-sm text-muted-foreground pb-4">
              Assurez-vous que vous pouvez toujours accéder à votre compte en maintenant ces
              informations à jour.
            </p>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Validation en deux étapes
                </span>
                <span className="text-xs text-muted-foreground">Activation : 9 nov. 2022</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Clés d&apos;accès et clés de sécurité
                </span>
                <span className="text-xs text-muted-foreground">2 clés d&apos;accès</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">Mot de passe</span>
                <span className="text-xs text-muted-foreground">
                  Dernière modification : 30 juil. 2022
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Ignorer le mot de passe si possible
                </span>
                <span className="text-xs text-green-500">Activé</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Désactiver
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">Vault Authenticator</span>
                <span className="text-xs text-muted-foreground">Ajout : 9 nov. 2022</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">Invite Office</span>
                <span className="text-xs text-muted-foreground">1 appareil</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Téléphones pour la validation en deux étapes
                </span>
                <span className="text-xs text-foreground">0470 03 97 11</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Numéro de téléphone de récupération
                </span>
                <span className="text-xs text-muted-foreground">
                  Ajoutez un numéro de téléphone mobile
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Ajouter
              </button>
            </div>

            <div className="flex items-center gap-3 py-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Adresse e-mail de récupération
                </span>
                <span className="text-xs text-foreground">liam.dispa@aethermail.me</span>
                <span className="text-xs text-muted-foreground">
                  Vous pouvez ajouter des options de connexion
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Modifier
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-medium text-foreground pb-2 border-b border-border">
              Vos appareils
            </h2>
            <p className="text-sm text-muted-foreground pb-4">
              Appareils sur lesquels vous êtes connecté.
            </p>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <Laptop className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  2 sessions sur ordinateur(s)
                </span>
                <span className="text-xs text-muted-foreground">Linux, Linux</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">Gérer</button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">2 sessions sur iPhone</span>
                <span className="text-xs text-muted-foreground">iPhone, iPhone</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">Gérer</button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  6 sessions sur appareil(s) inconnu(s)
                </span>
                <span className="text-xs text-muted-foreground">
                  PlayStation 5, Appareil inconnu, ...
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">Gérer</button>
            </div>

            <div className="flex items-center gap-3 py-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Rechercher un appareil perdu
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Rechercher
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">Gérer tous les appareils</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>10</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-medium text-foreground pb-2 border-b border-border">
              Vos connexions à des applis et services tiers
            </h2>
            <p className="text-sm text-muted-foreground pb-4">
              Suivez vos connexions à des applis et services tiers.
            </p>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <span className="text-sm font-semibold text-white">D</span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">Duolingo</span>
                <span className="text-xs text-muted-foreground">
                  Accès à certaines informations
                </span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">Gérer</button>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <span className="text-sm font-semibold text-white">E</span>
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">EroPlayAI</span>
                <span className="text-xs text-muted-foreground">Accès total au compte</span>
              </div>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">Gérer</button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">Voir toutes les connexions</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>14</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Navigation sécurisée avec protection renforcée pour votre compte
                </span>
                <span className="text-xs text-muted-foreground">
                  Des protections plus personnalisées contre les extensions, sites et
                  téléchargements dangereux.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Désactivé</span>
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Activer
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  Gestionnaire de mots de passe
                </span>
                <span className="text-xs text-muted-foreground">
                  Vous avez 59 mots de passe enregistrés dans votre compte. Le gestionnaire de mots
                  de passe facilite la connexion aux sites et aux applications que vous utilisez sur
                  vos appareils connectés.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end pt-2">
              <button className="text-sm font-medium text-[#1a73e8] hover:underline">
                Examiner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
