import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_PLATFORM_ROUTE, LOGIN_ROUTE } from "@/lib/routes";

const REFRESH_COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME ?? "aether_meet_refresh";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasActiveSession = Boolean(cookieStore.get(REFRESH_COOKIE_NAME)?.value);

  redirect(hasActiveSession ? DEFAULT_PLATFORM_ROUTE : LOGIN_ROUTE);
}
