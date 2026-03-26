import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { EventForm } from "@/components/EventForm";

export default function AdminEditConcert() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl">
          <div className="h-[600px] animate-pulse rounded-lg bg-muted" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="max-w-2xl py-16 text-center">
          <p className="text-muted-foreground">Concert not found.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Edit Concert</h1>
        <EventForm event={event} redirectTo="/admin/concerts" />
      </div>
    </AdminLayout>
  );
}
