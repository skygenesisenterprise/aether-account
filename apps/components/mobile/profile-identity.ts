export interface MobileProfileIdentityInput {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export function getMobileProfileName(user?: MobileProfileIdentityInput) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Compte Aether";
}

export function getMobileProfileSubtitle(user?: MobileProfileIdentityInput) {
  return user?.email ?? "Compte";
}

export function getMobileProfileInitials(user?: MobileProfileIdentityInput) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const source = fullName || user?.email?.split("@")[0] || "Aether";

  return (
    source
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}
