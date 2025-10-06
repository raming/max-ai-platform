"use client";

import Link from "next/link";
import { useOnboardingStore } from "../store";

export default function CustomizeStep() {
  const setCustomizeComplete = useOnboardingStore((s) => s.setCustomizeComplete);
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding: Customize</h1>
      <p>Customize variables and optional LLM parameters.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => setCustomizeComplete(true, { vars: {} })}>
          Mark Customized
        </button>
        <Link href="/onboarding/plan">Next: Plan/Deploy →</Link>
      </div>
    </main>
  );
}