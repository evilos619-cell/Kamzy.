import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { name: string; to?: string }[];
}

export function PageHero({ title, subtitle, breadcrumbs = [] }: PageHeroProps) {
  return (
    <section
      className="relative w-full py-20 md:py-28 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, oklch(0.45 0.08 255) 0%, oklch(0.28 0.05 255) 60%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-brand-orange/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/70 max-w-2xl mx-auto mb-5">{subtitle}</p>
          )}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <Link to="/" className="flex items-center gap-1 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
                Home
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-white transition-colors">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="text-white">{crumb.name}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </motion.div>
      </div>
    </section>
  );
}
