import type { Metadata } from "next";
import InternalHome from "./InternalHome";

export const metadata: Metadata = {
  title: "Analysebordet — safe@home",
  description:
    "Det som er nytt siden sist, innganger til visningene, og status for materialet.",
};

export default function InternalIndexPage() {
  return <InternalHome />;
}
