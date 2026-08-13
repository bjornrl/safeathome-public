import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { getWelfareTechnologies } from "@/lib/queries";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import WelfareTechClient from "./WelfareTechClient";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/welfare-tech">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.welfareTech.metaTitle, description: t.welfareTech.metaDescription };
}

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
