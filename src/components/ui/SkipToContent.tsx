"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useI18n();
  return (
    <a href={`#${targetId}`} className="pkt-skip-to-content">
      {t.common.skipToContent}
    </a>
  );
}
