import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, Clock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import khaltiQR from "@/assets/khalti-qr.png";
import esewaQR from "@/assets/esewa-qr.png";

interface PaymentQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: "khalti" | "esewa";
  amount: number;
  numTickets: number;
  eventTitle: string;
  onConfirmPayment: () => Promise<void>;
}

const TIMEOUT_SECONDS = 300;

export function PaymentQRModal({
  open,
  onOpenChange,
  paymentMethod,
  amount,
  numTickets,
  eventTitle,
  onConfirmPayment,
}: PaymentQRModalProps) {
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [confirming, setConfirming] = useState(false);
  const [expired, setExpired] = useState(false);

  const merchantName = "TicketSanjal Pvt. Ltd.";
  const merchantId = paymentMethod === "khalti" ? "KHALTI-9800000000" : "ESEWA-9800000000";

  useEffect(() => {
    if (!open) {
      setTimeLeft(TIMEOUT_SECONDS);
      setExpired(false);
      setConfirming(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await onConfirmPayment();
    } finally {
      setConfirming(false);
    }
  }, [onConfirmPayment]);

  const isKhalti = paymentMethod === "khalti";
  const brandColor = isKhalti ? "hsl(271, 76%, 53%)" : "hsl(145, 63%, 42%)";
  const qrImage = isKhalti ? khaltiQR : esewaQR;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!confirming) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex items-center gap-3"
          style={{ background: brandColor }}
        >
          {isKhalti ? <Wallet className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
          <div>
            <h3 className="font-bold text-lg">Pay with {isKhalti ? "Khalti" : "eSewa"}</h3>
            <p className="text-sm opacity-90">Scan QR to complete payment</p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-3xl font-bold font-mono text-foreground">Rs. {amount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {numTickets} ticket{numTickets > 1 ? "s" : ""} • {eventTitle}
            </p>
          </div>

          {/* QR Code Image */}
          {!expired ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="rounded-xl border-2 border-border shadow-sm overflow-hidden bg-white">
                <img
                  src={qrImage}
                  alt={`${isKhalti ? "Khalti" : "eSewa"} Payment QR Code`}
                  className="w-64 h-auto object-contain"
                />
              </div>

              {/* Merchant info */}
              <div className="text-center text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">{merchantName}</p>
                <p>ID: {merchantId}</p>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`font-mono font-semibold ${timeLeft < 60 ? "text-destructive" : "text-muted-foreground"}`}>
                  Expires in {formatTime(timeLeft)}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Clock className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-semibold text-destructive">Payment Expired</p>
              <p className="text-sm text-muted-foreground">Please close and try again.</p>
            </div>
          )}

          {/* Instructions */}
          {!expired && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">How to pay:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your {isKhalti ? "Khalti" : "eSewa"} app</li>
                <li>Tap "Scan & Pay" or "QR Pay"</li>
                <li>Scan the QR code above</li>
                <li>Confirm payment of Rs. {amount}</li>
                <li>Click "I've Completed Payment" below</li>
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {!expired && (
              <Button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full h-12 text-base font-semibold text-white"
                style={{ background: brandColor }}
              >
                {confirming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    I've Completed Payment
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={confirming}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Secured by {isKhalti ? "Khalti" : "eSewa"} Payment Gateway
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
