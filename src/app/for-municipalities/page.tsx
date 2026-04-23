import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ResourceList from "@/components/ResourceList";
import { getResources } from "@/lib/queries";
import { MUNICIPAL_TYPES } from "@/lib/seed-resources";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
export const metadata: Metadata = {
  title: "For Municipalities — safe@home",
  description: "Toolkits, practice guides, and municipal experiences from the safe@home project."
};
export const revalidate = 60;
export default async function ForMunicipalitiesPage() {
  const resources = await getResources(MUNICIPAL_TYPES);
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:1120px] [margin:0_auto] [padding:72px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          For municipalities
        </p>
        <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          Tools &amp; experiences from the field.
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:56px]">
          Editable toolkits, practice guides, and plain-language accounts of
          what partner municipalities are trying &mdash; what is working, what
          broke, and where the compromises live. Intended for homecare
          coordinators, planners, and service designers.
        </p>

        <ResourceList resources={resources} emptyMessage="No tools or experiences published yet." groupByType />
      </main>
    </>;
}
