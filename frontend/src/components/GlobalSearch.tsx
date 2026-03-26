import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Calendar, MapPin, Ticket, User, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface UserResult {
  type: "user";
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

interface EventResult {
  type: "event";
  id: string;
  title: string;
  date: string;
  venue_name: string | null;
  image_url: string | null;
  price: number;
}

type SearchResult = UserResult | EventResult;

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        // Search events and users in parallel
        const [eventsRes, profilesRes] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, date, venue_name, image_url, price")
            .eq("status", "published")
            .ilike("title", `%${query}%`)
            .order("date", { ascending: true })
            .limit(4),
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .ilike("full_name", `%${query}%`)
            .limit(3),
        ]);

        const combined: SearchResult[] = [];

        if (eventsRes.data) {
          combined.push(...eventsRes.data.map((e) => ({ type: "event" as const, ...e })));
        }

        if (profilesRes.data) {
          const withRoles = await Promise.all(
            profilesRes.data.map(async (p) => {
              const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", p.id);
              return { type: "user" as const, ...p, roles: roleData?.map((r) => r.role) || [] };
            })
          );
          combined.push(...withRoles);
        }

        setResults(combined);
        setOpen(combined.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === "event") {
      navigate(`/events/${result.id}`);
    }
    // Users don't have a profile page to navigate to yet
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length >= 2) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "musician": return "bg-primary/10 text-primary";
      case "organizer": return "bg-accent/10 text-accent-foreground";
      case "admin": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events, users..."
          className="h-9 w-[220px] pl-8 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-[320px] rounded-md border bg-card p-1 shadow-elevated z-50">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
          )}

          {/* Events */}
          {results.filter((r) => r.type === "event").length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Events
              </div>
              {results
                .filter((r): r is EventResult => r.type === "event")
                .map((event) => (
                  <button
                    key={event.id}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    onClick={() => handleSelect(event)}
                  >
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-muted overflow-hidden">
                      {event.image_url ? (
                        <img src={event.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.date), "MMM d")}
                        </span>
                        {event.venue_name && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3" />
                            {event.venue_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-primary shrink-0">
                      Rs.{event.price}
                    </span>
                  </button>
                ))}
            </>
          )}

          {/* Users */}
          {results.filter((r) => r.type === "user").length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                People
              </div>
              {results
                .filter((r): r is UserResult => r.type === "user")
                .map((user) => (
                  <button
                    key={user.id}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        user.full_name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{user.full_name || "Unknown"}</p>
                      <div className="flex gap-1 mt-0.5">
                        {user.roles.map((role) => (
                          <span key={role} className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${roleColor(role)}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
            </>
          )}

          {/* View all link */}
          <button
            className="flex w-full items-center justify-center gap-1 rounded-sm px-3 py-2 text-xs font-medium text-primary hover:bg-muted transition-colors mt-1"
            onClick={() => {
              setOpen(false);
              navigate(`/search?q=${encodeURIComponent(query)}`);
              setQuery("");
            }}
          >
            View all results <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
