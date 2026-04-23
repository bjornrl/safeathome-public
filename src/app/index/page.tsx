import type { Metadata } from "next";
import { getAllStories } from "@/lib/queries";
import IndexClient from "./IndexClient";

export const metadata: Metadata = {
  title: "Index — safe@home",
  description: "Alfabetisk oversikt over alle publiserte innsikter.",
};

export default async function IndexPage() {
  const stories = await getAllStories();
  return <IndexClient stories={stories} />;
}
