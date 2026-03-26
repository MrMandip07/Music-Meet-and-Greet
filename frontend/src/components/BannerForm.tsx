import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type BannerRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
};

interface BannerFormProps {
  banner?: BannerRecord | null;
  nextOrder?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BannerForm({ banner, nextOrder = 0, onSuccess, onCancel }: BannerFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(banner?.title || "Book Concert Tickets in Nepal");
  const [subtitle, setSubtitle] = useState(
    banner?.subtitle || "Browse upcoming shows, compare dates, and book your seat from one simple platform.",
  );
  const [imageUrl, setImageUrl] = useState(banner?.image_url || "");
  const [imagePreview, setImagePreview] = useState(banner?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState(String(banner?.display_order ?? nextOrder));
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image below 5MB.", variant: "destructive" });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile || !user) return imageUrl;

    const ext = imageFile.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("banner-images").upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("banner-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const uploadedImageUrl = await uploadImage();

      if (!uploadedImageUrl) {
        throw new Error("Please upload a banner image first.");
      }

      const payload = {
        title,
        subtitle: subtitle || null,
        image_url: uploadedImageUrl,
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
        created_by: user.id,
      };

      if (banner) {
        const { error } = await supabase.from("banners" as never).update(payload as never).eq("id", banner.id);
        if (error) throw error;
        toast({ title: "Banner updated" });
      } else {
        const { error } = await supabase.from("banners" as never).insert(payload as never);
        if (error) throw error;
        toast({ title: "Banner added" });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Banner image</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-lg border bg-muted">
              <div className="aspect-[16/7]">
                <img src={imagePreview} alt="Banner preview" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute right-3 top-3 rounded-full bg-background/90 p-1.5 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[16/7] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Upload className="mb-2 h-8 w-8" />
              <span>Click to upload banner image</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="banner-title">Title</Label>
        <Input id="banner-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" required />
      </div>

      <div>
        <Label htmlFor="banner-subtitle">Subtitle</Label>
        <Textarea
          id="banner-subtitle"
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
          className="mt-1 min-h-[96px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="banner-order">Display order</Label>
          <Input
            id="banner-order"
            type="number"
            min="0"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="banner-active">Status</Label>
          <select
            id="banner-active"
            value={isActive ? "active" : "inactive"}
            onChange={(event) => setIsActive(event.target.value === "active")}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {banner ? "Update Banner" : "Add Banner"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}