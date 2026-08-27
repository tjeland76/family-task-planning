import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CurrentMembership = {
  familyId: string;
  familyName: string;
  joinCode: string;
  familyMemberId: string;
  displayName: string;
};

export type FamilyMember = {
  id: string;
  displayName: string;
  role: "parent" | "child";
};

/**
 * The signed-in user's family membership, or null if they've authenticated
 * but haven't created/joined a family yet (onboarding not complete).
 */
export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return null;

  const { data, error } = await supabase
    .from("family_members")
    .select("id, display_name, families(id, name, join_code)")
    .eq("profile_id", profile.id)
    .single();

  if (error || !data || !data.families) return null;

  const family = Array.isArray(data.families) ? data.families[0] : data.families;
  if (!family) return null;

  return {
    familyId: family.id,
    familyName: family.name,
    joinCode: family.join_code,
    familyMemberId: data.id,
    displayName: data.display_name,
  };
}

/**
 * All members of a family (parents and children), parents first. Relies on
 * RLS to scope this to families the caller actually belongs to.
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, display_name, role")
    .eq("family_id", familyId)
    .order("role")
    .order("display_name");

  if (error || !data) return [];

  return data.map((member) => ({
    id: member.id,
    displayName: member.display_name,
    role: member.role,
  }));
}
