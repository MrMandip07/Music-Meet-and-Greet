// Admin Bookings - view all bookings in a simple table
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminBookings() {
  // fetch bookings with event info and user names
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, events(title, date, venue_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // get user names separately
      const userIds = [...new Set(data.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => { nameMap[p.id] = p.full_name || "Unknown"; });

      return data.map((b) => ({ ...b, user_name: nameMap[b.user_id] || "Unknown" }));
    },
  });

  const statusColor = (s: string) => {
    if (s === "completed") return "default";
    if (s === "pending") return "secondary";
    if (s === "cancelled") return "destructive";
    return "outline";
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6">All Bookings</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading bookings...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Event</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Tickets</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Payment</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody>
              {bookings && bookings.length > 0 ? (
                bookings.map((b) => {
                  const event = b.events as any;
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="p-3">{(b as any).user_name}</td>
                      <td className="p-3 font-medium max-w-[160px] truncate">{event?.title || "—"}</td>
                      <td className="p-3">{event?.date ? format(new Date(event.date), "MMM d, yyyy") : "—"}</td>
                      <td className="p-3">{b.num_tickets}</td>
                      <td className="p-3">Rs. {b.total_amount}</td>
                      <td className="p-3 capitalize">{b.payment_method}</td>
                      <td className="p-3">
                        <Badge variant={statusColor(b.payment_status) as any}>{b.payment_status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{format(new Date(b.created_at), "MMM d, HH:mm")}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
