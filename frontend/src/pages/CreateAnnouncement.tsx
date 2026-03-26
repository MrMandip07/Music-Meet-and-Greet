import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { Link } from "react-router-dom";

interface AnnouncementFormProps {
  announcement?: {
    id: string;
    title: string;
    content: string | null;
    image_url: string | null;
  };
}

export default function CreateAnnouncement({ announcement }: AnnouncementFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!announcement;

  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(announcement?.image_url || null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);
    try {
      let imageUrl = announcement?.image_url || null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      if (isEdit && announcement) {
        const { error } = await supabase
          .from("announcements")
          .update({ title, content, image_url: imageUrl })
          .eq("id", announcement.id);
        if (error) throw error;
        toast({ title: "Announcement updated!" });
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({ title, content, image_url: imageUrl, author_id: user.id });
        if (error) throw error;
        toast({ title: "Announcement published!" });
      }

      navigate("/announcements");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/announcements"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit" : "Create"} Announcement</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 hover:border-primary/40 transition-colors">
                <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                <span className="mt-2 text-sm text-muted-foreground">Click to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/announcements")}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !title.trim()}>
              {loading ? "Publishing..." : isEdit ? "Update" : "Publish"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
