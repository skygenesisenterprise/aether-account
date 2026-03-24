"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  StarOff,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Footer } from "../_components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Contact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  favorite: boolean;
  category: string;
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

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Thomas Martin",
    firstName: "Thomas",
    lastName: "Martin",
    email: "thomas.martin@exemple.com",
    phone: "+32 470 12 34 56",
    company: "Sky Genesis Enterprise",
    address: "Rue de la Science 10, Bruxelles",
    favorite: true,
    category: "Travail",
  },
  {
    id: "2",
    name: "Sophie Dubois",
    firstName: "Sophie",
    lastName: "Dubois",
    email: "sophie.dubois@exemple.com",
    phone: "+32 471 23 45 67",
    company: "Aether Inc",
    address: "Avenue des Arts 5, Bruxelles",
    favorite: true,
    category: "Travail",
  },
  {
    id: "3",
    name: "Lucas Bernard",
    firstName: "Lucas",
    lastName: "Bernard",
    email: "lucas.bernard@exemple.com",
    phone: "+32 472 34 56 78",
    company: "",
    address: "Rue du Marché 15, Liège",
    favorite: false,
    category: "Personnel",
  },
  {
    id: "4",
    name: "Emma Petit",
    firstName: "Emma",
    lastName: "Petit",
    email: "emma.petit@exemple.com",
    phone: "+32 473 45 67 89",
    company: "Université de Liège",
    address: "Place du XX Août 20, Liège",
    favorite: false,
    category: "Université",
  },
  {
    id: "5",
    name: "Nathan Jacobs",
    firstName: "Nathan",
    lastName: "Jacobs",
    email: "nathan.jacobs@exemple.com",
    phone: "+32 474 56 78 90",
    company: "Tech Solutions",
    address: "Boulevard de la Constitution 45, Namur",
    favorite: false,
    category: "Travail",
  },
  {
    id: "6",
    name: "Chloé Laurent",
    firstName: "Chloé",
    lastName: "Laurent",
    email: "chloe.laurent@exemple.com",
    phone: "+32 475 67 89 01",
    company: "",
    address: "Rue des Lilas 8, Anvers",
    favorite: false,
    category: "Personnel",
  },
];

const CATEGORIES = ["Tous", "Travail", "Personnel", "Université", "Famille"];

function ContactModal({
  isOpen,
  onClose,
  onSave,
  editingContact,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<Contact, "id">) => void;
  editingContact?: Contact | null;
}) {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    category: "Travail",
    favorite: false,
  });

  React.useEffect(() => {
    if (editingContact) {
      setFormData({
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        email: editingContact.email,
        phone: editingContact.phone,
        company: editingContact.company,
        address: editingContact.address,
        category: editingContact.category,
        favorite: editingContact.favorite,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        category: "Travail",
        favorite: false,
      });
    }
  }, [editingContact, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingContact ? "Modifier le contact" : "Ajouter un contact"}</DialogTitle>
          <DialogDescription>
            {editingContact
              ? "Modifiez les informations du contact."
              : "Ajoutez un nouveau contact à votre liste."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Prénom</label>
              <Input
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Nom</label>
              <Input
                placeholder="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">E-mail</label>
            <Input
              type="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Téléphone</label>
            <Input
              placeholder="+32 470 00 00 00"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Entreprise</label>
            <Input
              placeholder="Nom de l'entreprise"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Adresse</label>
            <Input
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.filter((c) => c !== "Tous").map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
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
                <Star className="h-4 w-4 fill-current" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
              Favori
            </button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">{editingContact ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Tous");
  const [showModal, setShowModal] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletingContactId, setDeletingContactId] = React.useState<string>("");

  const filteredContacts = React.useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        searchQuery === "" ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "Tous" || contact.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [contacts, searchQuery, selectedCategory]);

  const getAvatarColor = (name: string) => {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  const handleSaveContact = (data: Omit<Contact, "id">) => {
    if (editingContact) {
      setContacts(contacts.map((c) => (c.id === editingContact.id ? { ...c, ...data } : c)));
    } else {
      const newContact: Contact = {
        ...data,
        id: crypto.randomUUID(),
      };
      setContacts([newContact, ...contacts]);
    }
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    setShowDeleteModal(false);
  };

  const handleToggleFavorite = (id: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)));
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setShowModal(true);
  };

  const openDeleteModal = (id: string) => {
    setDeletingContactId(id);
    setShowDeleteModal(true);
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
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
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
                  placeholder="Rechercher un contact..."
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
                    transition={{
                      delay: 0.2 + index * 0.05,
                      type: "spring",
                      stiffness: 200,
                    }}
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
                  {filteredContacts.length} contact
                  {filteredContacts.length !== 1 ? "s" : ""}
                </span>
              </motion.div>
            </motion.div>

            {filteredContacts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                <p className="text-sm font-medium text-foreground">Aucun contact trouvé</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchQuery || selectedCategory !== "Tous"
                    ? "Essayez de modifier vos critères de recherche"
                    : "Ajoutez votre premier contact"}
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
                    Ajouter un contact
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div className="flex flex-col gap-3">
                {filteredContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getAvatarColor(
                        contact.name
                      )} text-sm font-semibold text-white`}
                    >
                      {contact.firstName.charAt(0)}
                      {contact.lastName.charAt(0)}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {contact.name}
                        </span>
                        {contact.favorite && (
                          <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </span>
                      {contact.company && (
                        <span className="text-xs text-muted-foreground/60 truncate">
                          {contact.company}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFavorite(contact.id)}
                        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={contact.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {contact.favorite ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(contact)}
                        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(contact.id)}
                        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Contacts favoris</h2>
              </div>
              <div className="flex flex-col gap-2">
                {contacts
                  .filter((c) => c.favorite)
                  .slice(0, 5)
                  .map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => openEditModal(contact)}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getAvatarColor(
                          contact.name
                        )} text-xs font-semibold text-white`}
                      >
                        {contact.firstName.charAt(0)}
                        {contact.lastName.charAt(0)}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.email}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  ))}
                {contacts.filter((c) => c.favorite).length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    Aucun favori. Cliquez sur l&apos;étoile pour ajouter un favori.
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          <Footer />
        </div>
      </div>

      <ContactModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        editingContact={editingContact}
      />

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contact</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteContact(deletingContactId)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
