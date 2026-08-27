import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration test against the linked Supabase project (spec section 27.13
 * — tests around family access, not mocks). Requires SUPABASE_SERVICE_ROLE_KEY
 * so afterAll can delete the throwaway test users/families it creates; it's
 * skipped without one rather than leaving debris in a real project.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(!url || !anonKey || !serviceRoleKey)("family RLS isolation", () => {
  let admin: SupabaseClient;
  const userIds: string[] = [];

  async function signedUpClient(displayName: string) {
    const client = createClient(url!, anonKey!);
    const email = `rls-test-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomUUID();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("signUp did not return a user");
    if (!data.session) {
      throw new Error(
        "signUp did not return a session — disable 'Confirm email' in Auth settings for this test project",
      );
    }
    userIds.push(data.user.id);
    return client;
  }

  let familyAOwner: SupabaseClient;
  let familyAJoiner: SupabaseClient;
  let familyBOwner: SupabaseClient;
  let familyAId: string;
  let taskId: string;
  let childId: string;

  beforeAll(async () => {
    admin = createClient(url!, serviceRoleKey!);
    familyAOwner = await signedUpClient("Test Owner A");
    familyAJoiner = await signedUpClient("Test Joiner A");
    familyBOwner = await signedUpClient("Test Owner B");

    const { data: familyA, error: createError } = await familyAOwner.rpc("create_family", {
      p_family_name: "RLS Test Family A",
    });
    if (createError) throw createError;
    familyAId = familyA![0].family_id;

    const { error: joinError } = await familyAJoiner.rpc("join_family_by_code", {
      p_join_code: familyA![0].join_code,
    });
    if (joinError) throw joinError;

    const { error: bError } = await familyBOwner.rpc("create_family", {
      p_family_name: "RLS Test Family B",
    });
    if (bError) throw bError;

    const { data: ownerMember } = await familyAOwner
      .from("family_members")
      .select("id")
      .eq("family_id", familyAId)
      .single();

    const { data: task, error: taskError } = await familyAOwner
      .from("tasks")
      .insert({ family_id: familyAId, title: "RLS test task", created_by: ownerMember!.id })
      .select("id")
      .single();
    if (taskError) throw taskError;
    taskId = task!.id;

    const { data: child, error: childError } = await familyAOwner
      .from("family_members")
      .insert({ family_id: familyAId, display_name: "RLS test child", role: "child", profile_id: null })
      .select("id")
      .single();
    if (childError) throw childError;
    childId = child!.id;
  });

  afterAll(async () => {
    for (const id of userIds) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  it("lets a second parent who joined by code see the family's task", async () => {
    const { data, error } = await familyAJoiner.from("tasks").select("id").eq("id", taskId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("does not let a different family see the task", async () => {
    const { data, error } = await familyBOwner.from("tasks").select("id").eq("id", taskId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("does not let a different family update the task", async () => {
    await familyBOwner.from("tasks").update({ title: "Hijacked" }).eq("id", taskId);

    const { data } = await admin.from("tasks").select("title").eq("id", taskId).single();
    expect(data?.title).toBe("RLS test task");
  });

  it("does not let a different family delete the task", async () => {
    await familyBOwner.from("tasks").delete().eq("id", taskId);

    const { data } = await admin.from("tasks").select("id").eq("id", taskId);
    expect(data).toHaveLength(1);
  });

  it("does not let a different family see family_members rows", async () => {
    const { data, error } = await familyBOwner
      .from("family_members")
      .select("id")
      .eq("family_id", familyAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("does not let a different family see categories", async () => {
    const { data, error } = await familyBOwner
      .from("categories")
      .select("id")
      .eq("family_id", familyAId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("lets a same-family parent see and rename a child member", async () => {
    const { data: seen, error: selectError } = await familyAJoiner
      .from("family_members")
      .select("id")
      .eq("id", childId);
    expect(selectError).toBeNull();
    expect(seen).toHaveLength(1);

    const { error: updateError } = await familyAJoiner
      .from("family_members")
      .update({ display_name: "Renamed by joiner" })
      .eq("id", childId);
    expect(updateError).toBeNull();
  });

  it("does not let a different family see, rename, or delete a child member", async () => {
    const { data: seen, error: selectError } = await familyBOwner
      .from("family_members")
      .select("id")
      .eq("id", childId);
    expect(selectError).toBeNull();
    expect(seen).toHaveLength(0);

    await familyBOwner
      .from("family_members")
      .update({ display_name: "Hijacked" })
      .eq("id", childId);
    await familyBOwner.from("family_members").delete().eq("id", childId);

    const { data: stillThere } = await admin
      .from("family_members")
      .select("display_name")
      .eq("id", childId)
      .single();
    expect(stillThere?.display_name).toBe("Renamed by joiner");
  });
});
