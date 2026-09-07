/**
 * Whether creating/reassigning a task to `assignedTo` should notify that
 * person, per spec: don't notify on self-assignment or when unassigned.
 */
export function shouldNotifyAssignment({
  createdBy,
  assignedTo,
}: {
  createdBy: string;
  assignedTo: string | null;
}): boolean {
  return assignedTo !== null && assignedTo !== createdBy;
}
