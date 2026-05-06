import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { getWelfareTechnologies } from "@/lib/queries";
import WelfareTechClient from "./WelfareTechClient";

export const metadata: Metadata = {
  title: "Velferdsteknologi · SAFE@HOME",
  description:
    "En kuratert oversikt over velferdsteknologi som er relevant for hjemmebasert omsorg for eldre med innvandrerbakgrunn — som inspirasjon og referanse.",
};

export const revalidate = 60;

export default async function WelfareTechPage() {
  const items = await getWelfareTechnologies();
  return (
    <>
      <Nav />
      <WelfareTechClient items={items} />
    </>
  );
}
