"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function friendlyError(message: string): string {
  switch (message) {
    case "already_in_family":
      return "This account already belongs to a family.";
    case "invalid_join_code":
      return "That join code doesn't match a family. Double-check it with your partner.";
    case "no_profile_for_user":
      return "Your account isn't fully set up yet — try signing out and back in.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function createFamily(formData: FormData): Promise<{ error?: string }> {
  const familyName = String(formData.get("familyName") ?? "").trim();
  if (!familyName) return { error: "Enter a family name." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_family", { p_family_name: familyName });

  if (error) return { error: friendlyError(error.message) };

  redirect("/today");
}

export async function joinFamily(formData: FormData): Promise<{ error?: string }> {
  const joinCode = String(formData.get("joinCode") ?? "").trim();
  if (!joinCode) return { error: "Enter a join code." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_family_by_code", { p_join_code: joinCode });

  if (error) return { error: friendlyError(error.message) };

  redirect("/today");
}
