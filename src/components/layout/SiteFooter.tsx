import { Link } from "react-router-dom";
import { Facebook, MapPin, Mail, Phone, MessageCircle, Send, Users } from "lucide-react";
import { contactInfo } from "@/data/site";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.28 8.28 0 0 0 4.84 1.55V6.82a4.85 4.85 0 0 1-1.07-.13z"/>
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  const socials = [
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61590741410137", label: "Facebook" },
    { icon: TikTokIcon, href: "https://www.tiktok.com/@o.n.l.y.s.a.m.m.y?_r=1&_t=ZS-96sJydYpfHh", label: "TikTok" },
  ];

  const community = [
    { icon: MessageCircle, href: contactInfo.whatsappSupport, label: "WhatsApp Support", color: "text-green-400" },
    { icon: Users, href: contactInfo.whatsappGroup, label: "WhatsApp Community", color: "text-green-400" },
    { icon: Send, href: contactInfo.telegramSupport, label: "Telegram Support", color: "text-sky-400" },
    { icon: Send, href: contactInfo.telegramChannel, label: "Telegram Channel", color: "text-sky-400" },
  ];

  return (
    <footer className="w-full bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold">KAMZYBOT'S <span className="text-brand-orange">MEDIA</span></span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              Digital solutions and creative services for social media growth. Professional strategies tailored to your success.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Useful Links">
            <FooterLink to="/products">Products</FooterLink>
            <FooterLink to="/about">About Us</FooterLink>
            <FooterLink to="/blog">Blog</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/dashboard">Dashboard</FooterLink>
            <FooterLink to="/terms">Terms of Service</FooterLink>
            <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
          </FooterCol>

          <div>
            <FooterHeading>Community</FooterHeading>
            <ul className="space-y-3 mt-6">
              {community.map(({ icon: Icon, href, label, color }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors text-sm group">
                    <Icon className={`w-4 h-4 ${color} shrink-0`} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">{contactInfo.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a href={`mailto:${contactInfo.email}`} className="text-white/70 hover:text-white transition-colors text-sm break-all">{contactInfo.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a href={`tel:${contactInfo.phoneRaw}`} className="text-white/70 hover:text-white transition-colors text-sm">{contactInfo.phone}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/60 text-sm">&copy; {year} Kamzybot's Media. All rights reserved.</p>
            <div className="flex items-center gap-5 text-sm text-white/60">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold relative inline-block">
      {children}
      <span className="absolute -bottom-2 left-0 w-10 h-0.5 bg-brand-orange" />
    </h3>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className="space-y-3 mt-6">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-white/70 hover:text-white transition-colors text-sm">{children}</Link>
    </li>
  );
}
