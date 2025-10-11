"use client";

import React from "react";
import Link from "next/link";
import { useOnboardingStore } from "../store";

export default function ClientStep() {
  const setClientComplete = useOnboardingStore((s) => s.setClientComplete);
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding: Client Info</h1>
      <p>Collect client details here.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={() => setClientComplete(true, { name: "Example Co" })}
        >
          Mark Complete
        </button>
        <Link href="/onboarding/templates">Next: Templates →</Link>
      </div>
    </main>
  );
}