import { Layout } from "@/components/Layout";

export default function Contact() {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Contact Us</h1>
        <div className="mt-4 space-y-3 text-muted-foreground">
          <p>Itahari, Nepal</p>
          <p>Phone: +977 9816033341</p>
          <p>Email: info@meetgreet.com</p>
        </div>
      </div>
    </Layout>
  );
}