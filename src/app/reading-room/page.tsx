import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { getAllResourceLinks, getAllStories, getResources } from "@/lib/queries";
import { READING_ROOM_TYPES } from "@/lib/seed-resources";
import ReadingRoomClient from "./ReadingRoomClient";
import type { PublicStory } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "Lesesal — safe@home",
  description:
    "Publikasjoner, policy-notater og undervisningsmateriell fra safe@home-prosjektet og samarbeidende forskere.",
};
export const revalidate = 60;

export default async function ReadingRoomPage() {
  const [resources, links, stories] = await Promise.all([
    getResources(READING_ROOM_TYPES),
    getAllResourceLinks(),
    getAllStories(),
  ]);
  const storiesById: Record<string, PublicStory> = {};
  for (const s of stories) storiesById[s.id] = s;

  return (
    <>
      <Nav />
      <main
        style={{ fontFamily: FONT_STACK }}
        className="[max-width:1120px] [margin:0_auto] [padding:72px_24px_96px]"
      >
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          Lesesal
        </p>
        <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          Publikasjoner og undervisningsmateriell.
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:40px]">
          Artikler, policy-notater og undervisningsmateriell — skrevet av
          safe@home-gruppen eller av forskere hvis arbeid hjelper oss å se
          tydeligere. Samlingen vokser i takt med at prosjektet produserer
          ny tekst og at vi legger til arbeidene som har formet våre.
        </p>

        <ReadingRoomClient resources={resources} links={links} storiesById={storiesById} />
      </main>
    </>
  );
}
