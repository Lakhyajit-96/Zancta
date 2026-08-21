"use client";

import { useMemo, useState } from "react";
import { CONTACT_TOPICS, mailboxForTopic, type ContactTopicId } from "@/lib/contact/topics";

export function ContactForm() {
  const [topicId, setTopicId] = useState<ContactTopicId>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [formKey, setFormKey] = useState(0);

  const topic = useMemo(
    () => CONTACT_TOPICS.find((item) => item.id === topicId) ?? CONTACT_TOPICS[0],
    [topicId]
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          accountEmail: String(data.get("accountEmail") || ""),
          topic: String(data.get("topic") || topicId),
          subject: String(data.get("subject") || ""),
          message: String(data.get("message") || ""),
          website: String(data.get("website") || ""),
        }),
      });
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; error?: string } | null;
      if (!res.ok || !payload?.ok || !payload.reference) {
        setError(payload?.error || "Unable to send this enquiry.");
        return;
      }
      setReference(payload.reference);
    } catch {
      setError("Unable to send this enquiry.");
    } finally {
      setLoading(false);
    }
  };

  if (reference) {
    return (
      <div className="card-surface p-6 md:p-8" role="status">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Received</p>
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">We received your enquiry.</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Reference <span className="font-mono text-foreground">{reference}</span>. ZANCTA will review the message and
          respond through the matching contact channel. A response-time SLA is not published.
        </p>
        <button
          type="button"
          className="premium-button mt-6 min-h-11 px-4 text-xs"
          onClick={() => {
            setReference("");
            setError("");
            setTopicId("general");
            setFormKey((value) => value + 1);
          }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form key={formKey} onSubmit={onSubmit} className="relative card-surface p-6 md:p-8">
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Company website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium">
            Name
          </label>
          <input id="contact-name" name="name" required maxLength={100} autoComplete="off" className="field-input mt-1 h-11" />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="field-input mt-1 h-11"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contact-account-email" className="text-sm font-medium">
            Account email <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-account-email"
            name="accountEmail"
            type="email"
            maxLength={254}
            autoComplete="off"
            className="field-input mt-1 h-11"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contact-topic" className="text-sm font-medium">
            Topic
          </label>
          <select
            id="contact-topic"
            name="topic"
            required
            defaultValue="general"
            onChange={(event) => setTopicId(event.target.value as ContactTopicId)}
            className="field-input mt-1 h-11"
          >
            {CONTACT_TOPICS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {topic.belongs} Routed to {mailboxForTopic(topic.id)}. {topic.notFor}
          </p>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contact-subject" className="text-sm font-medium">
            Subject
          </label>
          <input id="contact-subject" name="subject" required maxLength={160} className="field-input mt-1 h-11" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contact-message" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={7}
            className="field-input mt-1 min-h-[10rem] resize-y"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="premium-button premium-button-primary mt-6 min-h-11 px-5 text-xs">
        {loading ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
