import { AdminLayout } from "@/components/AdminLayout";
import { EventForm } from "@/components/EventForm";

export default function AdminCreateConcert() {
  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Add Concert</h1>
        <EventForm redirectTo="/admin/concerts" />
      </div>
    </AdminLayout>
  );
}
