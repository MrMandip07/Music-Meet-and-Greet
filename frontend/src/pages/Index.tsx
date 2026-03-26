// Homepage - shows hero banner, featured concert, recent news, and upcoming events
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ticket, ArrowRight, CalendarDays, Users, CreditCard, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  is_active: boolean;
  display_order: number;
};

const PAGE_SIZE = 6;

export default function Index() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeBanner, setActiveBanner] = useState(0);

  // fetch published events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", search, page],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("date", { ascending: true })
        .range(0, page * PAGE_SIZE - 1);

      if (search) query = query.ilike("title", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ["homepage-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners" as never)
        .select("id, title, subtitle, image_url, is_active, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as Banner[]) || [];
    },
  });

  // fetch latest 3 announcements for the news section
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles:author_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const featuredEvent = events?.[0];
  const activeBanners = useMemo(() => banners?.filter((banner) => banner.is_active) || [], [banners]);
  const infoCards = [
    {
      title: "Upcoming concerts",
      value: events?.length ? `${events.length}+ listed` : "Fresh listings",
      icon: CalendarDays,
      note: "Browse current published events quickly",
    },
    {
      title: "Seat booking",
      value: "Easy process",
      icon: Users,
      note: "Reserve tickets in a few simple steps",
    },
    {
      title: "Digital payment",
      value: "Khalti & eSewa",
      icon: CreditCard,
      note: "Pay online and keep your booking record safe",
    },
  ];

  useEffect(() => {
    if (!activeBanners.length) {
      setActiveBanner(0);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % activeBanners.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanner > Math.max(activeBanners.length - 1, 0)) {
      setActiveBanner(0);
    }
  }, [activeBanner, activeBanners.length]);

  useEffect(() => {
    const banner = activeBanners[activeBanner];
    if (!banner) return;

    const sessionId = window.localStorage.getItem("banner-session") || crypto.randomUUID();
    window.localStorage.setItem("banner-session", sessionId);

    const viewedKey = `banner-view-${banner.id}`;
    if (window.sessionStorage.getItem(viewedKey)) return;

    window.sessionStorage.setItem(viewedKey, "1");

    void supabase.from("banner_events" as never).insert({
      banner_id: banner.id,
      event_type: "view",
      session_id: sessionId,
    } as never);
  }, [activeBanner, activeBanners]);

  const goToPreviousBanner = () => {
    if (!activeBanners.length) return;
    setActiveBanner((current) => (current === 0 ? activeBanners.length - 1 : current - 1));
  };

  const goToNextBanner = () => {
    if (!activeBanners.length) return;
    setActiveBanner((current) => (current + 1) % activeBanners.length);
  };

  const trackBannerClick = async (bannerId?: string) => {
    if (!bannerId) return;
    const sessionId = window.localStorage.getItem("banner-session") || crypto.randomUUID();
    window.localStorage.setItem("banner-session", sessionId);

    await supabase.from("banner_events" as never).insert({
      banner_id: bannerId,
      event_type: "click",
      session_id: sessionId,
    } as never);
  };

  const currentBanner = activeBanners[activeBanner];
  const fallbackBanner = {
    title: "Book Concert Tickets in Nepal",
    subtitle: "Browse upcoming shows, compare dates, and book your seat from one simple platform.",
    image_url: featuredEvent?.image_url || "",
  };

  return (
    <Layout>
      {/* top banner */}
      <section className="relative overflow-hidden border-b bg-card">
        <div className="relative min-h-[420px] sm:min-h-[500px] lg:min-h-[580px]">
          {(bannersLoading ? [] : activeBanners).length > 0 ? (
            activeBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${index === activeBanner ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/25" />
              </div>
            ))
          ) : (
            <>
              {fallbackBanner.image_url ? (
                <img src={fallbackBanner.image_url} alt={fallbackBanner.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-accent/50 to-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/25" />
            </>
          )}

          <div className="relative container mx-auto flex min-h-[420px] max-w-6xl items-center px-4 py-10 sm:min-h-[500px] lg:min-h-[580px]">
            <div className="w-full max-w-3xl text-primary-foreground">
              <p className="mb-3 text-sm font-medium tracking-wide text-primary-foreground/80">Concert booking made simple</p>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {currentBanner?.title || fallbackBanner.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/80 sm:text-base">
                {currentBanner?.subtitle || fallbackBanner.subtitle}
              </p>

              <div className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search concerts, artists, or venues"
                    className="h-12 rounded-xl border-0 bg-background pl-11 pr-4 text-foreground shadow-md"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl px-6 shadow-md sm:px-7"
                  onClick={() => void trackBannerClick(currentBanner?.id)}
                >
                  <Link to="/events">
                    Browse Events <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
                <span className="rounded-lg border border-primary-foreground/15 bg-background/10 px-3 py-2 backdrop-blur-sm">Easy booking flow</span>
                <span className="rounded-lg border border-primary-foreground/15 bg-background/10 px-3 py-2 backdrop-blur-sm">Khalti and eSewa support</span>
                <span className="rounded-lg border border-primary-foreground/15 bg-background/10 px-3 py-2 backdrop-blur-sm">Simple concert management</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goToPreviousBanner}
            className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/20 bg-background/15 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-background/25 md:flex"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNextBanner}
            className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/20 bg-background/15 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-background/25 md:flex"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {activeBanners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {activeBanners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveBanner(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeBanner ? "w-8 bg-primary-foreground" : "w-2.5 bg-primary-foreground/45"}`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* featured event + info */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
            <div>
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="border-b bg-muted/40 px-5 py-3">
                  <p className="text-sm font-medium text-muted-foreground">Featured event</p>
                </div>
                <CardContent className="p-0">
                  <div className="aspect-[16/10] bg-muted/20">
                    {featuredEvent ? (
                      <div className="grid h-full md:grid-cols-[1.1fr_0.9fr]">
                        <div className="bg-muted">
                          {featuredEvent.image_url ? (
                            <img src={featuredEvent.image_url} alt={featuredEvent.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted/60 px-6 text-center text-sm text-muted-foreground">
                              Featured concert image will appear here.
                            </div>
                          )}
                        </div>
                        <div className="flex h-full flex-col justify-between p-5">
                          <div className="space-y-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-primary">Now booking</p>
                            <h2 className="text-2xl font-semibold leading-snug">{featuredEvent.title}</h2>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              <span>{format(new Date(featuredEvent.date), "MMM d, yyyy")}</span>
                              {featuredEvent.time && <span>• {featuredEvent.time.slice(0, 5)}</span>}
                            </p>
                            {featuredEvent.venue_name && (
                              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{featuredEvent.venue_name}</span>
                              </p>
                            )}
                            {featuredEvent.description && (
                              <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{featuredEvent.description}</p>
                            )}
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
                            <span className="font-medium text-foreground">
                              {featuredEvent.price > 0 ? `Rs. ${featuredEvent.price}` : "Free entry"}
                            </span>
                            <Link to={`/events/${featuredEvent.id}`} className="font-medium text-primary hover:underline">
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[320px] flex-col justify-center gap-4 p-6">
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">Live events</p>
                        <h2 className="text-2xl font-semibold leading-snug">Find your next concert in one place</h2>
                        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                          Browse listed shows, compare dates, and book tickets without jumping between pages.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {infoCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} className="rounded-xl border bg-background shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                      <div>
                        <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {announcements && announcements.length > 0 && (
        <section className="py-10">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Latest News</h2>
              <Link to="/announcements" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((a: any) => (
                <Link key={a.id} to={`/announcements/${a.id}`} className="block">
                  <div className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
                    {a.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">{a.title}</h3>
                      {a.content && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.content}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {a.profiles?.full_name || "Unknown"} · {format(new Date(a.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="pt-6 pb-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <Link to="/events" className="text-sm text-primary hover:underline">
              See all →
            </Link>
          </div>

          {eventsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[280px] animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {events.length >= page * PAGE_SIZE && (
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">No events right now. Check back later!</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
