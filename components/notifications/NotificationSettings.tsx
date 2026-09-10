"use client";

import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import {
  subscribeToPush,
  unsubscribeFromPush,
  updateNotificationPreference,
} from "@/lib/notifications/actions";
import { Button } from "@/components/ui/Button";
import type { NotificationPreferences, PushSubscriptionSummary } from "@/lib/notifications/queries";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// A custom switch rather than a native <input type="checkbox"> -- iOS
// Safari's native checkbox can render at its own much larger intrinsic
// size regardless of explicit width/height, which was pushing these rows
// past the edge of the screen. Matches the "style everything ourselves"
// approach already used for the assignee chips in TaskForm.tsx.
function ToggleSwitch({
  label,
  defaultChecked,
  onChange,
}: {
  label: string;
  defaultChecked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <span className="min-w-0 flex-1 text-sm text-slate-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => {
          const next = !checked;
          setChecked(next);
          onChange(next);
        }}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-slate-900" : "bg-slate-300",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({
  preferences,
  subscriptions,
}: {
  preferences: NotificationPreferences;
  subscriptions: PushSubscriptionSummary[];
}) {
  const [supported] = useState(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
  );
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supported ? Notification.permission : "default",
  );
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      setRegistrationFailed(true);
    });
  }, [supported]);

  async function handleEnable() {
    setError(null);
    setEnabling(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Missing VAPID public key");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const { error: subscribeError } = await subscribeToPush(
        subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } },
        navigator.userAgent,
      );
      if (subscribeError) setError(subscribeError);
    } catch {
      setError("Couldn't enable notifications. Please try again.");
    } finally {
      setEnabling(false);
    }
  }

  function handleRemoveDevice(id: string) {
    if (removingId) return;
    setRemovingId(id);
    startTransition(async () => {
      await unsubscribeFromPush(id);
      setRemovingId(null);
    });
  }

  function handleToggle(key: "taskAssignedEnabled" | "dueTodayEnabled", value: boolean) {
    startTransition(async () => {
      await updateNotificationPreference(key, value);
    });
  }

  if (!supported || registrationFailed) {
    return (
      <p className="text-sm text-slate-500">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {permission !== "granted" ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-900">Get task reminders</p>
          <p className="mt-1 text-sm text-slate-600">
            Allow Family Tasks to notify you when someone assigns you a task or when you have
            tasks due today.
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3">
            <Button type="button" onClick={handleEnable} loading={enabling} loadingText="Enabling…">
              Enable notifications
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ToggleSwitch
            label="Task assigned to me"
            defaultChecked={preferences.taskAssignedEnabled}
            onChange={(checked) => handleToggle("taskAssignedEnabled", checked)}
          />
          <ToggleSwitch
            label="Tasks due today"
            defaultChecked={preferences.dueTodayEnabled}
            onChange={(checked) => handleToggle("dueTodayEnabled", checked)}
          />

          {subscriptions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Devices
              </h3>
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                    {subscription.userAgent ?? "Unknown device"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(subscription.id)}
                    disabled={removingId !== null}
                    aria-busy={removingId === subscription.id}
                    className="shrink-0 text-sm font-medium text-red-600 underline disabled:opacity-50"
                  >
                    {removingId === subscription.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
