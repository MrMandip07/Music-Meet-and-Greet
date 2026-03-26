import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, User, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles:author_id(full_name, avatar_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isAuthor = user?.id === announcement?.author_id;

  const handleDelete = async () => {
    const { error } = await supabase.from("announcements").delete().eq("id", id!);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement deleted" });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      navigate("/announcements");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-[800px] px-4 py-8">
          <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!announcement) {
    return (
      <Layout>
        <div className="container mx-auto max-w-[800px] px-4 py-16 text-center">
          <p className="text-muted-foreground">Announcement not found.</p>
          <Button variant="ghost" className="mt-4" asChild>
            <Link to="/announcements"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const author = announcement.profiles as any;

  return (
    <Layout>
      <div className="container mx-auto max-w-[800px] px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/announcements"><ArrowLeft className="mr-1 h-4 w-4" /> All News</Link>
          </Button>
          {isAuthor && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/announcements/edit/${id}`)}>
                <Edit className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <article>
          {announcement.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-6">
              <img src={announcement.image_url} alt={announcement.title} className="h-full w-full object-cover" />
            </div>
          )}

          <h1 className="text-3xl font-bold">{announcement.title}</h1>

          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold overflow-hidden">
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  author?.full_name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />
                )}
              </div>
              {author?.full_name || "Unknown"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(announcement.created_at), "MMMM d, yyyy")}
            </span>
          </div>

          {announcement.content && (
            <div className="mt-6 prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-line">
              {announcement.content}
            </div>
          )}
        </article>
      </div>
    </Layout>
  );
}
