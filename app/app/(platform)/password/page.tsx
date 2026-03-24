"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Star,
  StarOff,
  MoreVertical,
  Shield,
  Trash2,
  Edit,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Footer } from "../_components/Footer";

interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  favorite: boolean;
  createdAt: string;
  category: string;
  notes?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-amber-500",
];

const MOCK_PASSWORDS: PasswordEntry[] = [
  {
    id: "1",
    name: "Google",
    username: "starslabstechnology@gmail.com",
    password: "xK9#mP2$vL5@nQ8",
    url: "https://google.com",
    favorite: true,
    createdAt: "15 jan. 2024",
    category: "Google",
    notes: "Compte principal Google",
  },
  {
    id: "2",
    name: "GitHub",
    username: "liam.von.astoria",
    password: "GitHub@2024!Secure",
    url: "https://github.com",
    favorite: true,
    createdAt: "10 fév. 2024",
    category: "Développement",
  },
  {
    id: "3",
    name: "Netflix",
    username: "starslabstechnology@gmail.com",
    password: "Stream&Watch2024",
    url: "https://netflix.com",
    favorite: false,
    createdAt: "5 mars 2024",
    category: "Divertissement",
  },
  {
    id: "4",
    name: "Discord",
    username: "LiamVonAstoria#1234",
    password: "Discord_Secure#2024",
    url: "https://discord.com",
    favorite: false,
    createdAt: "20 avr. 2024",
    category: "Social",
  },
  {
    id: "5",
    name: "AetherMail",
    username: "liam.dispa@aethermail.me",
    password: "AetherMail$Secure2024",
    url: "https://aethermail.me",
    favorite: true,
    createdAt: "1 jan. 2024",
    category: "Communication",
  },
  {
    id: "6",
    name: "LinkedIn",
    username: "liam.von.astoria@outlook.com",
    password: "LinkedIn@Professional",
    url: "https://linkedin.com",
    favorite: false,
    createdAt: "12 mai 2024",
    category: "Professionnel",
  },
  {
    id: "7",
    name: "Steam",
    username: "LiamVonAstoria",
    password: "Steam_Game2024!Key",
    url: "https://store.steampowered.com",
    favorite: false,
    createdAt: "8 juin 2024",
    category: "Divertissement",
  },
];

const CATEGORIES = [
  "Tous",
  "Google",
  "Développement",
  "Divertissement",
  "Social",
  "Communication",
  "Professionnel",
];

function PasswordModal({
  isOpen,
  onClose,
  onSave,
  editingPassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: Omit<PasswordEntry, "id" | "createdAt">) => void;
  editingPassword?: PasswordEntry | null;
}) {
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    url: "",
    category: "Google",
    favorite: false,
    notes: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (editingPassword) {
      setFormData({
        name: editingPassword.name,
        username: editingPassword.username,
        password: editingPassword.password,
        url: editingPassword.url,
        category: editingPassword.category,
        favorite: editingPassword.favorite,
        notes: editingPassword.notes || "",
      });
    } else {
      setFormData({
        name: "",
        username: "",
        password: "",
        url: "",
        category: "Google",
        favorite: false,
        notes: "",
      });
    }
  }, [editingPassword, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="mb-4 flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {editingPassword ? "Modifier le mot de passe" : "Ajouter un mot de passe"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Google"
                  required
                  className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">
                  Nom d&apos;utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ex: user@email.com"
                  required
                  className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-md border border-border bg-input px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {CATEGORIES.filter((c) => c !== "Tous").map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium text-foreground">Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ajouter des notes..."
                  rows={3}
                  className="resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, favorite: !formData.favorite })}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    formData.favorite
                      ? "text-yellow-500 bg-yellow-500/10"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {formData.favorite ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </motion.div>
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                  Favori
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-end gap-3 pt-4 border-t border-border"
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {editingPassword ? "Enregistrer" : "Ajouter"}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PasswordItem({
  password,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  password: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<"password" | "username" | null>(null);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const copyToClipboard = async (text: string, field: "password" | "username") => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAvatarColor = (name: string) => {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(), 300);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0, scale: 1, height: isDeleting ? 0 : "auto" }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getAvatarColor(
          password.name
        )} text-sm font-semibold text-white`}
      >
        {password.name.charAt(0).toUpperCase()}
      </motion.div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm font-medium text-foreground truncate"
          >
            {password.name}
          </motion.span>
          <AnimatePresence>
            {password.favorite && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-muted-foreground truncate"
        >
          {password.username}
        </motion.span>
        {password.url && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-xs text-muted-foreground/60 truncate"
          >
            {password.url}
          </motion.span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPassword(!showPassword)}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title={showPassword ? "Masquer" : "Afficher"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: showPassword ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => copyToClipboard(password.username, "username")}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Copier l'identifiant"
        >
          <AnimatePresence mode="wait">
            {copiedField === "username" ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => copyToClipboard(password.password, "password")}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Copier le mot de passe"
        >
          <AnimatePresence mode="wait">
            {copiedField === "password" ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFavorite}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title={password.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <motion.div whileTap={{ rotate: 15 }}>
            {password.favorite ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </motion.div>
        </motion.button>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Plus d'options"
          >
            <motion.div animate={{ rotate: showMenu ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <MoreVertical className="h-4 w-4" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-border bg-card shadow-lg"
              >
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                {password.url && (
                  <a
                    href={password.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir le site
                  </a>
                )}
                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPassword && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 overflow-hidden rounded-md border border-border bg-popover px-4 py-2 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-foreground">{password.password}</code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => copyToClipboard(password.password, "password")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <AnimatePresence mode="wait">
                  {copiedField === "password" ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="h-4 w-4 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Copy className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PasswordPage() {
  const [passwords, setPasswords] = React.useState<PasswordEntry[]>(MOCK_PASSWORDS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Tous");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState<PasswordEntry | null>(null);

  const filteredPasswords = React.useMemo(() => {
    return passwords.filter((password) => {
      const matchesSearch =
        searchQuery === "" ||
        password.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "Tous" || password.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [passwords, searchQuery, selectedCategory]);

  const handleSavePassword = (data: Omit<PasswordEntry, "id" | "createdAt">) => {
    if (editingPassword) {
      setPasswords(passwords.map((p) => (p.id === editingPassword.id ? { ...p, ...data } : p)));
    } else {
      const newPassword: PasswordEntry = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
      setPasswords([newPassword, ...passwords]);
    }
    setEditingPassword(null);
  };

  const handleDeletePassword = (id: string) => {
    setPasswords(passwords.filter((p) => p.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setPasswords(passwords.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));
  };

  const openEditModal = (password: PasswordEntry) => {
    setEditingPassword(password);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPassword(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-3 w-full">
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
                >
                  <Key className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <h1 className="text-xl font-semibold text-foreground">Password Vault</h1>
              </div>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAddModal}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher dans vos mots de passe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2"
              >
                {CATEGORIES.map((category, index) => (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between border-t border-border pt-3"
              >
                <span className="text-xs text-muted-foreground">
                  {filteredPasswords.length} mot{filteredPasswords.length !== 1 ? "s" : ""} de passe
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Chiffré de bout en bout</span>
                </div>
              </motion.div>
            </motion.div>

            <AnimatePresence mode="popLayout">
              {filteredPasswords.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"
                  >
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </motion.div>
                  <p className="text-sm font-medium text-foreground">Aucun mot de passe trouvé</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery || selectedCategory !== "Tous"
                      ? "Essayez de modifier vos critères de recherche"
                      : "Ajoutez votre premier mot de passe"}
                  </p>
                  {!searchQuery && selectedCategory === "Tous" && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openAddModal}
                      className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un mot de passe
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <motion.div className="flex flex-col gap-3">
                  {filteredPasswords.map((password, index) => (
                    <motion.div
                      key={password.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <PasswordItem
                        password={password}
                        onEdit={() => openEditModal(password)}
                        onDelete={() => handleDeletePassword(password.id)}
                        onToggleFavorite={() => handleToggleFavorite(password.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Footer />
        </div>
      </div>

      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPassword(null);
        }}
        onSave={handleSavePassword}
        editingPassword={editingPassword}
      />
    </div>
  );
}
