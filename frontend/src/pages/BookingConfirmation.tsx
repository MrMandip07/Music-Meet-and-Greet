import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

import { CheckCircle, Calendar, Ticket, ArrowLeft, Copy, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import khaltiQr from "@/assets/khalti-qr.png";
import esewaQr from "@/assets/esewa-qr.png";

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();

  const stateData = location.state as {
    bookingId?: string;
    paymentReference?: string;
    paymentMethod?: string;
    totalAmount?: number;
    numTickets?: number;
    eventTitle?: string;
  } | null;

  const { data: booking } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, events(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const event = booking?.events as any;
  const eventTitle = stateData?.eventTitle || event?.title || "Event";
  const numTickets = stateData?.numTickets || booking?.num_tickets || 0;
  const totalAmount = stateData?.totalAmount || booking?.total_amount || 0;
  const paymentMethod = stateData?.paymentMethod || booking?.payment_method || "";
  const paymentReference = stateData?.paymentReference || booking?.payment_reference || "";
  const bookingId = id || stateData?.bookingId || "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-lg px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg bg-card p-8 shadow-elevated"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
              <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
            </motion.div>
            <h1 className="mt-3 text-2xl font-bold">Booking Confirmed!</h1>
            <p className="text-sm text-muted-foreground">Your tickets are ready</p>
          </div>

          {/* Payment QR Code */}
          {(paymentMethod === "khalti" || paymentMethod === "esewa") && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Paid via {paymentMethod === "khalti" ? "Khalti" : "eSewa"}
              </p>
              <div className={`rounded-lg border-2 p-3 ${paymentMethod === "khalti" ? "border-purple-300 bg-purple-50 dark:bg-purple-950/20" : "border-green-300 bg-green-50 dark:bg-green-950/20"}`}>
                <img
                  src={paymentMethod === "khalti" ? khaltiQr : esewaQr}
                  alt={`${paymentMethod} QR`}
                  className="h-44 w-44 rounded object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">Show this at the venue for entry</p>
            </div>
          )}

          {/* Ticket stub divider */}
          <div className="my-6 border-t border-dashed border-border" />

          {/* Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Event</p>
              <p className="font-semibold">{eventTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {event?.date && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {event?.time && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time.slice(0, 5)}
                  </p>
                </div>
              )}
            </div>

            {event?.venue_name && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Venue</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.venue_name}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tickets</p>
                <p className="font-mono font-semibold">{numTickets}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
                <p className="font-mono font-semibold text-primary">Rs. {totalAmount}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment</p>
              <p className="text-sm font-medium capitalize">{paymentMethod}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Reference</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">{paymentReference}</code>
                <button onClick={() => copyToClipboard(paymentReference)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Booking ID</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">{bookingId}</code>
                <button onClick={() => copyToClipboard(bookingId)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link to="/my-bookings">
                <Ticket className="mr-1 h-4 w-4" /> View My Tickets
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/events">
                <ArrowLeft className="mr-1 h-4 w-4" /> Browse More Events
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
