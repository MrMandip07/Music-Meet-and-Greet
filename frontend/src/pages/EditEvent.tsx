import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventForm } from "@/components/EventForm";

export default function EditEvent() {
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
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="h-[600px] animate-pulse rounded-lg bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Edit Event</h1>
        <EventForm event={event} />
      </div>
    </Layout>
  );
}
