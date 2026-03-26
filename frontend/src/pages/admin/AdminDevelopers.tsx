import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Github, Linkedin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeveloperForm, type DeveloperRecord } from "@/components/DeveloperForm";
import { getDeveloperPlaceholder } from "@/lib/developerPlaceholders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminDevelopers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<DeveloperRecord | null>(null);

  const { data: developers = [], isLoading } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers" as never)
        .select("id, name, role, bio, image_url, github_url, linkedin_url, display_order, is_active, created_at")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as DeveloperRecord[]) || [];
    },
  });

  const nextOrder = developers.length ? Math.max(...developers.map((item) => item.display_order)) + 1 : 0;

  const openCreateDialog = () => {
    setEditingDeveloper(null);
    setDialogOpen(true);
  };

  const openEditDialog = (developer: DeveloperRecord) => {
    setEditingDeveloper(developer);
    setDialogOpen(true);
  };

  const handleDelete = async (developerId: string) => {
    const confirmed = window.confirm("Delete this developer profile?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("developers" as never).delete().eq("id", developerId);
      if (error) throw error;

      toast({ title: "Developer deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-developers"] });
      queryClient.invalidateQueries({ queryKey: ["about-developers"] });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleToggle = async (developer: DeveloperRecord) => {
    try {
      const { error } = await supabase.from("developers" as never).update({ is_active: !developer.is_active } as never).eq("id", developer.id);
      if (error) throw error;

      toast({ title: developer.is_active ? "Developer hidden" : "Developer activated" });
      queryClient.invalidateQueries({ queryKey: ["admin-developers"] });
      queryClient.invalidateQueries({ queryKey: ["about-developers"] });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-developers"] });
    queryClient.invalidateQueries({ queryKey: ["about-developers"] });
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Developer Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the profiles shown on the About Us page.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Developer
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading developers...</p>
      ) : developers.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No developer profiles yet. Add team members to show them on the About page.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-3 text-left font-medium">Member</th>
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Bio</th>
                <th className="p-3 text-left font-medium">Links</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((developer, index) => (
                <tr key={developer.id} className="border-t align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 rounded-lg">
                        <AvatarImage src={developer.image_url || getDeveloperPlaceholder(developer.name, index)} alt={developer.name} className="object-cover" />
                        <AvatarFallback className="rounded-lg">{developer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{developer.name}</p>
                        <p className="text-xs text-muted-foreground">Order #{developer.display_order}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{developer.role}</td>
                  <td className="p-3 text-muted-foreground">
                    <p className="max-w-sm leading-6">{developer.bio}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {developer.github_url && (
                        <a href={developer.github_url} target="_blank" rel="noreferrer" className="rounded-md border p-2 hover:bg-muted" aria-label="GitHub profile">
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {developer.linkedin_url && (
                        <a href={developer.linkedin_url} target="_blank" rel="noreferrer" className="rounded-md border p-2 hover:bg-muted" aria-label="LinkedIn profile">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {!developer.github_url && !developer.linkedin_url && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={developer.is_active ? "default" : "secondary"}>{developer.is_active ? "Active" : "Hidden"}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggle(developer)}>
                        {developer.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(developer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleDelete(developer.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingDeveloper ? "Edit Developer" : "Add Developer"}</DialogTitle>
            <DialogDescription>Upload a photo, add a short bio, and choose where this member should appear on the About page.</DialogDescription>
          </DialogHeader>
          <DeveloperForm
            developer={editingDeveloper}
            nextOrder={nextOrder}
            onSuccess={handleFormSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}