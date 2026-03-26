import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface PaymentResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: boolean;
  bookingId?: string;
  errorMessage?: string;
}

export function PaymentResultModal({ open, onOpenChange, success, bookingId, errorMessage }: PaymentResultModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          {success ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
        </motion.div>

        <h2 className="text-xl font-bold mt-2">
          {success ? "Payment Successful!" : "Payment Failed"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {success
            ? "Your tickets have been booked. Check your email for confirmation."
            : errorMessage || "Something went wrong. Please try again."}
        </p>

        <div className="flex flex-col gap-2 mt-4">
          {success && bookingId ? (
            <>
              <Button onClick={() => { onOpenChange(false); navigate(`/booking-confirmation/${bookingId}`); }}>
                View Booking
              </Button>
              <Button variant="outline" onClick={() => { onOpenChange(false); navigate("/my-bookings"); }}>
                My Bookings
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
