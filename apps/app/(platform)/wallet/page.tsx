"use client";

import * as React from "react";
import { CreditCard, Download, Receipt, Wallet, TrendingUp, CalendarDays, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { getWallet } from "@/lib/api/platform";
import type { WalletData, Transaction } from "@/lib/api/platform";

function WalletSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36 rounded-lg bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl bg-white/5" />
        <Skeleton className="h-20 rounded-xl bg-white/5" />
      </div>
      <Skeleton className="h-5 w-28 rounded-lg bg-white/5" />
      <Skeleton className="h-32 rounded-xl bg-white/5" />
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
          <EmptyMedia variant="icon"><Wallet className="size-4" /></EmptyMedia>
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
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Wallet et Abonnements</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos moyens de paiement et abonnements</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white">Moyen de paiement</h3>
            <CreditCard className="text-zinc-400 size-4" />
          </div>
          {billingInfo.paymentMethod ? (
            <div>
              <p className="text-lg font-semibold text-white capitalize">{billingInfo.paymentMethod}</p>
              <p className="text-xs text-zinc-500">{billingInfo.billingEmail}</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Aucun moyen de paiement configuré</p>
          )}
        </div>

        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white">Devise</h3>
            <TrendingUp className="text-zinc-400 size-4" />
          </div>
          <p className="text-lg font-semibold text-white">{billingInfo.currency}</p>
          <p className="text-xs text-zinc-500">
            {billingInfo.paymentStatus === "paid" ? "À jour" : billingInfo.paymentStatus === "pending" ? "Paiement en attente" : "Statut: " + billingInfo.paymentStatus}
          </p>
        </div>
      </div>

      {activeSub && (
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Abonnement actif</h3>
              <p className="text-xs text-zinc-500">{activeSub.planName}</p>
            </div>
            <Badge variant={statusLabels[activeSub.status]?.variant || "secondary"} className="text-xs px-2 py-0.5">
              {statusLabels[activeSub.status]?.label || activeSub.status}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Montant</p>
              <p className="text-lg font-semibold text-white">{activeSub.amount.toFixed(2)} {activeSub.currency}/{activeSub.interval === "month" ? "mois" : "an"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Début</p>
              <p className="text-sm font-medium text-white">{new Date(activeSub.startDate).toLocaleDateString("fr-FR")}</p>
            </div>
            {activeSub.endDate && (
              <div>
                <p className="text-xs text-zinc-500">Fin</p>
                <p className="text-sm font-medium text-white">{new Date(activeSub.endDate).toLocaleDateString("fr-FR")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/6 bg-[#232426]">
        <div className="p-4 border-b border-white/6">
          <h3 className="text-sm font-semibold text-white">Historique des transactions</h3>
          <p className="text-xs text-zinc-500">Consultez l'historique de vos paiements et factures</p>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-zinc-500">Aucune transaction</p>
            <p className="text-xs text-zinc-600 mt-1">Les transactions apparaîtront ici une fois effectuées.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6 py-1">
            {transactions.slice(0, 5).map((tx: Transaction) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 px-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                    <Receipt className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <CalendarDays className="size-3" />
                      {new Date(tx.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{tx.amount.toFixed(2)} {tx.currency}</p>
                    <Badge variant={transactionStatusLabels[tx.status]?.variant || "secondary"} className="text-[10px] px-1.5 py-0">
                      {transactionStatusLabels[tx.status]?.label || tx.status}
                    </Badge>
                  </div>
                  {tx.invoiceUrl && (
                    <Button variant="ghost" size="icon" asChild className="size-7">
                      <a href={tx.invoiceUrl} target="_blank" rel="noopener noreferrer"><Download className="size-3.5" /></a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
