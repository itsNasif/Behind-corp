"use client";
import { useState } from "react";
import { Button } from "./ui/button";
export function Preferences({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "preferences",
              reducedMotion: value,
            }),
          });
          const data = await r.json();
          setMessage(r.ok ? "Preference saved." : data.error);
        } catch {
          setMessage("Unable to save. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="check-label">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => setValue(e.target.checked)}
        />
        Prefer reduced motion in your account
      </label>
      <Button variant="outline" disabled={busy} className="mt-5">
        Save preference
      </Button>
      <p role="status" className="status-message">
        {message}
      </p>
    </form>
  );
}
export function PrivacyActions({ identityUrl }: { identityUrl: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  async function act(action: "export" | "delete") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "delete" ? { action, confirmation } : { action },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (action === "export") {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "behind-account.json";
        link.click();
        URL.revokeObjectURL(url);
        setMessage("Your export has been downloaded.");
      } else {
        setDeleted(true);
        setMessage(
          "Your company-site data was deleted. Complete identity deletion below to close your behind identity.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete the request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="privacy-actions">
      <div>
        <a className="text-link" href="/auth/reauth">
          Verify your identity again →
        </a>
        <p className="small-note">
          Exports and deletion require a sign-in within the last five minutes.
        </p>
      </div>
      <div>
        <Button variant="outline" disabled={busy} onClick={() => act("export")}>
          Download my account data
        </Button>
      </div>
      <div className="danger-action">
        <h3>Delete your account</h3>
        <p>
          First delete your profile, preferences, and inquiries sent while
          signed in to this website. Then close your identity in the identity
          account center. Anonymous inquiries cannot be automatically matched to
          you; contact us for help. Other applications may retain their own
          records.
        </p>
        {!deleted ? (
          <>
            <label>
              Type DELETE to remove this website’s data
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
              />
            </label>
            <Button
              variant="outline"
              disabled={busy || confirmation !== "DELETE"}
              onClick={() => act("delete")}
            >
              Delete website data
            </Button>
          </>
        ) : (
          <a className="text-link" href={identityUrl}>
            Continue to identity deletion →
          </a>
        )}
        <p className="small-note">
          If you cancel the second step, your identity remains active. The
          identity account center asks you to reauthenticate before deleting it.
        </p>
      </div>
      <p role="status" className="status-message">
        {message}
      </p>
    </div>
  );
}
