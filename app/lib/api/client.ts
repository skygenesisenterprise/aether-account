const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (isProduction) {
    return "https://api.account.skygenesisenterprise.com";
  }
  if (isStaging) {
    return "https://api-staging.account.skygenesisenterprise.com";
  }
  return "http://localhost:8080";
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

import type {
  AuthResponse,
  TokenResponse,
  ProfileResponse,
  ProfileData,
  PasswordListResponse,
  PasswordResponse,
  SecurityResponse,
  DevicesResponse,
  SessionsResponse,
  ActivitiesResponse,
  ThirdPartyResponse,
  ContactListResponse,
  ContactResponse,
  GroupListResponse,
  GroupResponse,
  PrivacyResponse,
  DataExportResponse,
} from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", { email, password }),

  logout: () => apiClient.post<AuthResponse>("/api/v1/auth/logout"),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/refresh", { refresh_token: refreshToken }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/change-password", { currentPassword, newPassword }),

  resetPassword: (email: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/reset-password", { email }),

  getAccount: () => apiClient.get<AuthResponse>("/api/v1/account/me"),

  storeTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken || "");
    }
  },

  clearTokens: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  getStoredUser: (): TokenResponse["user"] | null => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  storeUser: (user: TokenResponse["user"]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  },

  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },
};

export const profileApi = {
  get: () => apiClient.get<ProfileResponse>("/api/v1/profile/"),

  update: (data: Partial<ProfileData>) => apiClient.put<ProfileResponse>("/api/v1/profile/", data),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/api/v1/profile/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    return response.json();
  },
};

export const passwordApi = {
  list: () => apiClient.get<PasswordListResponse>("/api/v1/passwords/"),

  get: (id: string) => apiClient.get<PasswordResponse>(`/api/v1/passwords/${id}`),

  create: (data: {
    name: string;
    username?: string;
    password?: string;
    url?: string;
    category: string;
    notes?: string;
  }) => apiClient.post<PasswordResponse>("/api/v1/passwords/", data),

  update: (
    id: string,
    data: {
      name?: string;
      username?: string;
      password?: string;
      url?: string;
      category?: string;
      notes?: string;
      favorite?: boolean;
    }
  ) => apiClient.put<PasswordResponse>(`/api/v1/passwords/${id}`, data),

  delete: (id: string) => apiClient.delete<PasswordResponse>(`/api/v1/passwords/${id}`),
};

export const securityApi = {
  getInfo: () => apiClient.get<SecurityResponse>("/api/v1/security/"),

  getDevices: () => apiClient.get<DevicesResponse>("/api/v1/security/devices"),

  getSessions: () => apiClient.get<SessionsResponse>("/api/v1/security/sessions"),

  getActivities: () => apiClient.get<ActivitiesResponse>("/api/v1/security/activities"),

  trustDevice: (id: string) =>
    apiClient.post<DevicesResponse>(`/api/v1/security/devices/${id}/trust`),

  revokeDevice: (id: string) => apiClient.delete<DevicesResponse>(`/api/v1/security/devices/${id}`),

  revokeSession: (id: string) =>
    apiClient.delete<SessionsResponse>(`/api/v1/security/sessions/${id}`),

  enableTwoFactor: (method: string, code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/enable", { method, code }),

  disableTwoFactor: (code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/disable", { code }),

  verifyTwoFactor: (code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/verify", { code }),
};

export const thirdPartyApi = {
  list: () => apiClient.get<ThirdPartyResponse>("/api/v1/third-party/"),

  connect: (appName: string, authCode: string) =>
    apiClient.post<ThirdPartyResponse>("/api/v1/third-party/", {
      app_name: appName,
      auth_code: authCode,
    }),

  revoke: (id: string) => apiClient.delete<ThirdPartyResponse>(`/api/v1/third-party/${id}`),
};

export const contactApi = {
  list: (params?: { offset?: number; limit?: number }) => {
    const queryParams: Record<string, string> = {};
    if (params?.offset !== undefined) queryParams.offset = String(params.offset);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);
    return apiClient.get<ContactListResponse>("/api/v1/contacts/", { params: queryParams });
  },

  get: (id: string) => apiClient.get<ContactResponse>(`/api/v1/contacts/${id}`),

  create: (data: {
    account_id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  }) => apiClient.post<ContactResponse>("/api/v1/contacts/", data),

  update: (
    id: string,
    data: {
      account_id: string;
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
    }
  ) => apiClient.put<ContactResponse>(`/api/v1/contacts/${id}`, data),

  delete: (id: string) => apiClient.delete<ContactResponse>(`/api/v1/contacts/${id}`),

  listGroups: () => apiClient.get<GroupListResponse>("/api/v1/contacts/groups"),

  createGroup: (data: { account_id: string; name: string; contact_ids?: string[] }) =>
    apiClient.post<GroupResponse>("/api/v1/contacts/groups", data),
};

export const privacyApi = {
  get: () => apiClient.get<PrivacyResponse>("/api/v1/privacy/"),

  update: (data: {
    profile_visibility?: string;
    show_email?: boolean;
    show_phone?: boolean;
    show_activity?: boolean;
    data_collection?: boolean;
    personalized_ads?: boolean;
    analytics?: boolean;
    location_tracking?: boolean;
  }) => apiClient.put<PrivacyResponse>("/api/v1/privacy/", data),

  export: (format: "json" | "csv" | "pdf") =>
    apiClient.post<DataExportResponse>("/api/v1/privacy/export", { format }),

  deleteAccount: (password: string, confirm: boolean) =>
    apiClient.post<AuthResponse>("/api/v1/privacy/delete", { password, confirm }),
};
