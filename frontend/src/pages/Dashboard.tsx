// Organizer Dashboard - manage events and view bookings
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Calendar, Ticket, Eye, Clock, MapPin, CreditCard, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isOrganizer = roles.includes("organizer") || roles.includes("musician") || roles.includes("admin");

  // get organizer's events from database
  const { data: events, isLoading } = useQuery({
    queryKey: ["my-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isOrganizer,
  });

  // get bookings for organizer's events
  const { data: bookings } = useQuery({
    queryKey: ["organizer-bookings", user?.id],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map((e) => e.id);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, events(*)")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isOrganizer && !!events,
  });

  // delete an event
  const handleDelete = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
    }
  };

  // show message if not organizer
  if (!isOrganizer) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-muted-foreground">You need an organizer account to access this page.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  // calculate some stats
  const completedBookings = bookings?.filter((b: any) => b.payment_status === "completed") || [];
  const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + Number(b.total_amount), 0);
  const totalTicketsSold = completedBookings.reduce((sum: number, b: any) => sum + b.num_tickets, 0);

  const statusColor = (s: string) => {
    if (s === "published") return "default";
    if (s === "draft") return "secondary";
    if (s === "cancelled") return "destructive";
    return "outline";
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <Button onClick={() => navigate("/dashboard/create")}>
            <Plus className="mr-1 h-4 w-4" /> New Event
          </Button>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Events</p>
              <p className="text-xl font-bold">{events?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Tickets Sold</p>
              <p className="text-xl font-bold">{totalTicketsSold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold">Rs. {totalRevenue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-xl font-bold">{bookings?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Events list */}
        <h2 className="mt-8 text-lg font-semibold">My Events</h2>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{event.title}</h3>
                    <Badge variant={statusColor(event.status) as any}>{event.status}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </span>
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      {event.available_tickets}/{event.total_tickets}
                    </span>
                    {event.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/events/${event.id}`}><Eye className="mr-1 h-3.5 w-3.5" /> View</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/edit/${event.id}`)}>
                    <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 py-12 text-center">
            <p className="text-muted-foreground">No events yet. Create your first one!</p>
            <Button className="mt-3" onClick={() => navigate("/dashboard/create")}>
              <Plus className="mr-1 h-4 w-4" /> Create Event
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
