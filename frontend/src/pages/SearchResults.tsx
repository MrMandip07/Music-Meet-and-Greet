import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Ticket, ArrowLeft } from "lucide-react";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) setSearchParams({ q: query }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Sync from URL
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) {
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [searchParams]);

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["search-events", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .or(`title.ilike.%${debouncedQuery}%,venue_name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
        .order("date", { ascending: true })
        .limit(20);
      return data || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["search-users", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio")
        .ilike("full_name", `%${debouncedQuery}%`)
        .limit(20);
      if (!profiles) return [];
      return Promise.all(
        profiles.map(async (p) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", p.id);
          return { ...p, roles: roleData?.map((r) => r.role) || [] };
        })
      );
    },
    enabled: debouncedQuery.length >= 2,
  });

  const roleColor = (role: string) => {
    switch (role) {
      case "musician": return "bg-primary/10 text-primary";
      case "organizer": return "bg-accent/10 text-accent-foreground";
      case "admin": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const totalResults = (events?.length || 0) + (users?.length || 0);

  return (
    <Layout>
      <div className="container mx-auto max-w-[1280px] px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Home</Link>
          </Button>
          <h1 className="text-2xl font-bold">Search</h1>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events, users..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {debouncedQuery.length >= 2 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {eventsLoading || usersLoading
              ? "Searching..."
              : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${debouncedQuery}"`}
          </p>
        )}

        {debouncedQuery.length >= 2 && (
          <Tabs defaultValue="events" className="mt-6">
            <TabsList>
              <TabsTrigger value="events">
                Events {events && `(${events.length})`}
              </TabsTrigger>
              <TabsTrigger value="users">
                People {users && `(${users.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-4">
              {eventsLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : events && events.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">No events found.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-card">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          u.full_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{u.full_name || "Unknown"}</p>
                        {u.bio && <p className="text-xs text-muted-foreground line-clamp-1">{u.bio}</p>}
                        <div className="flex gap-1 mt-1">
                          {u.roles.map((role) => (
                            <span key={role} className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${roleColor(role)}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <User className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">No users found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
