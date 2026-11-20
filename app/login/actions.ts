"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

function back(message: string, kind: "error" | "info" = "error"): never {
  redirect(`/login?${kind}=${encodeURIComponent(message)}`);
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
  redirect("/");
}

export async function signUp(formData: FormData) {
  if (!supabaseConfigured()) back("Sign up isn't set up yet.");
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

export async function signOut() {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
