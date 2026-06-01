import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Linkedin, Instagram, MapPin, Mail, Phone } from "lucide-react";
import { contactInfo } from "@/data/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const socials = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  ];

  return (
    <footer className="w-full bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold">
                SAMMY <span className="text-brand-orange">STORE</span>
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              A seamless and secure platform for buying and selling verified social
              media accounts.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-brand-navy-light flex items-center justify-center hover:bg-brand-orange transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Useful Links">
            <FooterLink to="/products">Products</FooterLink>
            <FooterLink to="/about">About Us</FooterLink>
            <FooterLink to="/contact">Register</FooterLink>
          </FooterCol>

          <FooterCol title="Resources">
            <FooterLink to="/blog">Blog</FooterLink>
            <FooterLink to="/contact">Contact Us</FooterLink>
            <FooterLink to="/about">Cookie Policy</FooterLink>
          </FooterCol>

          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">{contactInfo.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-white/70 hover:text-white transition-colors text-sm break-all"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a
                  href={`tel:${contactInfo.phoneRaw}`}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {contactInfo.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/60 text-sm">
              &copy; {year} Sammy Store Logs. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-sm text-white/60">
              <Link to="/about" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
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
      <Link
        to={to}
        className="text-white/70 hover:text-white transition-colors text-sm"
      >
        {children}
      </Link>
    </li>
  );
}
