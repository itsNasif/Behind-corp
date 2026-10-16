"use client";
import Script from "next/script";
import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "./ui/button";
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
export function ContactForm({
  nonce,
  siteKey,
}: {
  nonce?: string;
  siteKey?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const token = useRef("");
  const requestId = useRef("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!ready || !container.current || !siteKey || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action: "contact",
      theme: "light",
      callback: (value: string) => {
        token.current = value;
      },
      "expired-callback": () => {
        token.current = "";
      },
      "error-callback": () => {
        token.current = "";
        setMessage("Verification could not load. Please try again.");
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, [ready, siteKey]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!token.current) {
      setMessage("Please complete the verification before sending.");
      return;
    }
    setBusy(true);
    const form = new FormData(event.currentTarget);
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId.current,
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
          token: token.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess(true);
      setMessage("Your inquiry has been received. Thank you for reaching out.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send. Please try again.",
      );
    } finally {
      setBusy(false);
      token.current = "";
      if (widget.current) window.turnstile?.reset(widget.current);
    }
  }
  return (
    <div>
      {siteKey && (
        <Script
          nonce={nonce}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={() => setReady(true)}
        />
      )}{" "}
      {success ? (
        <div className="success-panel" role="status">
          <Check size={36} />
          <h2>Message received.</h2>
          <p>{message}</p>
          <a className="text-link" href="/">
            Back to behind →
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="contact-form">
          <div className="field-pair">
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Full name"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
          </div>
          <label>
            What’s this about?
            <select name="topic" defaultValue="General inquiry">
              <option>General inquiry</option>
              <option>Software & AI</option>
              <option>Collaboration</option>
              <option>Privacy</option>
            </select>
          </label>
          <label>
            Your message
            <textarea
              name="message"
              rows={6}
              minLength={20}
              maxLength={5000}
              required
              placeholder="Tell us a little about what you have in mind…"
              aria-describedby="message-help"
            />
          </label>
          <p id="message-help" className="small-note">
            20–5,000 characters. We use these details to handle your inquiry.
          </p>
          <div ref={container} />
          {!siteKey && (
            <p role="status" className="form-message">
              The contact form is temporarily unavailable. You can email us
              directly.
            </p>
          )}
          <p aria-live="polite" className="form-message">
            {message}
          </p>
          <div className="form-bottom">
            <Button disabled={busy || !siteKey} type="submit">
              {busy ? "Sending…" : "Send message"}
              <ArrowUpRight size={18} />
            </Button>
            <span>
              Read our <a href="/privacy">privacy notice</a>.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
