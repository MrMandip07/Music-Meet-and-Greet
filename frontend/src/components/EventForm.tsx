import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
  redirectTo?: string;
}

export function EventForm({ event, onSuccess, redirectTo = "/dashboard" }: EventFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [date, setDate] = useState<Date | undefined>(event?.date ? new Date(event.date) : undefined);
  const [time, setTime] = useState(event?.time?.slice(0, 5) || "");
  const [venueName, setVenueName] = useState(event?.venue_name || "");
  const [venueAddress, setVenueAddress] = useState(event?.venue_address || "");
  const [price, setPrice] = useState(event?.price?.toString() || "0");
  const [totalTickets, setTotalTickets] = useState(event?.total_tickets?.toString() || "100");
  const [status, setStatus] = useState<"draft" | "published">(event?.status === "published" ? "published" : "draft");
  const [imageUrl, setImageUrl] = useState(event?.image_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(event?.image_url || "");
  const [submitting, setSubmitting] = useState(false);

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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return imageUrl || null;
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;

    setSubmitting(true);
    try {
      const uploadedUrl = await uploadImage();

      const eventData = {
        title,
        description: description || null,
        date: format(date, "yyyy-MM-dd"),
        time: time ? `${time}:00` : null,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        price: parseFloat(price) || 0,
        total_tickets: parseInt(totalTickets) || 0,
        status,
        image_url: uploadedUrl,
        organizer_id: user.id,
      };

      if (event) {
        // Update — keep available_tickets in sync if total changed
        const ticketDiff = (parseInt(totalTickets) || 0) - event.total_tickets;
        const { error } = await supabase
          .from("events")
          .update({
            ...eventData,
            available_tickets: event.available_tickets + ticketDiff,
          })
          .eq("id", event.id);
        if (error) throw error;
        toast({ title: "Event updated!" });
      } else {
        const { error } = await supabase.from("events").insert({
          ...eventData,
          available_tickets: parseInt(totalTickets) || 0,
        });
        if (error) throw error;
        toast({ title: "Event created!" });
      }

      onSuccess?.();
      navigate(redirectTo);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image upload */}
      <div>
        <Label>Event Image</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors"
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <span className="text-xs text-muted-foreground/60">Max 5MB • JPG, PNG, WebP</span>
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

      {/* Title */}
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" placeholder="e.g. Summer Music Festival" />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[120px]" placeholder="Describe your event..." />
      </div>

      {/* Date & Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
        </div>
      </div>

      {/* Venue */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="venue">Venue Name</Label>
          <Input id="venue" value={venueName} onChange={(e) => setVenueName(e.target.value)} className="mt-1" placeholder="e.g. Dashrath Rangashala" />
        </div>
        <div>
          <Label htmlFor="address">Venue Address</Label>
          <Input id="address" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} className="mt-1" placeholder="e.g. Tripureshwor, Kathmandu" />
        </div>
      </div>

      {/* Price & Tickets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Price (Rs.)</Label>
          <Input id="price" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="tickets">Total Tickets</Label>
          <Input id="tickets" type="number" min="1" value={totalTickets} onChange={(e) => setTotalTickets(e.target.value)} className="mt-1" />
        </div>
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || !title || !date} className="flex-1">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {event ? "Update Event" : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(redirectTo)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
