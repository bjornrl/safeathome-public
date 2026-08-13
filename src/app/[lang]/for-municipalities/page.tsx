import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import ResourceList from "@/components/ResourceList";
import { getResources } from "@/lib/queries";
import { MUNICIPAL_TYPES } from "@/lib/constants";
import { FONT_STACK } from "@/lib/design-tokens";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/for-municipalities">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.municipalities.metaTitle, description: t.municipalities.metaDescription };
}

export const revalidate = 60;

export default async function ForMunicipalitiesPage({
  params,
}: PageProps<"/[lang]/for-municipalities">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const resources = await getResources(MUNICIPAL_TYPES);

  return (
    <>
      <Nav />
      <main
        id="main-content"
        style={{ fontFamily: FONT_STACK }}
        className="[max-width:1120px] [margin:0_auto] [padding:72px_24px_96px]"
      >
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          {t.municipalities.eyebrow}
        </p>
        <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          {t.municipalities.heading}
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:56px]">
          {t.municipalities.lead}
        </p>

        <ResourceList
          resources={resources}
          emptyMessage={t.municipalities.empty}
          groupByType
        />
      </main>
    </>
  );
}
