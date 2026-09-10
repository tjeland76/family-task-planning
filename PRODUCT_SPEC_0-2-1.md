# UX: Add Consistent Loading States for User Actions

## Summary

Add simple, consistent loading states across Family Tasks so users can clearly see when an action is in progress.

The goal is to improve perceived responsiveness, prevent duplicate submissions, and make async behaviour feel more polished without adding unnecessary complexity.

---

## User Problem

Some actions in the application currently happen asynchronously without obvious feedback.

This can make it unclear whether:

* A button press was registered.
* A task is still being saved.
* A completion action is still processing.
* A user should tap again.

This can lead to uncertainty and duplicate submissions.

---

## UX Principle

Use loading feedback close to the action the user initiated.

Prefer:

```text
[ ⟳ Saving... ]
```

over replacing the entire page with a full-screen loader.

Only use a page-level loader when the application genuinely has no meaningful content to show yet.

---

# Functional Requirements

## 1. Reusable Loading Indicator

Create a reusable loading spinner component.

Suggested API:

```tsx
<Spinner size="sm" />
```

Supported sizes:

```text
sm
md
```

The spinner should:

* Use existing Tailwind styling.
* Inherit the current text colour where practical.
* Be visually lightweight.
* Be reusable across buttons and inline actions.
* Use `aria-hidden="true"` when accompanied by visible loading text.

Example implementation shape:

```tsx
export function Spinner({
  size = "sm",
}: {
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  );
}
```

Claude Code should adapt this to the existing component structure rather than creating duplicate UI patterns.

---

# 2. Button Loading State

Async buttons should support a loading state.

Example:

```text
Idle
[ Add Task ]

Loading
[ ⟳ Adding... ]
```

While loading:

* Disable the button.
* Prevent duplicate submission.
* Show a spinner.
* Show clear action-specific text.
* Preserve the button size where practical to avoid layout shift.

Suggested pattern:

```tsx
<button disabled={isSubmitting}>
  {isSubmitting ? (
    <span className="flex items-center gap-2">
      <Spinner />
      Adding...
    </span>
  ) : (
    "Add Task"
  )}
</button>
```

---

# 3. Add Task

When a task is submitted:

```text
[ Add Task ]
```

should become:

```text
[ ⟳ Adding... ]
```

until the task creation request succeeds or fails.

Requirements:

* Submit button disabled while request is active.
* Form cannot be submitted twice.
* Existing form values remain visible while saving.
* On success, continue existing navigation / close behaviour.
* On failure, restore the button to its normal state and show the existing error UI.

---

# 4. Edit Task

When saving changes:

```text
[ Save Changes ]
```

should become:

```text
[ ⟳ Saving... ]
```

Requirements:

* Disable save button while request is active.
* Prevent duplicate update requests.
* Do not clear the form while saving.
* Restore the normal button state on error.

---

# 5. Complete Task

Completing a task should show an inline progress state.

Example:

```text
Before
○ Put bins out

During request
⟳ Put bins out

After success
✓ Put bins out
```

Avoid blocking the whole screen.

Requirements:

* Only the task being updated should show progress.
* Prevent repeated completion requests for the same task.
* Other tasks should remain usable where practical.
* Restore the task to its previous state if the request fails.

If the current implementation uses optimistic UI, preserve that behaviour and add a subtle pending indicator rather than introducing unnecessary delay.

---

# 6. Delete Task

When deleting a task, show progress on the destructive action.

Example:

```text
[ Delete Task ]

→

[ ⟳ Deleting... ]
```

Requirements:

* Disable the delete button during the request.
* Prevent multiple delete requests.
* Keep existing confirmation behaviour.
* On failure, restore the task and button state.

---

# 7. Login

When authentication is in progress:

```text
[ Sign in ]
```

should become:

```text
[ ⟳ Signing in... ]
```

Requirements:

* Disable repeated login attempts during the active request.
* Keep email/password input values visible.
* Restore controls on authentication failure.

---

# 8. Notification Settings

Where push notification functionality has been implemented, actions such as:

```text
Enable notifications
Disable notifications
```

should show progress.

Examples:

```text
[ ⟳ Enabling... ]
```

```text
[ ⟳ Disabling... ]
```

Do not allow repeated permission/subscription actions while one is already running.

---

# 9. Initial Page Loading

Use a simple page-level loading state only when there is no usable content available yet.

Example:

```text
┌─────────────────────────────┐
│                             │
│            ⟳                │
│      Loading tasks...       │
│                             │
└─────────────────────────────┘
```

Relevant screens may include:

* Today
* My Tasks
* Family
* Task details

Do not blank the page unnecessarily during background refreshes.

If existing data is already rendered, keep it visible and show a smaller loading state if required.

---

# 10. Loading Copy

Use action-specific text rather than generic `Loading...` wherever possible.

Preferred examples:

```text
Adding...
Saving...
Deleting...
Signing in...
Completing...
Enabling...
Disabling...
Loading tasks...
```

Avoid:

```text
Please wait...
Processing...
Working...
```

The loading text should clearly describe the action taking place.

---

# 11. Accessibility

All loading behaviour must remain accessible.

Requirements:

* Loading text should remain readable by screen readers.
* Spinner-only states should be avoided for important actions.
* Disabled buttons should remain visually understandable.
* Use `aria-busy="true"` where appropriate.
* Do not rely only on animation to communicate state.

Example:

```tsx
<button
  disabled={isSubmitting}
  aria-busy={isSubmitting}
>
```

---

# 12. Error Behaviour

Loading state must always end if a request fails.

Pattern:

```text
idle
  ↓
loading
  ↓
success
```

or:

```text
idle
  ↓
loading
  ↓
error
  ↓
idle
```

No action should remain permanently stuck in a loading state after an exception.

Use `try/finally` or equivalent patterns where appropriate.

Example:

```tsx
setIsSaving(true);

try {
  await saveTask();
} finally {
  setIsSaving(false);
}
```

---

# 13. Avoid Global Loading Where Possible

Do not introduce a single global overlay for ordinary actions such as:

* Adding a task
* Editing a task
* Completing a task
* Deleting a task

The loading indicator should generally appear on the control or content being updated.

Global blocking loaders should be reserved for genuine application-level transitions.

---

# 14. Avoid Artificial Delay

Do not intentionally delay a fast response just to make the spinner visible.

If the operation completes immediately, the loading state may appear only briefly or not be perceptible.

The goal is accurate feedback, not animation for its own sake.

---

# 15. Reusable Button Pattern

If the codebase already has a shared Button component, extend it to support loading rather than implementing custom spinner logic throughout the application.

Preferred API could be:

```tsx
<Button
  type="submit"
  loading={isSubmitting}
  loadingText="Adding..."
>
  Add Task
</Button>
```

The component should handle:

* Disabled state
* Spinner
* Loading text
* `aria-busy`
* Consistent spacing

Do not introduce a shared Button component solely for this issue if doing so would require substantial unrelated refactoring.

---

# Acceptance Criteria

## General

* [ ] A reusable spinner is available.
* [ ] Async buttons show action-specific loading text.
* [ ] Loading buttons are disabled during the active request.
* [ ] Duplicate submissions are prevented.
* [ ] Loading state is cleared on both success and failure.
* [ ] Existing page content remains visible where practical.
* [ ] No artificial delay is added.

## Add / Edit Task

* [ ] Add Task shows `Adding...`.
* [ ] Edit Task shows `Saving...`.
* [ ] Forms remain visible while requests are active.
* [ ] Buttons recover correctly after errors.

## Complete / Delete Task

* [ ] Completing a task shows inline progress.
* [ ] Only the affected task is blocked.
* [ ] Delete shows `Deleting...`.
* [ ] Repeated requests are prevented.

## Authentication

* [ ] Sign-in shows `Signing in...`.
* [ ] Login button is disabled during authentication.
* [ ] Failed login restores the normal state.

## Notifications

* [ ] Enable notification action shows `Enabling...`.
* [ ] Disable notification action shows `Disabling...`.
* [ ] Repeated subscription actions are prevented.

## Accessibility

* [ ] Important loading states include readable text.
* [ ] Spinner animation is not the sole status indicator.
* [ ] Async buttons use appropriate disabled / `aria-busy` states.

---

# Testing Requirements

Add tests where the existing test setup makes this practical.

At minimum verify:

```text
Add Task clicked
→ button disabled
→ loading text shown
→ request resolves
→ normal state restored
```

```text
Add Task clicked
→ request fails
→ loading state clears
→ user can retry
```

```text
Complete Task clicked twice rapidly
→ only one update request is sent
```

```text
Delete Task in progress
→ delete control cannot be triggered again
```

Manual testing should cover:

* Slow network
* Fast network
* Failed request
* Mobile screen size
* Repeated tapping
* Screen reader-friendly status text

---

# Out of Scope

Do not add the following as part of this enhancement:

* Skeleton loading screens across the whole application
* Animated page transitions
* Progress percentages
* Global loading overlays
* Toast redesign
* New error handling framework
* New state-management library
* React Query / SWR migration purely for loading states
* Artificial request delays
* Complex optimistic-update architecture

These can be considered separately if later required.

---

# Implementation Guidance for Claude Code

Before making changes:

1. Review how async actions are currently implemented.
2. Identify whether a shared Button or Spinner component already exists.
3. Reuse existing patterns where possible.
4. Avoid large component refactors.
5. Keep loading state local to the affected action.
6. Preserve existing success/error behaviour.
7. Do not introduce a new dependency just for the spinner.

Implement the improvement incrementally across the highest-value actions first:

```text
1. Add Task
2. Edit Task
3. Complete Task
4. Delete Task
5. Login
6. Notification settings
7. Initial screen loads where required
```

---

# Definition of Done

This enhancement is complete when:

> A user can clearly tell when an action is being processed, cannot accidentally trigger the same request twice, and can continue using unaffected parts of the application while the request is in progress.

The experience should feel more responsive without making the interface visually busier.
