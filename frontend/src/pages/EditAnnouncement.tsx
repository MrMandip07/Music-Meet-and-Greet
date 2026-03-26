import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CreateAnnouncement from "./CreateAnnouncement";
import { Layout } from "@/components/Layout";

export default function EditAnnouncement() {
  const { id } = useParams<{ id: string }>();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!announcement) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Announcement not found.</p>
        </div>
      </Layout>
    );
  }

  return <CreateAnnouncement announcement={announcement} />;
}
