"use client";

import Link from "next/link";
import { useOnboardingStore } from "../store";

export default function PlanStep() {
  const setPlanReady = useOnboardingStore((s) => s.setPlanReady);
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding: Plan & Deploy</h1>
      <p>Generate and review deployment plan, then execute.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => setPlanReady(true, { plan: {} })}>
          Mark Plan Ready
        </button>
        <Link href="/onboarding/client">Back to Start</Link>
      </div>
    </main>
  );
}