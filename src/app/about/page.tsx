import type { Metadata } from "next";
import Nav from "@/components/Nav";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
export const metadata: Metadata = {
  title: "About — safe@home",
  description: "About the safe@home research project."
};
export default function AboutPage() {
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:760px] [margin:0_auto] [padding:80px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:16px]">
          About
        </p>
        <h1 className="[font-size:44px] [font-weight:700] [line-height:1.1] [color:#2a2859] [margin-bottom:24px] [letter-spacing:-0.02em]">
          About the project
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#2c2c2c] [margin-bottom:24px]">
          SAFE@HOME is a collaborative research project (2026–2029) investigating
          how homecare services can adapt to Norway&rsquo;s growing aging
          immigrant population. It combines ethnographic fieldwork, policy
          analysis, and co-design with residents, care workers, and municipalities.
        </p>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [margin-bottom:24px]">
          This site is a living research platform — stories, connections, and
          design responses are added as the work unfolds. More documentation
          will appear here soon.
        </p>
      </main>
    </>;
}
