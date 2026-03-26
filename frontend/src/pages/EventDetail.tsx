// Event detail page - shows full info and booking option
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";
import { BookingForm } from "@/components/BookingForm";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  // get event data
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // get organizer info
  const { data: organizer } = useQuery({
    queryKey: ["organizer", event?.organizer_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", event!.organizer_id)
        .single();
      return data;
    },
    enabled: !!event?.organizer_id,
  });

  // loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
        </div>
      </Layout>
    );
  }

  // event not found
  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Event not found.</p>
          <Button variant="ghost" className="mt-4" asChild>
            <Link to="/events"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleGetTickets = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBookingOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/events"><ArrowLeft className="mr-1 h-4 w-4" /> Back to events</Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* left side - image and description */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg bg-muted aspect-video">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Ticket className="h-14 w-14 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <h1 className="mt-5 text-2xl font-bold">{event.title}</h1>
            {event.description && (
              <p className="mt-3 text-muted-foreground whitespace-pre-line">{event.description}</p>
            )}
          </div>

          {/* right side - ticket info */}
          <div>
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">
                  {event.price > 0 ? `Rs. ${event.price}` : "Free"}
                </span>
              </div>

              <hr />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{event.time.slice(0, 5)}</span>
                  </div>
                )}
                {event.venue_name && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{event.venue_name}</p>
                      {event.venue_address && <p className="text-xs text-muted-foreground">{event.venue_address}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span>{event.available_tickets} / {event.total_tickets} tickets left</span>
                </div>
              </div>

              <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <Button
                  className="w-full"
                  onClick={handleGetTickets}
                  disabled={event.available_tickets === 0}
                >
                  {event.available_tickets === 0 ? "Sold Out" : "Book Now"}
                </Button>
                <DialogContent className="sm:max-w-md">
                  <BookingForm event={event} onClose={() => setBookingOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {/* organizer info */}
            {organizer && (
              <div className="mt-4 rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-2">Organized by</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {organizer.full_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">{organizer.full_name || "Unknown"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
