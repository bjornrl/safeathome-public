import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ResourceList from "@/components/ResourceList";
import { getResources } from "@/lib/queries";
import { READING_ROOM_TYPES } from "@/lib/seed-resources";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
export const metadata: Metadata = {
  title: "Reading Room — safe@home",
  description: "Publications, policy briefs, and teaching materials from the safe@home project and allied researchers."
};
export const revalidate = 60;
export default async function ReadingRoomPage() {
  const resources = await getResources(READING_ROOM_TYPES);
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:1120px] [margin:0_auto] [padding:72px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          Reading room
        </p>
        <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          Publications &amp; teaching materials.
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:56px]">
          Papers, policy briefs, and teaching guides &mdash; authored by the
          safe@home group or by researchers whose work helps us see more
          clearly. The collection grows as the project produces new writing and
          as we add the work that shaped ours.
        </p>

        <ResourceList resources={resources} emptyMessage="No publications yet. Check back once the first working papers are out." groupByType />
      </main>
    </>;
}
