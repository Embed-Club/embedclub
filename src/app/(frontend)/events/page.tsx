import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import { Carousel, Card } from "@/components/EventsCarousel";
import { EventsCards } from "@/components/EventsCards";
import RichTextRender from "@/components/RichTextRender";
import type { Event } from "@/payload-types";
import Image from "next/image";

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

  const items = events.map((event, index) => (
    <Card
      key={event.id}
      index={index}
      layout
      card={{
        src:
          event.image && typeof event.image === "object"
            ? event.image.url || "/placeholder.jpg"
            : "/placeholder.jpg",
        title: event.title,
        category: event.category,
        content: (
          <div className="space-y-6 text-neutral-800 dark:text-neutral-100">
            {/* Event Poster/Image */}
            {event.image && typeof event.image === "object" && event.image.url && (
              <div className="relative h-64 w-full overflow-hidden rounded-lg">
                <Image
                  src={event.image.url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Full Event Description */}
            {event.description && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">About this Event</h3>
                <RichTextRender content={event.description} />
              </div>
            )}

            {/* Event Details Box */}
            {(event.venue?.roomName ||
              event.venue?.floor ||
              event.contact?.email ||
              event.contact?.phone) && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <h3 className="mb-3 text-lg font-semibold">Event Details</h3>
                <div className="space-y-2 text-sm">
                  {event.venue?.roomName && (
                    <div className="flex gap-2">
                      <span className="font-medium">Room/Hall:</span>
                      <span>{event.venue.roomName}</span>
                    </div>
                  )}
                  {event.venue?.floor && (
                    <div className="flex gap-2">
                      <span className="font-medium">Floor:</span>
                      <span>{event.venue.floor}</span>
                    </div>
                  )}
                  {event.contact?.phone && (
                    <div className="flex gap-2">
                      <span className="font-medium">Phone:</span>
                      <a
                        href={`tel:${event.contact.phone}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {event.contact.phone}
                      </a>
                    </div>
                  )}
                  {event.contact?.email && (
                    <div className="flex gap-2">
                      <span className="font-medium">Email:</span>
                      <a
                        href={`mailto:${event.contact.email}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {event.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Section */}
            {event.location?.coords?.lat && event.location?.coords?.lng && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">Location</h3>
                {event.location.address && (
                  <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {event.location.address}
                  </p>
                )}
                <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <iframe
                    width="100%"
                    height="300"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.location.coords.lng - 0.01},${event.location.coords.lat - 0.01},${event.location.coords.lng + 0.01},${event.location.coords.lat + 0.01}&layer=mapnik&marker=${event.location.coords.lat},${event.location.coords.lng}`}
                    allowFullScreen
                  ></iframe>
                  <div className="bg-neutral-100 p-2 text-center dark:bg-neutral-800">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${event.location.coords.lat}&mlon=${event.location.coords.lng}&zoom=${event.location.zoom || 15}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View Larger Map
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      }}
    />
  ));

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-20 top-20 text-xl font-light md:text-4xl">
          Recent Events
        </h1>
        <div className="pt-24 md:pt-32">
          <Carousel items={items} initialScroll={0} />
        </div>

        {/* Gallery Section */}

        <div className="w-full px-6 md:px-12 lg:px-16 pb-20 pt-20">
          <h1 className="mb-8 text-left text-xl font-light md:text-4xl">
            All Events
          </h1>

          <div>
            <EventsCards events={allEvents} />
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  );
}
