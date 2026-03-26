import { useQuery } from "@tanstack/react-query";
import { Github, Linkedin } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
// card import removed – using simple list layout now
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDeveloperPlaceholder } from "@/lib/developerPlaceholders";

type DeveloperCard = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  display_order: number;
};

import mandipImg from "../assets/developers/mandip.png";
import snehaImg from "../assets/developers/sneha.png";
import sujanImg from "../assets/developers/sujan.png";
import prayashImg from "../assets/developers/prayash.png";
import pemaImg from "../assets/developers/pema.png"; 
type DeveloperCard = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  display_order: number;
};

const fallbackDevelopers: DeveloperCard[] = [
  {
    id: "mandip",
    name: "Mandip",
    role: "Full Stack Developer (Team Leader)",
    bio: "Worked across frontend and backend and helped keep the system connected.",
    image_url: mandipImg,
    github_url: null,
    linkedin_url: null,
    display_order: 0,
  },
  {
    id: "sneha",
    name: "Sneha",
    role: "Frontend Developer",
    bio: "Focused on page layouts, responsive design, and improving user experience.",
    image_url: snehaImg,
    github_url: null,
    linkedin_url: null,
    display_order: 1,
  },
  {
    id: "sujan",
    name: "Sujan",
    role: "Backend Developer",
    bio: "Handled database tasks, backend logic, and data flow.",
    image_url: sujanImg,
    github_url: null,
    linkedin_url: null,
    display_order: 2,
  },
  {
    id: "prayash",
    name: "Prayash",
    role: "UI/UX Designer",
    bio: "Improved page structure, spacing, and overall presentation.",
    image_url: prayashImg,
    github_url: null,
    linkedin_url: null,
    display_order: 3,
  },
  {
  id: "pema",
  name: "Pema",
  role: "QA / Tester",
  bio: "Tested booking flow, login flow, and dashboard screens for reliability.",
  image_url: pemaImg, 
  github_url: null,
  linkedin_url: null,
  display_order: 4,
},
];

export default function About() {
  const { data: developers = fallbackDevelopers } = useQuery({
    queryKey: ["about-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, role, bio, image_url, github_url, linkedin_url, display_order")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return ((data as DeveloperCard[]) || []).filter((item) => item.name && item.role && item.bio);
    },
  });

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">About Us</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            This project was built as a practical concert booking system for browsing events,
            booking tickets online, and giving the admin side a simple way to manage banners,
            concerts, and user support.
          </p>
          <p className="mt-3 leading-7 text-muted-foreground">
            Below is the development team behind the project and the areas each member helped with.
          </p>
        </div>

        {/* Developer list in box cards */}
        <div className="mt-8 space-y-6">
          {developers.map((developer, index) => (
            <div key={developer.id} className="rounded-xl border-2 bg-card p-8 shadow-md">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-28 w-28 rounded-full border-2 shadow-sm">
                  <AvatarImage
                    src={developer.image_url || getDeveloperPlaceholder(developer.name, index)}
                    alt={developer.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold">{developer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <h2 className="mt-4 text-xl font-bold">{developer.name}</h2>
                <p className="mt-1 text-sm font-semibold text-primary">{developer.role}</p>
                <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{developer.bio}</p>

                <div className="mt-4 flex items-center gap-3">
                  {developer.github_url && (
                    <a
                      href={developer.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted"
                      aria-label={`${developer.name} GitHub`}
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {developer.linkedin_url && (
                    <a
                      href={developer.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted"
                      aria-label={`${developer.name} LinkedIn`}
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}