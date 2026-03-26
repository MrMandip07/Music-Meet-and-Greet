// Card component for displaying a single event in the list
import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export function EventCard({ event }: { event: Event }) {
  return (
    <Link to={`/events/${event.id}`} className="block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md">
        {/* event image or placeholder */}
        <div className="aspect-[16/10] bg-muted/70">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/40 px-4 text-center">
              <Ticket className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Concert banner will appear here</p>
            </div>
          )}
        </div>

        {/* event info */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-1 text-lg font-semibold leading-snug">{event.title}</h3>

          <div className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
              {event.time && <span>at {event.time.slice(0, 5)}</span>}
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-3 text-sm">
            <span className="font-medium text-foreground">
              {event.price > 0 ? `Rs. ${event.price}` : "Free"}
            </span>
            <span className="text-xs text-muted-foreground">
              {event.available_tickets} left
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
