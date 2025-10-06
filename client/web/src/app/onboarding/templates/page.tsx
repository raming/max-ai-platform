"use client";

import Link from "next/link";
import { useOnboardingStore } from "../store";

export default function TemplatesStep() {
  const setTemplateSelected = useOnboardingStore((s) => s.setTemplateSelected);
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding: Templates</h1>
      <p>Select a template from the registry.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={() => setTemplateSelected(true, { template: "starter" })}
        >
          Select Template
        </button>
        <Link href="/onboarding/customize">Next: Customize →</Link>
      </div>
    </main>
  );
}