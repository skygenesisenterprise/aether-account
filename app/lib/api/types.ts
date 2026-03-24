export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  data?: TokenResponse;
  error?: string;
  message?: string;
}

export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phone: string;
  birthDate: string;
  language: string;
  avatarUrl: string;
  aetherId: string;
  accountType: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  value: string;
  isPrimary: boolean;
}

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export interface Password {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  favorite: boolean;
  category: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PasswordListResponse {
  success: boolean;
  data?: Password[];
  error?: string;
}

export interface PasswordResponse {
  success: boolean;
  data?: Password;
  error?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  os?: string;
  browser?: string;
  lastSeen?: string;
  isTrusted: boolean;
}

export interface Session {
  id: string;
  token?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface SecurityActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  device?: string;
  ipAddress?: string;
  time?: string;
}

export interface TwoFactorConfig {
  enabled: boolean;
  method?: string;
}

export interface SecurityData {
  devices: Device[];
  sessions: Session[];
  activities: SecurityActivity[];
  twoFactor: TwoFactorConfig;
  passkeyEnabled: boolean;
  secureNavigation: boolean;
}

export interface SecurityResponse {
  success: boolean;
  data?: SecurityData;
  error?: string;
}

export interface DevicesResponse {
  success: boolean;
  data?: Device[];
  error?: string;
}

export interface SessionsResponse {
  success: boolean;
  data?: Session[];
  error?: string;
}

export interface ActivitiesResponse {
  success: boolean;
  data?: SecurityActivity[];
  error?: string;
}

export interface ThirdPartyApp {
  id: string;
  name: string;
  accessLevel: string;
  connectedAt?: string;
}

export interface ThirdPartyResponse {
  success: boolean;
  data?: ThirdPartyApp[];
  error?: string;
}

export interface Contact {
  id: string;
  accountId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  avatarUrl?: string;
  starred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactGroup {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  totalContacts?: number;
  createdAt?: string;
}

export interface ContactList {
  accountId: string;
  totalContacts: number;
  contacts: Contact[];
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface ContactListResponse {
  success: boolean;
  data?: ContactList;
  error?: string;
}

export interface ContactResponse {
  success: boolean;
  data?: Contact;
  error?: string;
}

export interface GroupListResponse {
  success: boolean;
  data?: {
    accountId: string;
    groups: ContactGroup[];
    total: number;
  };
  error?: string;
}

export interface GroupResponse {
  success: boolean;
  data?: ContactGroup;
  error?: string;
}

export interface AccountPrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  analytics: boolean;
  locationTracking: boolean;
}

export interface PrivacyResponse {
  success: boolean;
  data?: AccountPrivacySettings;
  error?: string;
}

export interface DataExportResponse {
  success: boolean;
  message?: string;
  dataUrl?: string;
  error?: string;
}
