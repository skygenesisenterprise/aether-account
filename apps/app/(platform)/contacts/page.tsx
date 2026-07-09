"use client";

import * as React from "react";
import { Mail, Phone, Search, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { listContacts } from "@/lib/api";
import type { Contact } from "@/lib/api";

function ContactsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32 rounded-lg bg-white/5" />
      <Skeleton className="h-8 w-full rounded-lg bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    listContacts("default")
      .then(setContacts)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  if (loading) return <ContactsSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Users className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les contacts</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Contacts</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos contacts et vos relations</p>
      </div>

      <div className="relative mb-4">
        <Search className="text-zinc-400 absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9 bg-[#232426] border border-white/6 text-white placeholder:text-zinc-500 focus:border-white/12"
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center">
          <p className="text-xs text-zinc-500 sm:text-sm">{contacts.length === 0 ? "Aucun contact" : "Aucun résultat"}</p>
          <p className="text-xs text-zinc-600 mt-1">
            {contacts.length === 0
              ? "Les contacts que vous ajoutez apparaîtront ici."
              : "Essayez de modifier votre recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <div key={contact.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5">
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">{(contact.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-zinc-200 sm:text-sm">{contact.name}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {contact.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="size-3 shrink-0" /> {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1 truncate">
                      <Phone className="size-3 shrink-0" /> {contact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
