// Events listing page with search and filters
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ticket, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export default function Events() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [venueFilter, setVenueFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">("all");

  // fetch events with filters applied
  const { data: events, isLoading } = useQuery({
    queryKey: ["events-all", search, page, dateFilter?.toISOString(), venueFilter, timeFilter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .range(0, page * PAGE_SIZE - 1);

      // apply time filter
      if (timeFilter === "upcoming") {
        query = query.gte("date", new Date().toISOString().split("T")[0]).order("date", { ascending: true });
      } else if (timeFilter === "past") {
        query = query.lt("date", new Date().toISOString().split("T")[0]).order("date", { ascending: false });
      } else {
        query = query.order("date", { ascending: true });
      }

      if (search) query = query.ilike("title", `%${search}%`);
      if (dateFilter) query = query.eq("date", format(dateFilter, "yyyy-MM-dd"));
      if (venueFilter) query = query.ilike("venue_name", `%${venueFilter}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const clearFilters = () => {
    setSearch("");
    setDateFilter(undefined);
    setVenueFilter("");
    setTimeFilter("all");
    setPage(1);
  };

  const hasFilters = search || dateFilter || venueFilter || timeFilter !== "all";

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
        <h1 className="text-2xl font-bold md:text-3xl">All Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse concerts by date, venue, or event name.
        </p>

        {/* Filter bar */}
        <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v as any); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full sm:w-44 justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "MMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(d) => { setDateFilter(d); setPage(1); }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <div className="w-full sm:w-44">
            <Input
              placeholder="Venue name..."
              value={venueFilter}
              onChange={(e) => { setVenueFilter(e.target.value); setPage(1); }}
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          )}
          </div>
        </div>

        {/* Event grid */}
        <div className="mt-7">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-[320px] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {events.length >= page * PAGE_SIZE && (
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load More</Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">No events found.</p>
              {hasFilters && (
                <Button variant="ghost" className="mt-2" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
