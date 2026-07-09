"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);


  const strength = getPasswordStrength(newPassword);
  const meetsMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) { setError("Le mot de passe actuel est requis."); return; }
    if (newPassword.length < 12) { setError("Le mot de passe doit contenir au moins 12 caractères."); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la modification du mot de passe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe</h1>
        <p className="text-muted-foreground text-sm">Modifiez votre mot de passe de connexion</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>Utilisez un mot de passe fort que vous n&apos;utilisez pas ailleurs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input id="currentPassword" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input id="newPassword" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" className="absolute inset-y-0 right-3 flex items-center text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                    <ul className="space-y-0.5 text-xs">
                      <li className={meetsMinLength ? "text-green-600" : "text-muted-foreground"}>{meetsMinLength ? "✓" : "○"} Au moins 12 caractères</li>
                      <li className={hasUpper && hasLower ? "text-green-600" : "text-muted-foreground"}>{hasUpper && hasLower ? "✓" : "○"} Majuscules et minuscules</li>
                      <li className={hasDigit ? "text-green-600" : "text-muted-foreground"}>{hasDigit ? "✓" : "○"} Au moins 1 chiffre</li>
                      <li className={hasSpecial ? "text-green-600" : "text-muted-foreground"}>{hasSpecial ? "✓" : "○"} Au moins 1 caractère spécial</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-destructive"}`}>
                    {passwordsMatch ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving || !passwordsMatch || !meetsMinLength}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lock className="mr-2 size-4" />}
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4" /> Conseils de sécurité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>✓ Utilisez un mot de passe unique pour ce compte</p>
            <p>✓ Évitez les informations personnelles (prénom, date de naissance)</p>
            <p>✓ Activez l&apos;authentification à deux facteurs</p>
            <p>✓ Changez votre mot de passe régulièrement</p>
            <p>✓ Ne partagez jamais votre mot de passe</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
