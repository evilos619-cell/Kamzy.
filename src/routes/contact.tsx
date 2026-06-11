import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle, Users } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contactInfo } from "@/data/site";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contacts = [
    { icon: Mail, label: "Email", value: contactInfo.email, href: `mailto:${contactInfo.email}` },
    { icon: Phone, label: "Call Line", value: contactInfo.phone, href: `tel:${contactInfo.phoneRaw}` },
    { icon: MessageCircle, label: "WhatsApp", value: contactInfo.whatsappNumber, href: contactInfo.whatsappSupport },
    { icon: Users, label: "WhatsApp Community", value: "Join our community", href: contactInfo.whatsappGroup },
    { icon: TelegramIcon, label: "Telegram", value: "@Kamzybotsmedia", href: contactInfo.telegramSupport },
    { icon: TelegramIcon, label: "Telegram Channel", value: "@kamzybotsmedia01", href: contactInfo.telegramChannel },
    { icon: MapPin, label: "Location", value: contactInfo.location },
  ];

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We're here to help — reach out any time."
        breadcrumbs={[{ name: "Contact" }]}
      />
      <section className="w-full bg-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="bg-muted/40 rounded-2xl p-6 border border-border">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h3 className="text-base font-semibold text-brand-navy mb-1">{label}</h3>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-brand-orange transition-colors text-sm break-all">
                      {value}
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-sm">{value}</p>
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <form
                onSubmit={handleSubmit}
                className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border space-y-5"
              >
                {submitted && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Thanks! Your message has been sent. We'll be in touch shortly.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field id="name" label="Name" value={formData.name} onChange={handleChange} placeholder="Your name" />
                  <Field id="email" label="Email" type="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" />
                </div>
                <Field id="subject" label="Subject" value={formData.subject} onChange={handleChange} placeholder="What's this about?" />
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-brand-navy font-medium">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us what you need…"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="border-border focus-visible:ring-brand-orange/30 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white h-12 font-semibold">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ id, label, value, onChange, placeholder, type = "text" }: {
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-brand-navy font-medium">{label}</Label>
      <Input id={id} name={id} type={type} placeholder={placeholder} value={value}
        onChange={onChange} required className="border-border focus-visible:ring-brand-orange/30 h-11" />
    </div>
  );
}
