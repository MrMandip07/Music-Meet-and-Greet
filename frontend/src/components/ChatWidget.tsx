// Small support chat for logged in users
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function ChatWidget() {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat-messages", user?.id],
    enabled: open && !!user && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-widget-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient, user]);

  const handleSend = async () => {
    if (!user) return;

    const message = draft.trim();
    if (!message) return;

    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      message,
    });

    setSending(false);

    if (error) {
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
      return;
    }

    setDraft("");
    queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id] });
  };

  if (!user || isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5">
      <div
        className={`mb-3 origin-bottom-right rounded-xl border bg-chat-panel shadow-sm transition-all duration-300 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        } w-[calc(100vw-2rem)] max-w-[460px] sm:w-[460px]`}
      >
        <div className="flex items-center justify-between border-b bg-chat-header px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Support Chat</h2>
            <p className="text-sm text-muted-foreground">Send your message to the admin team.</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] min-h-[300px] space-y-4 overflow-y-auto bg-chat-panel px-4 py-4 sm:min-h-[360px] sm:px-5 sm:py-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          ) : messages && messages.length > 0 ? (
            messages.map((item) => (
              <div key={item.id} className="space-y-2 animate-fade-in">
                <div className="rounded-lg border bg-chat-bubble px-4 py-3 text-sm shadow-sm">
                  <p className="leading-6">{item.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {item.admin_reply && (
                  <div className="ml-6 rounded-lg border bg-chat-reply px-4 py-3 text-sm">
                    <p className="font-medium">Admin reply</p>
                    <p className="mt-1 leading-6 text-foreground">{item.admin_reply}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-dashed bg-background/70 px-6 text-center text-sm text-muted-foreground sm:min-h-[280px]">
              No messages yet. Start the conversation here.
            </div>
          )}
        </div>

        <div className="border-t bg-background px-4 py-4 sm:px-5">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your message here"
            className="min-h-28 resize-none bg-chat-bubble sm:min-h-36"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSend} disabled={sending || !draft.trim()}>
              <Send className="mr-1 h-4 w-4" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={() => setOpen((value) => !value)} className="h-12 rounded-full px-5 shadow-sm">
        <MessageCircle className="mr-2 h-4 w-4" />
        {open ? "Close" : "Chat"}
      </Button>
    </div>
  );
}