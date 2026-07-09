"use client";

import * as React from "react";
import { File, FileText, Folder, HardDrive, Image, Music, Search, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getStorageInfo, getStorageFiles } from "@/lib/api/platform";
import type { StorageInfo, FileItem } from "@/lib/api/platform";

function DriveSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function FileTypeIcon({ type, mimeType }: { type: string; mimeType?: string }) {
  if (type === "folder") return <Folder className="text-muted-foreground size-4" />;
  if (mimeType?.startsWith("image/")) return <Image className="text-muted-foreground size-4" />;
  if (mimeType?.startsWith("audio/")) return <Music className="text-muted-foreground size-4" />;
  if (mimeType?.startsWith("video/")) return <Video className="text-muted-foreground size-4" />;
  if (mimeType?.includes("pdf") || mimeType?.includes("document")) return <FileText className="text-muted-foreground size-4" />;
  return <File className="text-muted-foreground size-4" />;
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
          <EmptyMedia variant="icon"><HardDrive className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger l&apos;espace de stockage</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Espace de stockage</h1>
        <p className="text-muted-foreground text-sm">Gérez vos fichiers et documents</p>
      </div>

      {storageInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stockage</CardTitle>
              <span className="text-muted-foreground text-sm">
                {formatSize(storageInfo.usedSpace)} / {formatSize(storageInfo.totalSpace)}
              </span>
            </div>
            <CardDescription>
              {storageInfo.fileCount} fichier{storageInfo.fileCount !== 1 ? "s" : ""} · 
              Taille max : {formatSize(storageInfo.maxFileSize)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={storageInfo.usagePercent} className="h-2" />
            <p className="text-muted-foreground mt-2 text-xs">{storageInfo.usagePercent.toFixed(1)}% utilisé</p>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Rechercher un fichier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Folder className="size-5" /></EmptyMedia>
                <EmptyTitle>{files.length === 0 ? "Aucun fichier" : "Aucun résultat"}</EmptyTitle>
                <EmptyDescription>
                  {files.length === 0
                    ? "Les fichiers que vous ajoutez apparaîtront ici."
                    : "Essayez de modifier votre recherche."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {filtered.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <FileTypeIcon type={file.type} mimeType={file.mimeType} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{file.type}</Badge>
                    {file.isFavorite && <span className="text-yellow-500 text-xs">★</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}{file.extension ? ` · ${file.extension}` : ""}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(file.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
