import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ArrowLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export default function Announcements() {
  const { roles } = useAuth();
  const canPost = roles.includes("organizer") || roles.includes("admin") || roles.includes("musician");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles:author_id(full_name, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto max-w-[900px] px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Home</Link>
            </Button>
            <h1 className="text-2xl font-bold">News & Announcements</h1>
          </div>
          {canPost && (
            <Button asChild>
              <Link to="/announcements/create">
                <Plus className="mr-1 h-4 w-4" /> New Post
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((a: any) => (
              <Link
                key={a.id}
                to={`/announcements/${a.id}`}
                className="block group"
              >
                <article className="rounded-lg bg-card shadow-card overflow-hidden transition-all hover:shadow-card-hover hover:-translate-y-0.5">
                  {a.image_url && (
                    <div className="aspect-[21/9] overflow-hidden">
                      <img
                        src={a.image_url}
                        alt={a.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {a.title}
                    </h2>
                    {a.content && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {a.content}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {a.profiles?.full_name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(a.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No announcements yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
