import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type DeveloperRecord = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean;
};

interface DeveloperFormProps {
  developer?: DeveloperRecord | null;
  nextOrder?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeveloperForm({ developer, nextOrder = 0, onSuccess, onCancel }: DeveloperFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(developer?.name || "");
  const [role, setRole] = useState(developer?.role || "");
  const [bio, setBio] = useState(developer?.bio || "");
  const [githubUrl, setGithubUrl] = useState(developer?.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(developer?.linkedin_url || "");
  const [imageUrl, setImageUrl] = useState(developer?.image_url || "");
  const [imagePreview, setImagePreview] = useState(developer?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState(String(developer?.display_order ?? nextOrder));
  const [isActive, setIsActive] = useState(developer?.is_active ?? true);
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

    const { error } = await supabase.storage.from("developer-images").upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("developer-images").getPublicUrl(filePath);
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

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName || !trimmedRole || !trimmedBio) {
      toast({ title: "Missing fields", description: "Name, role, and bio are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const uploadedImageUrl = await uploadImage();

      const payload = {
        name: trimmedName,
        role: trimmedRole,
        bio: trimmedBio,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        image_url: uploadedImageUrl || null,
        display_order: Number(displayOrder) || 0,
        is_active: isActive,
        created_by: user.id,
      };

      if (developer) {
        const { error } = await supabase.from("developers" as never).update(payload as never).eq("id", developer.id);
        if (error) throw error;
        toast({ title: "Developer updated" });
      } else {
        const { error } = await supabase.from("developers" as never).insert(payload as never);
        if (error) throw error;
        toast({ title: "Developer added" });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Profile photo</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative h-48 overflow-hidden rounded-lg border bg-muted">
              <img src={imagePreview} alt="Developer preview" className="h-full w-full object-cover" />
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
              className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Upload className="mb-2 h-8 w-8" />
              <span>Click to upload profile photo</span>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="developer-name">Name</Label>
          <Input id="developer-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="developer-role">Role</Label>
          <Input id="developer-role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-1" required />
        </div>
      </div>

      <div>
        <Label htmlFor="developer-bio">Short bio</Label>
        <Textarea
          id="developer-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="mt-1 min-h-[110px]"
          maxLength={220}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="developer-github">GitHub link</Label>
          <Input id="developer-github" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} className="mt-1" placeholder="https://github.com/username" />
        </div>
        <div>
          <Label htmlFor="developer-linkedin">LinkedIn link</Label>
          <Input id="developer-linkedin" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className="mt-1" placeholder="https://linkedin.com/in/username" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="developer-order">Display order</Label>
          <Input id="developer-order" type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="developer-active">Status</Label>
          <select
            id="developer-active"
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
          {developer ? "Update Developer" : "Add Developer"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}