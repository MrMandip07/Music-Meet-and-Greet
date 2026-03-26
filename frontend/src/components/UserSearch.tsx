import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${query}%`)
        .limit(5);

      if (profiles) {
        const withRoles = await Promise.all(
          profiles.map(async (p) => {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", p.id);
            return { ...p, roles: roleData?.map((r) => r.role) || [] };
          })
        );
        setResults(withRoles);
        setOpen(true);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

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
          placeholder="Search users..."
          className="h-9 w-[200px] pl-8 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-[280px] rounded-md border bg-card p-1 shadow-elevated">
          {results.map((r) => (
            <button
              key={r.id}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              onClick={() => { setOpen(false); setQuery(""); }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {r.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{r.full_name || "Unknown"}</p>
                <div className="flex gap-1 mt-0.5">
                  {r.roles.map((role) => (
                    <span key={role} className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${roleColor(role)}`}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
