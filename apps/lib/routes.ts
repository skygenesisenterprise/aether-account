export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";
export const DEFAULT_PLATFORM_ROUTE = "/chat";

export const AUTH_ROUTES = [
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export const PLATFORM_ROUTES = [
  "/contacts",
  "/projects",
  "/resources",
  "/tasks",
  "/calendar",
  "/calls",
  DEFAULT_PLATFORM_ROUTE,
  "/drive",
  "/notifications",
  "/settings",
  "/teams",
  "/applications",
] as const;

export function isExactRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

export function isNestedRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => isExactRoute(pathname, route));
}

export function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_ROUTES.some((route) => isNestedRoute(pathname, route));
}
