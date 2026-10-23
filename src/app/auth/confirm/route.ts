import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Arrivée depuis un email (confirmation d'inscription ou mot de passe oublié).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const requested = searchParams.get("suivant") ?? "/";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("Lien incomplet") };

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
