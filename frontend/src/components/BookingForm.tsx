import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, CreditCard, Wallet } from "lucide-react";
import { PaymentResultModal } from "@/components/PaymentResultModal";
import { PaymentQRModal } from "@/components/PaymentQRModal";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

interface BookingFormProps {
  event: Event;
  onClose: () => void;
}

export function BookingForm({ event, onClose }: BookingFormProps) {
  const [numTickets, setNumTickets] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"khalti" | "esewa">("khalti");
  const [showQR, setShowQR] = useState(false);
  const [resultModal, setResultModal] = useState<{ open: boolean; success: boolean; bookingId?: string; error?: string }>({
    open: false,
    success: false,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalAmount = event.price * numTickets;
  const maxTickets = Math.min(event.available_tickets, 10);

  const handlePayClick = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to book tickets.", variant: "destructive" });
      navigate("/login");
      return;
    }
    // Verify session is still valid before proceeding
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setShowQR(true);
  };

  const handleConfirmPayment = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("book_tickets", {
        p_event_id: event.id,
        p_num_tickets: numTickets,
        p_payment_method: paymentMethod,
        p_payment_reference: `${paymentMethod}-${Date.now()}`,
        p_user_id: user.id,
      });

      if (error) throw error;

      setShowQR(false);
      setResultModal({ open: true, success: true, bookingId: data as string });
    } catch (err: any) {
      setShowQR(false);
      setResultModal({ open: true, success: false, error: err.message || "Something went wrong." });
    }
  }, [user, event.id, numTickets, paymentMethod]);

  const handleResultClose = (open: boolean) => {
    setResultModal((s) => ({ ...s, open }));
    if (!open && resultModal.success && resultModal.bookingId) {
      onClose();
      navigate(`/booking-confirmation/${resultModal.bookingId}`);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Book Tickets</h3>
          <p className="text-sm text-muted-foreground">{event.title}</p>
        </div>

        {/* Ticket count */}
        <div className="space-y-2">
          <Label>Number of Tickets</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setNumTickets(Math.max(1, numTickets - 1))} disabled={numTickets <= 1}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-lg font-semibold font-mono">{numTickets}</span>
            <Button variant="outline" size="icon" onClick={() => setNumTickets(Math.min(maxTickets, numTickets + 1))} disabled={numTickets >= maxTickets}>
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">({event.available_tickets} available)</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("khalti")}
              className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                paymentMethod === "khalti"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Khalti
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("esewa")}
              className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                paymentMethod === "esewa"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              eSewa
            </button>
          </div>
        </div>

        {/* Price summary */}
        <div className="rounded-md bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price per ticket</span>
            <span className="font-mono">Rs. {event.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-mono">× {numTickets}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono text-primary">Rs. {totalAmount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handlePayClick} disabled={event.available_tickets === 0}>
            Pay Rs. {totalAmount}
          </Button>
        </div>
      </div>

      {/* Payment QR Modal */}
      <PaymentQRModal
        open={showQR}
        onOpenChange={setShowQR}
        paymentMethod={paymentMethod}
        amount={totalAmount}
        numTickets={numTickets}
        eventTitle={event.title}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Result Modal */}
      <PaymentResultModal
        open={resultModal.open}
        onOpenChange={handleResultClose}
        success={resultModal.success}
        bookingId={resultModal.bookingId}
        errorMessage={resultModal.error}
      />
    </>
  );
}
