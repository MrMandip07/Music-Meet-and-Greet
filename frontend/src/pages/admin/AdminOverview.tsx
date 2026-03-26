// Admin Overview - shows basic stats about the platform
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminOverview() {
  // fetch counts and totals from database
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [eventsRes, bookingsRes, profilesRes, bannersRes, bannerEventsRes, developersRes] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("total_amount, num_tickets"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("banners" as never).select("id", { count: "exact", head: true }),
        supabase.from("banner_events" as never).select("event_type"),
        supabase.from("developers" as never).select("id", { count: "exact", head: true }),
      ]);

      const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const totalTickets = bookingsRes.data?.reduce((sum, b) => sum + b.num_tickets, 0) || 0;
      const totalBannerViews = (bannerEventsRes.data as Array<{ event_type: "view" | "click" }> | null)?.filter((item) => item.event_type === "view").length || 0;
      const totalBannerClicks = (bannerEventsRes.data as Array<{ event_type: "view" | "click" }> | null)?.filter((item) => item.event_type === "click").length || 0;

      return {
        totalEvents: eventsRes.count || 0,
        totalBookings: bookingsRes.data?.length || 0,
        totalUsers: profilesRes.count || 0,
        totalBanners: bannersRes.count || 0,
        totalDevelopers: developersRes.count || 0,
        totalRevenue,
        totalTickets,
        totalBannerViews,
        totalBannerClicks,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quick summary of concerts, bookings, users, and revenue.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading stats...</p>
      ) : (
        <>
          {/* Stats grid - simple boxes */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Total Concerts</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalEvents}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalBookings}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Registered Users</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalUsers}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">Rs. {stats?.totalRevenue?.toLocaleString()}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Homepage Banners</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalBanners}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalDevelopers}</p>
            </div>
          </div>

          {/* Extra info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Tickets sold so far: <span className="font-semibold text-foreground">{stats?.totalTickets}</span>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Banner views: <span className="font-semibold text-foreground">{stats?.totalBannerViews}</span>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Banner clicks: <span className="font-semibold text-foreground">{stats?.totalBannerClicks}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
