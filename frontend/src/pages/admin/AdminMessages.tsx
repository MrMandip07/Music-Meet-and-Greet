// Admin message page for replying to user support messages
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-chat-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data.map((item) => item.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((profile) => {
        profileMap[profile.id] = profile.full_name || "Unknown user";
      });

      return data.map((item) => ({
        ...item,
        user_name: profileMap[item.user_id] || "Unknown user",
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const replyCount = useMemo(
    () => messages?.filter((item) => item.admin_reply && item.admin_reply.trim()).length || 0,
    [messages]
  );

  const handleSaveReply = async (id: string) => {
    const reply = (drafts[id] ?? "").trim();
    if (!reply) return;

    setSavingId(id);
    const { error } = await supabase.from("chat_messages").update({ admin_reply: reply }).eq("id", id);
    setSavingId(null);

    if (error) {
      toast({ title: "Reply failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Reply saved" });
    queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">User Messages</h1>
          <p className="text-sm text-muted-foreground">Read messages from users and send a simple reply.</p>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          Total messages: <span className="font-semibold text-foreground">{messages?.length || 0}</span>
          <span className="mx-2">•</span>
          Replied: <span className="font-semibold text-foreground">{replyCount}</span>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading messages...</p>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{item.user_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">User ID: {item.user_id}</p>
              </div>

              <div className="mt-3 rounded-md bg-muted/40 px-3 py-3 text-sm">
                <p>{item.message}</p>
              </div>

              {item.admin_reply && (
                <div className="mt-3 rounded-md border px-3 py-3 text-sm">
                  <p className="font-medium">Current reply</p>
                  <p className="mt-1 text-muted-foreground">{item.admin_reply}</p>
                </div>
              )}

              <div className="mt-3 space-y-2">
                <Textarea
                  value={drafts[item.id] ?? item.admin_reply ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Write a short reply"
                  className="min-h-24 resize-none"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => handleSaveReply(item.id)} disabled={savingId === item.id}>
                    {savingId === item.id ? "Saving..." : "Save Reply"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No user messages yet.
        </div>
      )}
    </AdminLayout>
  );
}