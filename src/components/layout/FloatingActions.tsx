import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { contactInfo } from "@/data/site";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 left-4 sm:left-6 z-40 flex flex-col gap-2">
        <a
          href={contactInfo.whatsappGroup}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white text-brand-navy px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all border border-border text-sm font-medium"
        >
          <Users className="w-4 h-4 text-green-500" />
          Join Group
        </a>
        <a
          href={contactInfo.whatsappSupport}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white text-brand-navy px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all border border-border text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4 text-green-500" />
          Message Support
        </a>
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-4 sm:right-6 z-40 w-12 h-12 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full shadow-lg flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
