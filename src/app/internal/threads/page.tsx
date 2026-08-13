import type { Metadata } from "next";
import { Suspense } from "react";
import ThreadsClient from "./ThreadsClient";
import { FONT_STACK } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Tråder — safe@home",
  description: "Argumenter under arbeid: teser med tilknyttede notater.",
};

export default function ThreadsPage() {
  // Nav comes from src/app/internal/layout.tsx.
  return (
    <main
      id="main-content"
      style={{ fontFamily: FONT_STACK }}
      className="[max-width:1000px] [margin:0_auto] [padding:40px_24px_96px]"
    >
      <header className="[margin-bottom:24px]">
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          Tråder
        </h1>
        <p className="[font-size:15px] [color:#666666] [margin:0] [line-height:1.6] [max-width:720px]">
          Et argument under arbeid: en tese, notatene som bærer den, og hvorfor
          hvert av dem hører hjemme der. Alt her er arbeid under utvikling.
        </p>
      </header>

      {/* ThreadsClient reads ?thread=<id>; useSearchParams needs a boundary. */}
      <Suspense fallback={null}>
        <ThreadsClient />
      </Suspense>
    </main>
  );
}
