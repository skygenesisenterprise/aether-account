"use client";

import * as React from "react";
import { Copy, Loader2, RotateCcw, Save, Shield, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { SettingRow } from "@/components/settings/setting-row";
import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getUserFacingError } from "@/lib/api/errors";
import { getWorkspaceSsoConfig, updateWorkspaceSsoConfig } from "@/lib/api/workspace-sso";
import type { UpdateWorkspaceSsoInput, Workspace, WorkspaceMemberRole, WorkspaceSsoConfig, WorkspaceSsoProvider } from "@/lib/api/types";

interface WorkspaceSsoSettingsProps {
  workspace: Workspace | null;
  canEdit: boolean;
}

interface WorkspaceSsoDraft {
  provider: WorkspaceSsoProvider;
  enabled: boolean;
  enforceSso: boolean;
  allowPasswordAuth: boolean;
  allowAutoProvision: boolean;
  allowIdpInitiated: boolean;
  domainHint: string;
  issuerUrl: string;
  ssoUrl: string;
  entityId: string;
  clientId: string;
  clientSecret: string;
  clearClientSecret: boolean;
  certificate: string;
  allowedDomainsText: string;
  defaultRole: WorkspaceMemberRole;
  attributeMappingText: string;
}

const roleOptions: WorkspaceMemberRole[] = ["admin", "member", "guest"];

const providerTemplates: Array<{
  key: string;
  label: string;
  subtitle: string;
  provider: WorkspaceSsoProvider;
  issuerUrl: string;
  ssoUrl: string;
  entityId: string;
  domainHint: string;
  attributeMappingText: string;
}> = [
  {
    key: "google",
    label: "Google",
    subtitle: "Google Workspace / Cloud Identity",
    provider: "oidc",
    issuerUrl: "https://accounts.google.com",
    ssoUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    entityId: "google-oauth-client-id",
    domainHint: "company.com",
    attributeMappingText: "email=email\nname=name\ngiven_name=firstName\nfamily_name=lastName\npicture=avatarUrl",
  },
  {
    key: "github",
    label: "GitHub",
    subtitle: "GitHub Enterprise Cloud",
    provider: "oidc",
    issuerUrl: "https://github.com",
    ssoUrl: "https://github.com/login/oauth/authorize",
    entityId: "github-oauth-app-client-id",
    domainHint: "github.com",
    attributeMappingText: "email=email\nname=name\nlogin=username\navatar_url=avatarUrl",
  },
  {
    key: "microsoft",
    label: "Microsoft",
    subtitle: "Entra ID / Azure AD",
    provider: "oidc",
    issuerUrl: "https://login.microsoftonline.com/{tenant-id}/v2.0",
    ssoUrl: "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize",
    entityId: "entra-client-id",
    domainHint: "company.onmicrosoft.com",
    attributeMappingText: "email=preferred_username\nname=name\ngiven_name=given_name\nfamily_name=family_name\ngroups=groups",
  },
  {
    key: "okta",
    label: "Okta",
    subtitle: "Okta Workforce Identity",
    provider: "oidc",
    issuerUrl: "https://{yourOktaDomain}/oauth2/default",
    ssoUrl: "https://{yourOktaDomain}/oauth2/default/v1/authorize",
    entityId: "okta-client-id",
    domainHint: "company.com",
    attributeMappingText: "email=email\nname=name\ngiven_name=given_name\nfamily_name=family_name\ngroups=groups",
  },
];

function toDraft(config: WorkspaceSsoConfig): WorkspaceSsoDraft {
  return {
    provider: config.provider,
    enabled: config.enabled,
    enforceSso: config.enforceSso,
    allowPasswordAuth: config.allowPasswordAuth,
    allowAutoProvision: config.allowAutoProvision,
    allowIdpInitiated: config.allowIdpInitiated,
    domainHint: config.domainHint ?? "",
    issuerUrl: config.issuerUrl ?? "",
    ssoUrl: config.ssoUrl ?? "",
    entityId: config.entityId ?? "",
    clientId: config.clientId ?? "",
    clientSecret: "",
    clearClientSecret: false,
    certificate: config.certificate ?? "",
    allowedDomainsText: (config.allowedDomains ?? []).join(", "),
    defaultRole: config.defaultRole,
    attributeMappingText: Object.entries(config.attributeMapping ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAttributeMapping(value: string): Record<string, string> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        return accumulator;
      }
      const key = line.slice(0, separatorIndex).trim();
      const mappedValue = line.slice(separatorIndex + 1).trim();
      if (key && mappedValue) {
        accumulator[key] = mappedValue;
      }
      return accumulator;
    }, {});
}

function normalizeDraft(draft: WorkspaceSsoDraft): UpdateWorkspaceSsoInput {
  const input: UpdateWorkspaceSsoInput = {
    provider: draft.provider,
    enabled: draft.enabled,
    enforceSso: draft.enforceSso,
    allowPasswordAuth: draft.allowPasswordAuth,
    allowAutoProvision: draft.allowAutoProvision,
    allowIdpInitiated: draft.allowIdpInitiated,
    domainHint: draft.domainHint.trim(),
    issuerUrl: draft.issuerUrl.trim(),
    ssoUrl: draft.ssoUrl.trim(),
    entityId: draft.entityId.trim(),
    clientId: draft.clientId.trim(),
    certificate: draft.certificate.trim(),
    allowedDomains: parseCsv(draft.allowedDomainsText),
    defaultRole: draft.defaultRole,
    attributeMapping: parseAttributeMapping(draft.attributeMappingText),
  };

  if (draft.clientSecret.trim()) {
    input.clientSecret = draft.clientSecret.trim();
  }
  if (draft.clearClientSecret) {
    input.clearClientSecret = true;
  }

  return input;
}

function buildAppEndpoints(workspace: Workspace | null, provider: WorkspaceSsoProvider): Array<{ label: string; value: string }> {
  if (typeof window === "undefined" || !workspace) {
    return [];
  }

  const origin = window.location.origin;
  const slug = workspace.slug;

  if (provider === "saml") {
    return [
      { label: "Assertion Consumer Service", value: `${origin}/api/v1/auth/sso/${slug}/saml/callback` },
      { label: "Entity ID", value: `${origin}/api/v1/auth/sso/${slug}/metadata` },
      { label: "SP Metadata", value: `${origin}/api/v1/auth/sso/${slug}/metadata` },
    ];
  }

  return [
    { label: "Authorization Start URL", value: `${origin}/api/v1/auth/sso/${slug}/oidc/start` },
    { label: "Redirect URI", value: `${origin}/api/v1/auth/sso/${slug}/oidc/callback` },
    { label: "Post-login Return URL", value: `${origin}/settings?section=sso` },
  ];
}

export function WorkspaceSsoSettings({ workspace, canEdit }: WorkspaceSsoSettingsProps) {
  const [config, setConfig] = React.useState<WorkspaceSsoConfig | null>(null);
  const [draft, setDraft] = React.useState<WorkspaceSsoDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!workspace) {
      setConfig(null);
      setDraft(null);
      setLoading(false);
      return;
    }

    const workspaceId = workspace.id;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await getWorkspaceSsoConfig(workspaceId);
        if (!cancelled) {
          setConfig(next);
          setDraft(toDraft(next));
        }
      } catch (cause) {
        if (!cancelled) {
          setError(getUserFacingError(cause));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [workspace]);

  const initialSnapshot = React.useMemo(() => (config ? JSON.stringify(toDraft(config)) : null), [config]);
  const currentSnapshot = React.useMemo(() => (draft ? JSON.stringify(draft) : null), [draft]);
  const hasChanges = Boolean(initialSnapshot && currentSnapshot && initialSnapshot !== currentSnapshot);
  const endpoints = React.useMemo(() => buildAppEndpoints(workspace, draft?.provider ?? "oidc"), [draft?.provider, workspace]);
  const detectedTemplate = React.useMemo(() => {
    if (!draft) {
      return null;
    }
    const source = `${draft.issuerUrl} ${draft.ssoUrl}`.toLowerCase();
    return providerTemplates.find((template) => {
      switch (template.key) {
        case "google":
          return source.includes("accounts.google.com");
        case "github":
          return source.includes("github.com");
        case "microsoft":
          return source.includes("microsoftonline.com");
        case "okta":
          return source.includes("okta");
        default:
          return false;
      }
    })?.key ?? null;
  }, [draft]);

  function updateDraft<K extends keyof WorkspaceSsoDraft>(key: K, value: WorkspaceSsoDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function applyProviderTemplate(templateKey: string) {
    const template = providerTemplates.find((item) => item.key === templateKey);
    if (!template) {
      return;
    }
    setDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        provider: template.provider,
        issuerUrl: template.issuerUrl,
        ssoUrl: template.ssoUrl,
        entityId: current.entityId.trim() ? current.entityId : template.entityId,
        domainHint: current.domainHint.trim() ? current.domainHint : template.domainHint,
        attributeMappingText: template.attributeMappingText,
      };
    });
    toast.success(`${template.label} prêt à être configuré.`);
  }

  async function handleSave() {
    if (!workspace || !draft) {
      return;
    }

    setSaving(true);
    try {
      const next = await updateWorkspaceSsoConfig(workspace.id, normalizeDraft(draft));
      setConfig(next);
      setDraft(toDraft(next));
      toast.success("Configuration SSO enregistrée.");
    } catch (cause) {
      toast.error(getUserFacingError(cause));
    } finally {
      setSaving(false);
    }
  }

  if (!workspace) {
    return <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-400">Aucun workspace actif pour la configuration SSO.</div>;
  }

  if (loading || !draft) {
    return <div className="text-sm text-zinc-400">Chargement de la configuration SSO…</div>;
  }

  if (error) {
    return <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Authentification externe"
        description={canEdit ? "Configurez le provider SSO de ce workspace et les règles de provisioning associées." : "Visualisation seule de la configuration SSO. Les owners/admins restent requis pour toute modification."}
        actions={
          canEdit ? (
            <>
              <Button type="button" variant="outline" onClick={() => config && setDraft(toDraft(config))} disabled={!hasChanges || saving}>
                <RotateCcw className="size-4" />
                Réinitialiser
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!hasChanges || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Enregistrer
              </Button>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-md border border-white/10 bg-black/10 p-4">
          <div className="rounded-md border border-white/10 bg-[#232426] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Providers les plus utilisés</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Chaque bouton prépare la configuration du provider choisi dans le formulaire ci-dessous.
                </p>
              </div>
              {detectedTemplate ? (
                <Badge variant="outline" className="border-white/10 text-zinc-200">
                  Preset actif
                </Badge>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {providerTemplates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() => applyProviderTemplate(template.key)}
                  className={`rounded-md border p-3 text-left transition ${
                    detectedTemplate === template.key
                      ? "border-violet-400/50 bg-violet-500/10"
                      : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/5"
                  } ${!canEdit || saving ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{template.label}</p>
                    <Badge variant="outline" className="border-white/10 text-zinc-300">
                      {template.provider.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{template.subtitle}</p>
                  <p className="mt-3 text-xs text-zinc-500">Bouton de connexion/configuration rapide</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Provider</p>
              <Select value={draft.provider} onValueChange={(value) => updateDraft("provider", value as WorkspaceSsoProvider)} disabled={!canEdit || saving}>
                <SelectTrigger className="w-full border-white/10 bg-[#232426]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oidc">OIDC</SelectItem>
                  <SelectItem value="saml">SAML 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Rôle par défaut</p>
              <Select value={draft.defaultRole} onValueChange={(value) => updateDraft("defaultRole", value as WorkspaceMemberRole)} disabled={!canEdit || saving}>
                <SelectTrigger className="w-full border-white/10 bg-[#232426]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Issuer / Tenant URL</p>
              <Input value={draft.issuerUrl} onChange={(event) => updateDraft("issuerUrl", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="https://idp.example.com" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">SSO URL / Entry Point</p>
              <Input value={draft.ssoUrl} onChange={(event) => updateDraft("ssoUrl", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="https://idp.example.com/auth" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Client ID</p>
              <Input value={draft.clientId} onChange={(event) => updateDraft("clientId", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="aether-meet-workspace" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Entity ID / Audience</p>
              <Input value={draft.entityId} onChange={(event) => updateDraft("entityId", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="urn:aether:workspace" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Client secret</p>
              <Input
                value={draft.clientSecret}
                onChange={(event) => {
                  updateDraft("clientSecret", event.target.value);
                  if (event.target.value.trim()) {
                    updateDraft("clearClientSecret", false);
                  }
                }}
                disabled={!canEdit || saving}
                className="border-white/10 bg-[#232426]"
                placeholder={config?.clientSecretConfigured ? "Secret déjà configuré, renseignez pour le remplacer" : "Secret applicatif du provider"}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={!canEdit || saving || !config?.clientSecretConfigured}
                onClick={() => {
                  updateDraft("clientSecret", "");
                  updateDraft("clearClientSecret", true);
                }}
              >
                Retirer
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Domain hint</p>
              <Input value={draft.domainHint} onChange={(event) => updateDraft("domainHint", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="acme.com" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Domaines autorisés</p>
              <Input value={draft.allowedDomainsText} onChange={(event) => updateDraft("allowedDomainsText", event.target.value)} disabled={!canEdit || saving} className="border-white/10 bg-[#232426]" placeholder="acme.com, subsidiaries.acme.com" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Certificat ou clé publique</p>
            <Textarea value={draft.certificate} onChange={(event) => updateDraft("certificate", event.target.value)} disabled={!canEdit || saving} rows={6} className="border-white/10 bg-[#232426] font-mono text-xs" placeholder="-----BEGIN CERTIFICATE-----" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Mapping des attributs</p>
            <Textarea
              value={draft.attributeMappingText}
              onChange={(event) => updateDraft("attributeMappingText", event.target.value)}
              disabled={!canEdit || saving}
              rows={5}
              className="border-white/10 bg-[#232426] font-mono text-xs"
              placeholder={"email=email\nname=displayName\ngroups=groups"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-white/10 bg-black/10 px-4">
            <SettingRow title="SSO actif" description="Active le provider externe sur le workspace.">
              <Switch checked={draft.enabled} onCheckedChange={(checked) => updateDraft("enabled", checked)} disabled={!canEdit || saving} aria-label="SSO actif" />
            </SettingRow>
            <SettingRow title="SSO obligatoire" description="Bloque l’authentification locale lorsque le provider est configuré.">
              <Switch checked={draft.enforceSso} onCheckedChange={(checked) => updateDraft("enforceSso", checked)} disabled={!canEdit || saving} aria-label="SSO obligatoire" />
            </SettingRow>
            <SettingRow title="Authentification locale de secours" description="Conserve les comptes mot de passe pour les scénarios d’administration et de reprise.">
              <Switch checked={draft.allowPasswordAuth} onCheckedChange={(checked) => updateDraft("allowPasswordAuth", checked)} disabled={!canEdit || saving} aria-label="Authentification locale" />
            </SettingRow>
            <SettingRow title="Provisioning automatique" description="Crée le membre du workspace au premier login SSO s’il n’existe pas encore.">
              <Switch checked={draft.allowAutoProvision} onCheckedChange={(checked) => updateDraft("allowAutoProvision", checked)} disabled={!canEdit || saving} aria-label="Provisioning automatique" />
            </SettingRow>
            <SettingRow title="Connexion initiée par l’IdP" description="Autorise les flows lancés directement depuis le portail du fournisseur.">
              <Switch checked={draft.allowIdpInitiated} onCheckedChange={(checked) => updateDraft("allowIdpInitiated", checked)} disabled={!canEdit || saving} aria-label="Connexion initiée par l’IdP" />
            </SettingRow>
          </div>

          <div className="rounded-md border border-white/10 bg-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">État de déploiement</p>
              <Badge variant="outline" className="border-white/10 text-zinc-200">
                {draft.provider.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={draft.enabled ? "default" : "outline"} className={draft.enabled ? "" : "border-white/10 text-zinc-300"}>
                {draft.enabled ? <Shield className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                {draft.enabled ? "Actif" : "Inactif"}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-300">
                Secret {config?.clientSecretConfigured ? "présent" : "absent"}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-300">
                {(parseCsv(draft.allowedDomainsText).length || 0).toString()} domaine(s)
              </Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {endpoints.map((item) => (
                <div key={item.label} className="rounded-md border border-white/10 bg-[#232426] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <code className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white">{item.value}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(item.value);
                        toast.success("Valeur copiée.");
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Les valeurs ci-dessus servent de référence d’intégration pour le fournisseur d’identité choisi. Elles s’alignent sur le provider sélectionné dans cette fiche workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
