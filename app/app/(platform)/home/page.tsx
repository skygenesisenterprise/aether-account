"use client";

import { Search, Key, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "../_components/Footer";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-col items-center justify-center flex-1 px-8 py-12">
        <div className="flex w-full max-w-2xl flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() || "L"}
            </div>
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-medium font-sans text-foreground">Liam Von Astoria</h1>
              <p className="text-sm font-sans text-muted-foreground">
                starslabstechnology@gmail.com
              </p>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher dans le compte Office"
              className="w-full rounded-md border border-border bg-input py-2 pl-10 pr-4 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex w-full gap-4">
            <button className="flex flex-1 items-center gap-3 rounded-md border border-border bg-card p-4 hover:bg-secondary transition-colors">
              <Key className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium font-sans text-foreground">
                  Mon mot de passe
                </span>
                <span className="text-xs text-muted-foreground">Modifié il y a 2 mois</span>
              </div>
            </button>
            <button className="flex flex-1 items-center gap-3 rounded-md border border-border bg-card p-4 hover:bg-secondary transition-colors">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium font-sans text-foreground">Appareils</span>
                <span className="text-xs text-muted-foreground">Gérer vos appareils</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
