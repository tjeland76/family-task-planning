import { describe, expect, it } from "vitest";
import { shouldNotifyAssignment } from "@/lib/notifications/rules";

describe("shouldNotifyAssignment", () => {
  it("does not notify when the creator assigns the task to themselves", () => {
    expect(shouldNotifyAssignment({ createdBy: "dad", assignedTo: "dad" })).toBe(false);
  });

  it("notifies when the task is assigned to someone other than the creator", () => {
    expect(shouldNotifyAssignment({ createdBy: "dad", assignedTo: "mum" })).toBe(true);
  });

  it("does not notify when the task is unassigned", () => {
    expect(shouldNotifyAssignment({ createdBy: "dad", assignedTo: null })).toBe(false);
  });
});
