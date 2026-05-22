import type { Metadata } from "next";
import NodeMapClient from "./NodeMapClient";

export const metadata: Metadata = {
  title: "Nodekart · SAFE@HOME",
  description: "Kraftstyrt graf over alle hurtignotater og innsikter, koblet sammen av delte kategorier.",
};

export default function NodeMapPage() {
  return <NodeMapClient />;
}
