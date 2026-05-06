import type { Metadata } from "next";
import NodeMapClient from "./NodeMapClient";

export const metadata: Metadata = {
  title: "Node map · SAFE@HOME",
  description: "Force-directed graph of all quick notes and insights, connected by shared categories.",
};

export default function NodeMapPage() {
  return <NodeMapClient />;
}
