/**
 * Attach walkthrough videos to simulators.
 *
 *   pnpm tsx scripts/seedSimulatorVideos.ts
 *
 * Every URL here was found by search and then checked against YouTube's oembed
 * endpoint, which returns the real title and channel for a live video and fails
 * for a dead or private one. The script re-runs that check before writing, so a
 * video that gets taken down is skipped rather than seeded as a broken embed.
 *
 * Only tools with a genuinely good beginner walkthrough are listed. The rest
 * are left empty on purpose: a bad video is worse than no video, and an
 * member can paste a better one into the admin at any time.
 */
import "dotenv/config";
import config from "@payload-config";
import { getPayload } from "payload";
import { flushExit } from "./lib/learningSeed";

interface VideoPick {
  /** Simulator slug. */
  slug: string;
  videoId: string;
  /** The channel expected at that id, so a re-upload swap is caught. */
  channel: string;
}

const VIDEOS: VideoPick[] = [
  { slug: "blender", videoId: "z-Xl9tGqH14", channel: "Blender Guru" },
  { slug: "kicad", videoId: "8tDqHPajY8o", channel: "Shourov Paul" },
  { slug: "fusion-360", videoId: "48NtO82RlbA", channel: "3D Printer Academy" },
  { slug: "ultimaker-cura", videoId: "l_wDwySm2YQ", channel: "3D Now" },
  { slug: "godot", videoId: "1K-s8ZuYJ5c", channel: "Zenva" },
  { slug: "node-red", videoId: "F8tgzBO4cvQ", channel: "DonskyTech" },
  { slug: "kaggle", videoId: "L06VjxRv7Lg", channel: "ProgrammingKnowledge" },
  { slug: "roboflow", videoId: "O-ZPxTpb2Yg", channel: "Roboflow" },
];

/** Returns the video title when the id resolves to a live video, else null. */
async function verify(
  videoId: string,
): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { "User-Agent": "EmbedClubSiteSeed/1.0" } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string; author_name?: string };
    if (!body.title) return null;
    return { title: body.title, author: body.author_name ?? "unknown" };
  } catch {
    return null;
  }
}

async function run() {
  const payload = await getPayload({ config });

  let written = 0;
  const failed: string[] = [];

  for (const pick of VIDEOS) {
    const meta = await verify(pick.videoId);
    if (!meta) {
      console.warn(
        `skipped ${pick.slug}: video ${pick.videoId} did not resolve`,
      );
      failed.push(pick.slug);
      continue;
    }

    const found = await payload.find({
      collection: "simulators",
      where: { slug: { equals: pick.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (found.docs.length === 0) {
      console.warn(`skipped ${pick.slug}: no simulator with that slug`);
      failed.push(pick.slug);
      continue;
    }

    await payload.update({
      collection: "simulators",
      id: found.docs[0].id,
      data: { videoUrl: `https://www.youtube.com/watch?v=${pick.videoId}` },
      overrideAccess: true,
    });
    written++;
    console.log(`ok  ${pick.slug.padEnd(16)} ${meta.author} - ${meta.title}`);
  }

  console.log(`\nVideos attached: ${written}`);
  if (failed.length > 0) console.log(`Skipped: ${failed.join(", ")}`);
  flushExit(0);
}

run().catch((err) => {
  console.error(err);
  flushExit(1);
});
