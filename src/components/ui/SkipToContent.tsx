export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="pkt-skip-to-content">
      Hopp til hovedinnhold
    </a>
  );
}
