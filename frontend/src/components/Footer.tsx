// Simple footer used across the main website
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, MapPin, Mail, Phone, Twitter } from "lucide-react";

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
];

const usefulLinks = [
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Privacy Policy", to: "/privacy" },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-muted/20">
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_1fr] md:gap-10">
        <div>
          <Link to="/" className="text-lg font-bold">
            🎵 MeetGreet
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Simple online ticket booking for concerts and live events. Built for students,
            music fans, and local event organizers.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background transition-transform duration-200 hover:scale-105 ${
                  item.label === "Facebook"
                    ? "text-social-facebook"
                    : item.label === "Instagram"
                      ? "bg-gradient-to-br from-social-instagramStart/10 to-social-instagramEnd/10 text-social-instagramStart"
                      : item.label === "Twitter"
                        ? "text-social-twitter"
                        : "text-social-linkedin"
                }`}
              >
                <item.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Useful Links</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {usefulLinks.map((item) => (
              <div key={item.label}>
                <Link to={item.to} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Contact</h2>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Kathmandu, Nepal</span>
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <a href="tel:+9779800000000" className="hover:text-foreground hover:underline">
                +977 9800000000
              </a>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <a href="mailto:info@meetgreet.com" className="hover:text-foreground hover:underline">
                info@meetgreet.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MeetGreet</p>
          <p>Coursework project for concert booking and event management.</p>
        </div>
      </div>
    </footer>
  );
}