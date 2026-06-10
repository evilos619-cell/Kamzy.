import { motion } from "framer-motion";
import { Check, Shield, Users, Zap, Target, Clock } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";

const benefits = [
  { icon: Shield, title: "Verified Accounts", description: "Every account is thoroughly authenticated before listing." },
  { icon: Users, title: "Trusted Community", description: "Join thousands of satisfied customers across the world." },
  { icon: Zap, title: "Instant Delivery", description: "Get immediate access via our streamlined transfer process." },
  { icon: Target, title: "Targeted Audience", description: "Match accounts to your niche and target demographics." },
  { icon: Clock, title: "24/7 Support", description: "Our team is available around the clock to assist you." },
  { icon: Check, title: "Secure Transactions", description: "Safe escrow-style handovers protect every purchase." },
];

const features = [
  "Instant Credibility",
  "Targeted Audience",
  "Save Time and Effort",
  "Strategic Expansion",
  "Secure Transactions",
  "Verified Accounts",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Us"
        subtitle="A trusted marketplace for verified social media accounts."
        breadcrumbs={[{ name: "About" }]}
      />

      <section className="w-full bg-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <img src="/images/about-promo.svg" alt="Kamzybot's Media" className="w-full h-auto object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-orange/15 rounded-full -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-navy/10 rounded-full -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-6"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-navy leading-tight tracking-tight">
                Unlock the power of professional digital solutions and social media growth.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Social media is essential for individuals, businesses, and influencers alike. Growing your presence organically takes time — Kamzybot's Media provides expert creative services, strategic guidance, and proven solutions to accelerate your success.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We offer comprehensive digital solutions across all major platforms, with transparency, authentic engagement strategies, and dedicated support at every step of your growth journey.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-foreground font-medium text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="w-full bg-muted/40 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3 tracking-tight">Why choose us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A complete solution for your social media account needs.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-border"
              >
                <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-brand-orange" />
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
