// Admin Concerts page - list, add, edit, delete concerts
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminConcerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // get all events with organizer name
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // delete handler
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Concert deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === "published") return "default";
    if (s === "draft") return "secondary";
    if (s === "cancelled") return "destructive";
    return "outline";
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Manage Concerts</h1>
        <Button asChild>
          <Link to="/admin/concerts/create">+ Add Concert</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading concerts...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Venue</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium">Tickets</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Organizer</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events && events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="border-t">
                    <td className="p-3 font-medium max-w-[180px] truncate">{event.title}</td>
                    <td className="p-3">{format(new Date(event.date), "MMM d, yyyy")}</td>
                    <td className="p-3 text-muted-foreground">{event.venue_name || "—"}</td>
                    <td className="p-3">Rs. {event.price}</td>
                    <td className="p-3">{event.available_tickets}/{event.total_tickets}</td>
                    <td className="p-3">
                      <Badge variant={statusColor(event.status) as any}>{event.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{(event.profiles as any)?.full_name || "—"}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/concerts/edit/${event.id}`}>Edit</Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/30" disabled={deletingId === event.id}>
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No concerts found. Click "Add Concert" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
