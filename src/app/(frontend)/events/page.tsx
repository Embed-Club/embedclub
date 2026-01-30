import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import { EventsCards, CarouselWithModal } from "@/components/EventsCards";
import type { Event } from "@/payload-types";

const payloadURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Server-side fetch of events from Payload REST.
 * depth=1 expands the linked media so you get image.url directly.
 * sort=-createdAt shows the newest first.
 * next.revalidate controls ISR; bump or use { cache: "no-store" } if you need true SSR.
 */
async function getEvents() {
  const res = await fetch(
    `${payloadURL}/api/events?depth=1&sort=-createdAt&limit=5`,
    { next: { revalidate: 60 } }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch events:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      url: `${payloadURL}/api/events?depth=1&sort=-createdAt`
    });
    throw new Error(`Failed to load events: ${res.status} ${res.statusText}`);
  }
  
  const data = (await res.json()) as { docs: Event[] };
  return data.docs;
}

/**
 * Fetch all events for the gallery (with pagination support).
 */
async function getAllEvents() {
  const res = await fetch(
    `${payloadURL}/api/events?depth=1&sort=-createdAt&limit=100`,
    { next: { revalidate: 60 } }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch all events:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      url: `${payloadURL}/api/events?depth=1&sort=-createdAt`
    });
    throw new Error(`Failed to load events: ${res.status} ${res.statusText}`);
  }
  
  const data = (await res.json()) as { docs: Event[] };
  return data.docs;
}


export default async function Page() {
  const events = await getEvents();
  const allEvents = await getAllEvents();

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-20 top-20 text-xl font-medium md:text-4xl">
          RECENT EENTS
        </h1>
        <div className="pt-24 md:pt-32">
          <CarouselWithModal events={events} />
        </div>

        {/* Gallery Section */}

        <div className="w-full px-6 md:px-12 lg:px-16 pb-20 pt-20">
          <h1 className="mb-8 text-left text-xl font-medium md:text-4xl">
            ALL EENTS
          </h1>

          <div>
            <EventsCards events={allEvents} />
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  );
}
