// Admin layout - simple sidebar + content area
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Music, Ticket, Users, ArrowLeft, MessageSquare, Images, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// sidebar menu items
const menuItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Banners", path: "/admin/banners", icon: Images },
  { label: "Developers", path: "/admin/developers", icon: UserRound },
  { label: "Concerts", path: "/admin/concerts", icon: Music },
  { label: "Bookings", path: "/admin/bookings", icon: Ticket },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Messages", path: "/admin/messages", icon: MessageSquare },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  // check if a menu item is currently active
  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="border-b bg-muted/30 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm">Admin Panel</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{profile?.full_name || "Admin"}</p>
        </div>

        <nav className="flex flex-wrap gap-1 p-2 md:flex-1 md:flex-col md:space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* back to site link */}
        <div className="border-t p-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
