import { Layout } from "@/components/Layout";
import { EventForm } from "@/components/EventForm";

export default function CreateEvent() {
  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Create Event</h1>
        <EventForm />
      </div>
    </Layout>
  );
}
