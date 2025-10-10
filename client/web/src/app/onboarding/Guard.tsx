"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFirstIncompleteStep, stepOrder, useOnboardingStore } from "./store";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = useOnboardingStore();

  useEffect(() => {
    // Only guard routes under /onboarding
    if (!pathname?.startsWith("/onboarding")) return;

    const firstIncomplete = getFirstIncompleteStep(state);
    // Determine current step by pathname segment
    const current = pathname.split("/")[2] ?? "client";

    // If user is navigating beyond first incomplete step, redirect to the first incomplete
    const currentIndex = stepOrder.indexOf(current as any);
    const requiredIndex = stepOrder.indexOf(firstIncomplete);

    if (currentIndex === -1) {
      router.replace(`/onboarding/${firstIncomplete}`);
      return;
    }

    if (currentIndex > requiredIndex) {
      router.replace(`/onboarding/${firstIncomplete}`);
    }
  }, [pathname, router, state]);

  return <>{children}</>;
}