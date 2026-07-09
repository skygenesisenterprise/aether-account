"use client";

import * as React from "react";
import { Mail, Phone, Search, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/hooks/use-toast";
import { listContacts } from "@/lib/api";
import type { Contact } from "@/lib/api";

function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
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
          <EmptyMedia variant="icon"><Users className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les contacts</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground text-sm">Gérez vos contacts et vos relations</p>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><UserPlus className="size-5" /></EmptyMedia>
                <EmptyTitle>{contacts.length === 0 ? "Aucun contact" : "Aucun résultat"}</EmptyTitle>
                <EmptyDescription>
                  {contacts.length === 0
                    ? "Les contacts que vous ajoutez apparaîtront ici."
                    : "Essayez de modifier votre recherche."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Avatar className="size-10">
                  <AvatarFallback>{(contact.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{contact.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
