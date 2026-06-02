import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Søk · SAFE@HOME",
  description: "Semantisk søk på tvers av innsikter, notater, historier og ressurser.",
};

export default function InternalSearchPage() {
  return <SearchClient />;
}
