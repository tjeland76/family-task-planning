"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/families/queries";

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

export async function addFamilyMember(formData: FormData): Promise<{ error?: string }> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) return { error: "Enter a name." };

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Something went wrong. Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("family_members").insert({
    family_id: membership.familyId,
    display_name: displayName,
    role: "child",
    profile_id: null,
  });

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/family");
  return {};
}

export async function renameFamilyMember(formData: FormData): Promise<{ error?: string }> {
  const memberId = String(formData.get("memberId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) return { error: "Enter a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .update({ display_name: displayName })
    .eq("id", memberId);

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/family");
  return {};
}

export async function removeFamilyMember(formData: FormData): Promise<void> {
  const memberId = String(formData.get("memberId") ?? "");

  const supabase = await createClient();
  await supabase.from("family_members").delete().eq("id", memberId);

  revalidatePath("/family");
}

export async function joinFamily(formData: FormData): Promise<{ error?: string }> {
  const joinCode = String(formData.get("joinCode") ?? "").trim();
  if (!joinCode) return { error: "Enter a join code." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_family_by_code", { p_join_code: joinCode });

  if (error) return { error: friendlyError(error.message) };

  redirect("/today");
}
