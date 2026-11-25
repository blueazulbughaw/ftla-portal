"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

function back(message: string, kind: "error" | "info" = "error"): never {
  redirect(`/login?${kind}=${encodeURIComponent(message)}`);
}

/**
 * Google and email links come back to /auth/confirm, which must match Supabase's allowed
 * redirect URL exactly, so the page to return to is kept in a short-lived cookie instead.
 */
async function rememberNext(formData: FormData) {
  (await cookies()).set("after_login", nextPath(formData), { path: "/", maxAge: 60 * 30, sameSite: "lax", httpOnly: true });
}

/** Where to go after signing in: a page on this site, or the hub. */
function nextPath(formData: FormData): string {
  const n = String(formData.get("next") || "");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/hub";
}

function readForm(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) back("Enter your email and a password.");
  return { email, password };
}

export async function signIn(formData: FormData) {
  if (!supabaseConfigured()) back("Sign in isn't set up yet.");
  const { email, password } = readForm(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) back(error.message);
  redirect(nextPath(formData));
}

export async function signUp(formData: FormData) {
  if (!supabaseConfigured()) back("Sign up isn't set up yet.");
  await rememberNext(formData);
  const { email, password } = readForm(formData);
  if (password.length < 8) back("Use a password with at least 8 characters.");
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) back(error.message);
  back("Check your email for a link to confirm your account.", "info");
}

export async function signInWithGoogle(formData: FormData) {
  if (!supabaseConfigured()) back("Sign in isn't set up yet.");
  await rememberNext(formData);
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm` },
  });
  if (error || !data.url) back(error?.message ?? "Google sign in didn't start. Try again.");
  // Send the person to Google's sign-in page. Google sends them back to /auth/confirm.
  redirect(data.url);
}

export async function signOut() {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
