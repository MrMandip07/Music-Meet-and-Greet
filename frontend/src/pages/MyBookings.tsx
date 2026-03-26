// My Bookings page - shows all tickets the user has booked
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Ticket, ArrowLeft, MapPin, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function MyBookings() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // fetch user's bookings with event details
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, events(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // redirect to login if not authenticated
  if (!loading && !user) return <Navigate to="/login" replace />;

  // cancel a booking using database RPC
  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const { error } = await supabase.rpc("cancel_booking", {
        p_booking_id: bookingId,
        p_user_id: user!.id,
      });
      if (error) throw error;
      toast({ title: "Booking cancelled" });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  // helper for status badge colors
  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "failed" || status === "cancelled") return "bg-red-100 text-red-700";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Home</Link>
          </Button>
          <h1 className="text-2xl font-bold">My Tickets</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const event = booking.events as any;
              const isActive = booking.payment_status === "completed";
              return (
                <div key={booking.id} className={`rounded-lg border bg-card p-4 ${!isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{event?.title || "Unknown Event"}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {event?.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.date), "MMM d, yyyy")}
                          </span>
                        )}
                        {event?.venue_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(booking.payment_status)}`}>
                      {booking.payment_status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                      {booking.num_tickets} ticket{booking.num_tickets > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium text-primary">Rs. {booking.total_amount}</span>
                    <span className="text-xs text-muted-foreground capitalize">{booking.payment_method}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/booking-confirmation/${booking.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Link>
                    </Button>
                    {isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive" disabled={cancellingId === booking.id}>
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your {booking.num_tickets} ticket{booking.num_tickets > 1 ? "s" : ""} for "{event?.title}" will be released.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(booking.id)}>Cancel Booking</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">You haven't booked any tickets yet.</p>
            <Button className="mt-3" asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
