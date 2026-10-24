import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GUEST_ONLY_PATHS, isProtectedPath, LOGIN_PATH, redirectAfterLogin } from "@/lib/auth/roles";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Ne rien exécuter entre createServerClient et getClaims : getClaims vérifie
  // le jeton et rafraîchit la session si elle arrive à expiration.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const isSignedIn = Boolean(userId);

  const { pathname, search } = request.nextUrl;
  if (!isSignedIn && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    url.searchParams.set("suivant", pathname + search);
    return NextResponse.redirect(url);
  }

  // Déjà connecté : la connexion et l'inscription renvoient vers son espace
  // (ou la page demandée). Un compte désactivé peut encore voir ces pages.
  if (userId && GUEST_ONLY_PATHS.includes(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .single();
    if (profile?.is_active) {
      const url = request.nextUrl.clone();
      const target = new URL(redirectAfterLogin(profile.role, request.nextUrl.searchParams.get("suivant")), url);
      url.pathname = target.pathname;
      url.search = target.search;
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  return supabaseResponse;
}
