"use client";

import * as React from "react";
import { CreditCard, Download, Receipt, Wallet, TrendingUp, CalendarDays, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getWallet } from "@/lib/api/platform";
import type { WalletData, Transaction } from "@/lib/api/platform";

function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Actif", variant: "default" },
  trialing: { label: "Essai", variant: "secondary" },
  past_due: { label: "En retard", variant: "destructive" },
  canceled: { label: "Annulé", variant: "outline" },
  unpaid: { label: "Impayé", variant: "destructive" },
};

const transactionStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Complété", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  failed: { label: "Échoué", variant: "destructive" },
  refunded: { label: "Remboursé", variant: "outline" },
};

export default function WalletPage() {
  const [data, setData] = React.useState<WalletData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getWallet()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <WalletSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Wallet className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les informations de paiement</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  const { billingInfo, subscriptions, transactions } = data;
  const activeSub = subscriptions.find((s) => s.status === "active" || s.status === "trialing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet et Abonnements</h1>
        <p className="text-muted-foreground text-sm">Gérez vos moyens de paiement et abonnements</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Moyen de paiement</CardTitle>
            <CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {billingInfo.paymentMethod ? (
              <div>
                <p className="text-2xl font-semibold capitalize">{billingInfo.paymentMethod}</p>
                <p className="text-muted-foreground text-sm">{billingInfo.billingEmail}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun moyen de paiement configuré</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Devise</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{billingInfo.currency}</p>
            <p className="text-muted-foreground text-sm">
              {billingInfo.paymentStatus === "paid" ? "À jour" : billingInfo.paymentStatus === "pending" ? "Paiement en attente" : "Statut: " + billingInfo.paymentStatus}
            </p>
          </CardContent>
        </Card>
      </div>

      {activeSub && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Abonnement actif</CardTitle>
                <CardDescription>{activeSub.planName}</CardDescription>
              </div>
              <Badge variant={statusLabels[activeSub.status]?.variant || "secondary"}>
                {statusLabels[activeSub.status]?.label || activeSub.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">Montant</p>
                <p className="text-xl font-semibold">{activeSub.amount.toFixed(2)} {activeSub.currency}/{activeSub.interval === "month" ? "mois" : "an"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Début</p>
                <p className="text-sm font-medium">{new Date(activeSub.startDate).toLocaleDateString("fr-FR")}</p>
              </div>
              {activeSub.endDate && (
                <div>
                  <p className="text-muted-foreground text-sm">Fin</p>
                  <p className="text-sm font-medium">{new Date(activeSub.endDate).toLocaleDateString("fr-FR")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>Consultez l&apos;historique de vos paiements et factures</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Aucune transaction</EmptyTitle>
                <EmptyDescription>Les transactions apparaîtront ici une fois effectuées.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx: Transaction) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                      <Receipt className="text-muted-foreground size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" />
                        {new Date(tx.date).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{tx.amount.toFixed(2)} {tx.currency}</p>
                      <Badge variant={transactionStatusLabels[tx.status]?.variant || "secondary"} className="text-[10px] px-1.5 py-0">
                        {transactionStatusLabels[tx.status]?.label || tx.status}
                      </Badge>
                    </div>
                    {tx.invoiceUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={tx.invoiceUrl} target="_blank" rel="noopener noreferrer"><Download className="size-4" /></a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
