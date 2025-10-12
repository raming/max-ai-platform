"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useOnboardingStore } from "../store";

export default function CustomizeStep() {
  const setCustomizeComplete = useOnboardingStore((s) => s.setCustomizeComplete);
  const [businessName, setBusinessName] = useState("");
  const [greeting, setGreeting] = useState("");
  const router = useRouter();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const vars = { businessName, greeting };
    setCustomizeComplete(true, { vars });
    router.push("/onboarding/plan");
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Onboarding: Customize</h1>
      <p>Customize variables and optional LLM parameters.</p>
      <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Business name</span>
          <input
            aria-label="business-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Greeting</span>
          <input
            aria-label="greeting"
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            required
          />
        </label>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit">Save and Continue</button>
        </div>
      </form>
    </main>
  );
}
