// Admin Users page - shows all registered users and their roles
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminUsers() {
  // fetch all profiles and their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;

      // map roles to each user
      const rolesMap: Record<string, string[]> = {};
      rolesRes.data?.forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      return profilesRes.data.map((p) => ({
        ...p,
        roles: rolesMap[p.id] || ["user"],
      }));
    },
  });

  const roleColor = (role: string) => {
    if (role === "admin") return "destructive";
    if (role === "organizer") return "default";
    if (role === "musician") return "secondary";
    return "outline";
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6">All Users</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Roles</th>
                <th className="text-left p-3 font-medium">Bio</th>
                <th className="text-left p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {/* simple avatar circle */}
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(user.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.full_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role: string) => (
                          <Badge key={role} variant={roleColor(role) as any} className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-[180px] truncate">{user.bio || "—"}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(user.created_at), "MMM d, yyyy")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
