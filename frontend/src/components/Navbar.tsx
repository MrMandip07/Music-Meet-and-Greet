// Navigation bar component
// Shows different links based on whether user is logged in or not
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Ticket, LayoutDashboard, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";

export function Navbar() {
  const { user, profile, roles, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      setMenuOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  // check if user can manage events
  const canManageEvents = roles.includes("organizer") || roles.includes("musician") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const navItemClass = "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  const activeNavItemClass = "bg-muted text-foreground";
  const authButtonClass = "min-w-[88px]";

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="text-xl">🎵</span>
          <span>MUSIC MEET & GREET</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/" end className={navItemClass} activeClassName={activeNavItemClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={navItemClass} activeClassName={activeNavItemClass}>
            Events
          </NavLink>
          <NavLink to="/about" className={navItemClass} activeClassName={activeNavItemClass}>
            About
          </NavLink>
          <NavLink to="/announcements" className={navItemClass} activeClassName={activeNavItemClass}>
            News
          </NavLink>
          <NavLink to="/contact" className={navItemClass} activeClassName={activeNavItemClass}>
            Contact
          </NavLink>

          {user ? (
            <>
              {canManageEvents && (
                <Button variant={location.pathname.startsWith("/dashboard") ? "secondary" : "ghost"} size="sm" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-1 h-4 w-4" />
                  Dashboard
                </Button>
              )}
              {isAdmin && (
                <Button variant={location.pathname.startsWith("/admin") ? "secondary" : "ghost"} size="sm" onClick={() => navigate("/admin")}>
                  <Shield className="mr-1 h-4 w-4" />
                  Admin
                </Button>
              )}
              <Button variant={location.pathname === "/my-bookings" ? "secondary" : "ghost"} size="sm" onClick={() => navigate("/my-bookings")}>
                <Ticket className="mr-1 h-4 w-4" />
                Bookings
              </Button>
              <Button variant={location.pathname === "/profile" ? "secondary" : "ghost"} size="sm" onClick={() => navigate("/profile")}>
                <User className="mr-1 h-4 w-4" />
                {profile?.full_name || "Profile"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="mr-1 h-4 w-4" />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className={authButtonClass} onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" className={authButtonClass} onClick={() => navigate("/signup")}>
                Sign up
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button className="rounded-md border bg-background p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <NavLink to="/" end onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Home</NavLink>
            <NavLink to="/events" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Events</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>About</NavLink>
            <NavLink to="/announcements" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>News</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Contact</NavLink>
            {user ? (
              <>
                {canManageEvents && (
                  <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Dashboard</NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Admin</NavLink>
                )}
                <NavLink to="/my-bookings" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>My Bookings</NavLink>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={navItemClass} activeClassName={activeNavItemClass}>Profile</NavLink>
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? "Logging out..." : "Logout"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMenuOpen(false); }}>Log in</Button>
                <Button size="sm" onClick={() => { navigate("/signup"); setMenuOpen(false); }}>Sign up</Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
 