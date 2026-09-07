"use client";

import { useEffect, useState, useTransition } from "react";
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
    startTransition(async () => {
      await unsubscribeFromPush(id);
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
            <Button type="button" onClick={handleEnable} disabled={enabling}>
              {enabling ? "Enabling…" : "Enable notifications"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span className="text-sm text-slate-900">Task assigned to me</span>
            <input
              type="checkbox"
              defaultChecked={preferences.taskAssignedEnabled}
              onChange={(event) => handleToggle("taskAssignedEnabled", event.target.checked)}
              className="h-5 w-5"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span className="text-sm text-slate-900">Tasks due today</span>
            <input
              type="checkbox"
              defaultChecked={preferences.dueTodayEnabled}
              onChange={(event) => handleToggle("dueTodayEnabled", event.target.checked)}
              className="h-5 w-5"
            />
          </div>

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
                    className="shrink-0 text-sm font-medium text-red-600 underline"
                  >
                    Remove
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
