import { Layout } from "@/components/Layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          We only store the data needed for account access, ticket booking, and basic support.
          Personal information is not shared outside the system unless required for service use.
        </p>
      </div>
    </Layout>
  );
}