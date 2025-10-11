"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "../store";
import { TEMPLATES, TemplateInfo } from "./templates.data";

export default function TemplatesStep() {
  const setTemplateSelected = useOnboardingStore((s) => s.setTemplateSelected);
  const router = useRouter();

  function chooseTemplate(t: TemplateInfo) {
    setTemplateSelected(true, { templateId: t.id, templateName: t.name });
    router.push("/onboarding/customize");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding: Templates</h1>
      <p>Choose a template to get started. You can customize it on the next step.</p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 16, display: "grid", gap: 12 }}>
        {TEMPLATES.map((t) => (
          <li key={t.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ color: "#555" }}>{t.description}</div>
              </div>
              <button onClick={() => chooseTemplate(t)} aria-label={`select-${t.id}`}>Select</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
