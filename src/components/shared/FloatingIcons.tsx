import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Youtube } from "lucide-react";

const icons = [
  { Icon: Facebook, color: "text-blue-600", bg: "bg-blue-100", pos: "top-[10%] left-[5%]", delay: 0 },
  { Icon: Instagram, color: "text-pink-600", bg: "bg-pink-100", pos: "top-[68%] left-[8%]", delay: 0.2 },
  { Icon: Twitter, color: "text-sky-500", bg: "bg-sky-100", pos: "top-[15%] right-[8%]", delay: 0.4 },
  { Icon: Linkedin, color: "text-blue-700", bg: "bg-blue-100", pos: "top-[75%] left-[22%]", delay: 0.6 },
  { Icon: Mail, color: "text-red-500", bg: "bg-red-100", pos: "top-[22%] left-[14%]", delay: 0.8 },
  { Icon: Youtube, color: "text-red-600", bg: "bg-red-100", pos: "top-[62%] right-[6%]", delay: 1 },
];

export function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, color, bg, pos, delay }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.5, type: "spring" }}
          className={`absolute ${pos} hidden sm:block`}
        >
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay }}
            className={`w-12 h-12 md:w-14 md:h-14 ${bg} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Icon className={`w-6 h-6 md:w-7 md:h-7 ${color}`} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
