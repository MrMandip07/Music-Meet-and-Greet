import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BannerForm, type BannerRecord } from "@/components/BannerForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type BannerAnalytics = {
  banner_id: string;
  event_type: "view" | "click";
};

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerRecord | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners" as never)
        .select("id, title, subtitle, image_url, is_active, display_order, created_at")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as BannerRecord[]) || [];
    },
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["admin-banner-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banner_events" as never).select("banner_id, event_type");
      if (error) throw error;
      return (data as BannerAnalytics[]) || [];
    },
  });

  const bannerStats = useMemo(() => {
    return analytics.reduce<Record<string, { views: number; clicks: number }>>((acc, item) => {
      if (!acc[item.banner_id]) acc[item.banner_id] = { views: 0, clicks: 0 };
      if (item.event_type === "view") acc[item.banner_id].views += 1;
      if (item.event_type === "click") acc[item.banner_id].clicks += 1;
      return acc;
    }, {});
  }, [analytics]);

  const nextOrder = banners.length ? Math.max(...banners.map((banner) => banner.display_order)) + 1 : 0;

  const openCreateDialog = () => {
    setEditingBanner(null);
    setDialogOpen(true);
  };

  const openEditDialog = (banner: BannerRecord) => {
    setEditingBanner(banner);
    setDialogOpen(true);
  };

  const handleDelete = async (bannerId: string) => {
    const confirmed = window.confirm("Delete this banner?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("banners" as never).delete().eq("id", bannerId);
      if (error) throw error;

      toast({ title: "Banner deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-banners"] });
      queryClient.invalidateQueries({ queryKey: ["admin-banner-analytics"] });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleToggle = async (banner: BannerRecord) => {
    try {
      const { error } = await supabase.from("banners" as never).update({ is_active: !banner.is_active } as never).eq("id", banner.id);
      if (error) throw error;

      toast({ title: banner.is_active ? "Banner hidden" : "Banner activated" });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-banners"] });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleMove = async (banner: BannerRecord, direction: "up" | "down") => {
    const currentIndex = banners.findIndex((item) => item.id === banner.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapBanner = banners[swapIndex];
    if (currentIndex < 0 || !swapBanner) return;

    try {
      const updates = [
        supabase.from("banners" as never).update({ display_order: swapBanner.display_order } as never).eq("id", banner.id),
        supabase.from("banners" as never).update({ display_order: banner.display_order } as never).eq("id", swapBanner.id),
      ];

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-banners"] });
    } catch (error: any) {
      toast({ title: "Reorder failed", description: error.message, variant: "destructive" });
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    queryClient.invalidateQueries({ queryKey: ["homepage-banners"] });
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Homepage Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add slides for the homepage banner and track how people interact with them.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total banners</p>
          <p className="mt-1 text-2xl font-bold">{banners.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total views</p>
          <p className="mt-1 text-2xl font-bold">{analytics.filter((item) => item.event_type === "view").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total clicks</p>
          <p className="mt-1 text-2xl font-bold">{analytics.filter((item) => item.event_type === "click").length}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading banners...</p>
      ) : banners.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No banners yet. Add one to show the slider on the homepage.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-3 text-left font-medium">Preview</th>
                <th className="p-3 text-left font-medium">Text</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Order</th>
                <th className="p-3 text-left font-medium">Analytics</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner, index) => {
                const stats = bannerStats[banner.id] || { views: 0, clicks: 0 };

                return (
                  <tr key={banner.id} className="border-t align-top">
                    <td className="p-3">
                      <div className="w-36 overflow-hidden rounded-md border bg-muted">
                        <div className="aspect-[16/7]">
                          <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{banner.title}</p>
                      <p className="mt-1 max-w-md text-muted-foreground">{banner.subtitle || "No subtitle added."}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={banner.is_active ? "default" : "secondary"}>{banner.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <p>#{banner.display_order}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => void handleMove(banner, "up")} disabled={index === 0}>
                            Up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleMove(banner, "down")}
                            disabled={index === banners.length - 1}
                          >
                            Down
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{stats.views} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4" />
                          <span>{stats.clicks} clicks</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggle(banner)}>
                          {banner.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(banner)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleDelete(banner.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
            <DialogDescription>Upload the banner image, update the text, and choose whether it should be active on the homepage.</DialogDescription>
          </DialogHeader>
          <BannerForm
            banner={editingBanner}
            nextOrder={nextOrder}
            onSuccess={handleFormSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}