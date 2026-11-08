'use client';

import React from "react";
import { PixelHero } from "@/components/ui/pixel-perfect-hero";

export default function Demo() {
  return (
    <div className="w-full min-h-screen bg-[#030407]">
      <PixelHero
        word1="Class"
        word2="Trace."
        voiceLine="Ask in your college language. Hear the teacher's exact words."
        badgeText="12+ Indic Dialects • Verbatim Audio Grounding"
        description="Voice-first lecture intelligence engine. Ask doubts in Hinglish, Tamil, Telugu, or regional dialects, and jump directly to the professor's original explanation."
        primaryCta="Enter Classroom Workspace"
        primaryCtaMobile="Workspace"
        secondaryCta="Record Live Classroom"
        secondaryCtaMobile="Record"
        primaryHref="/dashboard"
        secondaryHref="/dashboard?action=record"
        onPrimaryClick={() => console.log("Primary click action triggered.")}
        onSecondaryClick={() => console.log("Secondary click action triggered.")}
      />
    </div>
  );
}

