"use client";
import { useState } from "react";
import { Button } from "./ui/button";
export function InquiryStatus({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/admin/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: form.get("status") }),
          });
          const data = await r.json();
          setMessage(r.ok ? "Status updated." : data.error);
        } catch {
          setMessage("Update failed. Please try again.");
        }
      }}
    >
      <div className="inline-form">
        <label>
          Inquiry status
          <select name="status" defaultValue={status}>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <Button variant="outline">Update status</Button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
