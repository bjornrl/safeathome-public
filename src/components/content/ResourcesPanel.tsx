"use client";

import { useEffect, useState } from "react";
import ReadingRoomClient from "@/app/reading-room/ReadingRoomClient";
import { getAllResourceLinks, getAllStories, getResources, type ResourceLinksByResource } from "@/lib/queries";
import type { PublicResource, PublicStory } from "@/lib/types";
import { colors, typography } from "@/lib/design-tokens";

/**
 * The old Lesesal, as a tab.
 *
 * Two differences from the page it replaces. It fetches client-side, because
 * the tab shell owns the tab state and must be a client component. And it asks
 * for *every* resource type rather than only the three the Lesesal showed —
 * publications and policy briefs keep their own labels, but they now live under
 * the shared resource category alongside toolkits, practice guides and
 * municipal experiences.
 */
export default function ResourcesPanel() {
  const [resources, setResources] = useState<PublicResource[] | null>(null);
  const [links, setLinks] = useState<ResourceLinksByResource>({});
  const [storiesById, setStoriesById] = useState<Record<string, PublicStory>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const [res, lnk, stories] = await Promise.all([
        getResources(),
        getAllResourceLinks(),
        getAllStories(),
      ]);
      if (!active) return;
      const byId: Record<string, PublicStory> = {};
      for (const s of stories) byId[s.id] = s;
      setResources(res);
      setLinks(lnk);
      setStoriesById(byId);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (resources === null) {
    return (
      <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Laster…</p>
    );
  }

  return (
    <ReadingRoomClient
      resources={resources}
      links={links}
      storiesById={storiesById}
    />
  );
}
