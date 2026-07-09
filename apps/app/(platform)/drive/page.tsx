"use client";

import * as React from "react";
import { File, FileText, Folder, HardDrive, Image, Music, Search, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getStorageInfo, getStorageFiles } from "@/lib/api/platform";
import type { StorageInfo, FileItem } from "@/lib/api/platform";

function DriveSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36 rounded-lg bg-white/5" />
      <Skeleton className="h-20 rounded-xl bg-white/5" />
      <Skeleton className="h-8 w-full rounded-lg bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function FileTypeIcon({ type, mimeType }: { type: string; mimeType?: string }) {
  if (type === "folder") return <Folder className="text-zinc-400 size-3.5" />;
  if (mimeType?.startsWith("image/")) return <Image className="text-zinc-400 size-3.5" />;
  if (mimeType?.startsWith("audio/")) return <Music className="text-zinc-400 size-3.5" />;
  if (mimeType?.startsWith("video/")) return <Video className="text-zinc-400 size-3.5" />;
  if (mimeType?.includes("pdf") || mimeType?.includes("document")) return <FileText className="text-zinc-400 size-3.5" />;
  return <File className="text-zinc-400 size-3.5" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function DrivePage() {
  const [storageInfo, setStorageInfo] = React.useState<StorageInfo | null>(null);
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    Promise.all([getStorageInfo(), getStorageFiles()])
      .then(([info, fileList]) => {
        setStorageInfo(info);
        setFiles(fileList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DriveSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><HardDrive className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger l'espace de stockage</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Stockage</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos fichiers et documents</p>
      </div>

      {storageInfo && (
        <div className="mb-4 rounded-xl border border-white/6 bg-[#232426]">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold text-white sm:text-sm">Stockage</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {storageInfo.fileCount} fichier{storageInfo.fileCount !== 1 ? "s" : ""} · 
                Taille max : {formatSize(storageInfo.maxFileSize)}
              </p>
            </div>
            <span className="text-xs text-zinc-400">
              {formatSize(storageInfo.usedSpace)} / {formatSize(storageInfo.totalSpace)}
            </span>
          </div>
          <div className="px-4 pb-4">
            <Progress value={storageInfo.usagePercent} className="h-1.5" />
            <p className="text-xs text-zinc-500 mt-1">{storageInfo.usagePercent.toFixed(1)}% utilisé</p>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="text-zinc-400 absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9 bg-[#232426] border border-white/6 text-white placeholder:text-zinc-500 focus:border-white/12"
          placeholder="Rechercher un fichier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center">
          <p className="text-xs text-zinc-500 sm:text-sm">{files.length === 0 ? "Aucun fichier" : "Aucun résultat"}</p>
          <p className="text-xs text-zinc-600 mt-1">
            {files.length === 0
              ? "Les fichiers que vous ajoutez apparaîtront ici."
              : "Essayez de modifier votre recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 10).map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                <FileTypeIcon type={file.type} mimeType={file.mimeType} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium truncate text-zinc-200 sm:text-sm">{file.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {file.type}
                  </Badge>
                  {file.isFavorite && <span className="text-yellow-500 text-xs">★</span>}
                </div>
                <p className="text-xs text-zinc-500">
                  {formatSize(file.size)}{file.extension ? ` · ${file.extension}` : ""}
                </p>
              </div>
              <span className="text-xs text-zinc-500 shrink-0">
                {new Date(file.updatedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
