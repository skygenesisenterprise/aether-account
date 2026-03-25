"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  MapPin,
  Building,
  Key,
  ChevronRight,
  Camera,
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

interface PersonalInfo {
  firstName: string;
  lastName: string;
  gender: string;
  emails: string[];
  phone: string;
  birthDate: string;
  language: string;
}

interface Address {
  id: string;
  label: string;
  value: string;
  isEmpty: boolean;
}

const initialPersonalInfo: PersonalInfo = {
  firstName: "Liam",
  lastName: "Von Astoria",
  gender: "Homme",
  emails: ["john.doe@gmail.com"],
  phone: "+1 (555) 123-4567",
  birthDate: "1 janvier 2000",
  language: "Français (France)",
};

const initialAddresses: Address[] = [
  {
    id: "home",
    label: "Adresse domicile",
    value: "123 Rue de la Paix, Paris",
    isEmpty: false,
  },
  {
    id: "work",
    label: "Adresse professionnelle",
    value: "456 Avenue des Champs, Paris",
    isEmpty: false,
  },
  { id: "other", label: "Autres adresses", value: "", isEmpty: true },
];

export default function PersonalPage() {
  const [personalInfo, setPersonalInfo] = React.useState<PersonalInfo>(initialPersonalInfo);
  const [addresses, setAddresses] = React.useState<Address[]>(initialAddresses);

  const [editNameOpen, setEditNameOpen] = React.useState(false);
  const [editGenderOpen, setEditGenderOpen] = React.useState(false);
  const [editEmailOpen, setEditEmailOpen] = React.useState(false);
  const [editPhoneOpen, setEditPhoneOpen] = React.useState(false);
  const [editBirthOpen, setEditBirthOpen] = React.useState(false);
  const [editLanguageOpen, setEditLanguageOpen] = React.useState(false);
  const [editAddressOpen, setEditAddressOpen] = React.useState(false);
  const [editingAddressId, setEditingAddressId] = React.useState<string>("");
  const [editPasswordOpen, setEditPasswordOpen] = React.useState(false);

  const [tempFirstName, setTempFirstName] = React.useState(personalInfo.firstName);
  const [tempLastName, setTempLastName] = React.useState(personalInfo.lastName);
  const [tempGender, setTempGender] = React.useState(personalInfo.gender);
  const [tempEmail, setTempEmail] = React.useState("");
  const [tempPhone, setTempPhone] = React.useState(personalInfo.phone);
  const [tempBirthDate, setTempBirthDate] = React.useState(personalInfo.birthDate);
  const [tempLanguage, setTempLanguage] = React.useState(personalInfo.language);
  const [tempAddress, setTempAddress] = React.useState("");
  const [tempPassword, setTempPassword] = React.useState("");

  const openEditName = () => {
    setTempFirstName(personalInfo.firstName);
    setTempLastName(personalInfo.lastName);
    setEditNameOpen(true);
  };

  const saveEditName = () => {
    setPersonalInfo({ ...personalInfo, firstName: tempFirstName, lastName: tempLastName });
    setEditNameOpen(false);
  };

  const openEditGender = () => {
    setTempGender(personalInfo.gender);
    setEditGenderOpen(true);
  };

  const saveEditGender = () => {
    setPersonalInfo({ ...personalInfo, gender: tempGender });
    setEditGenderOpen(false);
  };

  const openEditEmail = () => {
    setTempEmail(personalInfo.emails[0]);
    setEditEmailOpen(true);
  };

  const saveEditEmail = () => {
    const newEmails = [tempEmail, personalInfo.emails[1] || ""];
    setPersonalInfo({ ...personalInfo, emails: newEmails });
    setEditEmailOpen(false);
  };

  const openEditPhone = () => {
    setTempPhone(personalInfo.phone);
    setEditPhoneOpen(true);
  };

  const saveEditPhone = () => {
    setPersonalInfo({ ...personalInfo, phone: tempPhone });
    setEditPhoneOpen(false);
  };

  const openEditBirthDate = () => {
    setTempBirthDate(personalInfo.birthDate);
    setEditBirthOpen(true);
  };

  const saveEditBirthDate = () => {
    setPersonalInfo({ ...personalInfo, birthDate: tempBirthDate });
    setEditBirthOpen(false);
  };

  const openEditLanguage = () => {
    setTempLanguage(personalInfo.language);
    setEditLanguageOpen(true);
  };

  const saveEditLanguage = () => {
    setPersonalInfo({ ...personalInfo, language: tempLanguage });
    setEditLanguageOpen(false);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setTempAddress(address.value);
    setEditAddressOpen(true);
  };

  const saveEditAddress = () => {
    setAddresses(
      addresses.map((addr) =>
        addr.id === editingAddressId ? { ...addr, value: tempAddress, isEmpty: !tempAddress } : addr
      )
    );
    setEditAddressOpen(false);
  };

  const saveEditPassword = () => {
    setEditPasswordOpen(false);
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
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground shadow-lg">
                  {personalInfo.firstName.charAt(0)}
                  {personalInfo.lastName.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-foreground shadow-md transition-colors hover:bg-secondary/80">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-lg font-medium font-sans text-foreground">Photo de profil</h2>
                <p className="text-xs text-muted-foreground">
                  Une photo aide les autres à vous reconnaître
                </p>
              </div>
              <button className="mt-1 rounded-md border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                Ajouter une photo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    Informations personnelles
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Nom</span>
                    <span className="text-sm font-medium text-foreground">
                      {personalInfo.firstName} {personalInfo.lastName}
                    </span>
                  </div>
                  <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditName}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le nom</DialogTitle>
                        <DialogDescription>Entrez votre nouveau nom et prénom.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Prénom"
                          value={tempFirstName}
                          onChange={(e) => setTempFirstName(e.target.value)}
                        />
                        <Input
                          placeholder="Nom"
                          value={tempLastName}
                          onChange={(e) => setTempLastName(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditNameOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditName}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Genre</span>
                    <span className="text-sm font-medium text-foreground">
                      {personalInfo.gender}
                    </span>
                  </div>
                  <Dialog open={editGenderOpen} onOpenChange={setEditGenderOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditGender}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le genre</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tempGender}
                          onChange={(e) => setTempGender(e.target.value)}
                        >
                          <option value="Homme">Homme</option>
                          <option value="Femme">Femme</option>
                          <option value="Autre">Autre</option>
                          <option value="Préfère ne pas dire">Préfère ne pas dire</option>
                        </select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditGenderOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditGender}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Adresses e-mail</span>
                    {personalInfo.emails.map((email, i) => (
                      <span key={i} className="text-sm font-medium text-foreground">
                        {email}
                      </span>
                    ))}
                  </div>
                  <Dialog open={editEmailOpen} onOpenChange={setEditEmailOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditEmail}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier l'adresse e-mail</DialogTitle>
                        <DialogDescription>
                          Entrez votre nouvelle adresse e-mail principale.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Adresse e-mail"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditEmailOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditEmail}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Téléphone</span>
                    <span className="text-sm font-medium text-foreground">
                      {personalInfo.phone}
                    </span>
                  </div>
                  <Dialog open={editPhoneOpen} onOpenChange={setEditPhoneOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditPhone}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le téléphone</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Numéro de téléphone"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPhoneOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditPhone}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Date de naissance</span>
                    <span className="text-sm font-medium text-foreground">
                      {personalInfo.birthDate}
                    </span>
                  </div>
                  <Dialog open={editBirthOpen} onOpenChange={setEditBirthOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditBirthDate}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la date de naissance</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Date de naissance"
                          value={tempBirthDate}
                          onChange={(e) => setTempBirthDate(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditBirthOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditBirthDate}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">Langue</span>
                    <span className="text-sm font-medium text-foreground">
                      {personalInfo.language}
                    </span>
                  </div>
                  <Dialog open={editLanguageOpen} onOpenChange={setEditLanguageOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="text-xs font-medium text-[#1a73e8] hover:underline"
                        onClick={openEditLanguage}
                      >
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la langue</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={tempLanguage}
                          onChange={(e) => setTempLanguage(e.target.value)}
                        >
                          <option value="Français (France)">Français (France)</option>
                          <option value="English (US)">English (US)</option>
                          <option value="Deutsch">Deutsch</option>
                          <option value="Español">Español</option>
                          <option value="Nederlands">Nederlands</option>
                        </select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditLanguageOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditLanguage}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Adresses</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {addresses.map((address, index) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-xs text-muted-foreground">{address.label}</span>
                      <span
                        className={`text-sm font-medium ${
                          address.isEmpty ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {address.isEmpty ? "Aucune adresse" : address.value}
                      </span>
                    </div>
                    <Dialog
                      open={editAddressOpen && editingAddressId === address.id}
                      onOpenChange={setEditAddressOpen}
                    >
                      <DialogTrigger asChild>
                        <button
                          className="text-xs font-medium text-[#1a73e8] hover:underline"
                          onClick={() => openEditAddress(address)}
                        >
                          {address.isEmpty ? "Ajouter" : "Modifier"}
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier l'adresse</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <Input
                            placeholder="Adresse"
                            value={tempAddress}
                            onChange={(e) => setTempAddress(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditAddressOpen(false)}>
                            Annuler
                          </Button>
                          <Button onClick={saveEditAddress}>Enregistrer</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Sécurité</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">Mot de passe Aether</span>
                    <span className="text-xs text-muted-foreground">
                      Dernière modification : 30 juil. 2022
                    </span>
                  </div>
                  <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le mot de passe</DialogTitle>
                        <DialogDescription>Entrez votre nouveau mot de passe.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPasswordOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditPassword}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Compte Aether</h2>
                </div>
                <a
                  href="/personal"
                  className="flex items-center gap-1 text-xs font-medium text-[#1a73e8] hover:underline"
                >
                  Gérer <ChevronRight className="h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Identifiant unique</span>
                  <span className="text-sm font-medium text-foreground">Aether ID: #847291</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Type de compte</span>
                  <span className="text-sm font-medium text-foreground">Entreprise</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Membre depuis</span>
                  <span className="text-sm font-medium text-foreground">Janvier 2024</span>
                </div>
              </div>
            </motion.div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}
