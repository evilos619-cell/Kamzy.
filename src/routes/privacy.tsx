import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";

export default function PrivacyPage() {
  const lastUpdated = "June 8, 2026";

  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle={`Last updated: ${lastUpdated}`}
        breadcrumbs={[{ name: "Privacy Policy" }]}
      />

      <section className="w-full bg-background py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-green-50 border border-green-200">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Kamzybot's Media is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our Platform.
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">

            <Section title="1. Who We Are">
              <p>Kamzybot's Media ("we", "us", or "our") operates a digital solutions and creative services platform where users can access professional social media growth strategies and related digital services. We are committed to processing your personal data lawfully, fairly, and transparently.</p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We collect information you provide directly to us and information generated through your use of the Platform:</p>

              <p><strong>Account Information:</strong></p>
              <ul>
                <li>Email address and display name (required for account creation)</li>
                <li>Phone number (optional, for profile)</li>
                <li>Password (stored securely via Supabase Auth — never in plain text)</li>
              </ul>

              <p><strong>Transaction and Payment Data:</strong></p>
              <ul>
                <li>Wallet balance and transaction history</li>
                <li>Payment references and amounts (Paystack / Monify)</li>
                <li>Order history and delivered credentials</li>
              </ul>

              <p><strong>Technical Data (collected automatically):</strong></p>
              <ul>
                <li>IP address and browser/device type</li>
                <li>Pages visited and time spent on site</li>
                <li>Referrer URL and session identifiers</li>
              </ul>

              <p>We do not collect full card numbers or cryptocurrency private keys. Payment processing is handled by Paystack and Monify (or other selected providers), each governed by their own privacy policies.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Create and manage your user account</li>
                <li>Process wallet top-ups and purchases</li>
                <li>Deliver purchased credentials to your dashboard</li>
                <li>Send order confirmations and important account notifications</li>
                <li>Detect, investigate, and prevent fraud or abuse</li>
                <li>Improve and optimize our Platform</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do <strong>not</strong> sell your personal data to third parties, nor use it for unsolicited marketing without your consent.</p>
            </Section>

            <Section title="4. Legal Basis for Processing">
              <p>We process your personal data on the following legal grounds:</p>
              <ul>
                <li><strong>Contract performance</strong> — to fulfil your orders and deliver products</li>
                <li><strong>Legitimate interests</strong> — to operate, maintain, and secure the Platform</li>
                <li><strong>Legal obligation</strong> — to comply with applicable Nigerian and international laws</li>
                <li><strong>Consent</strong> — for any optional communications you opt into</li>
              </ul>
            </Section>

            <Section title="5. Third-Party Services">
              <p>We use the following trusted third-party services to operate the Platform:</p>
              <ul>
                <li><strong>Supabase</strong> — database, authentication, and file storage. Data is stored on EU/US servers with encryption at rest and in transit.</li>
                <li><strong>Paystack</strong> — payment processing for Nigerian Naira transactions. Governed by <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer">Paystack's Privacy Policy</a>.</li>
                <li><strong>Monify</strong> — cryptocurrency and alternative payment processing (where used). Governed by the provider's privacy policy.</li>
                <li><strong>Cloudflare</strong> — CDN, DDoS protection, and edge functions. Governed by <a href="https://cloudflare.com/privacy" target="_blank" rel="noopener noreferrer">Cloudflare's Privacy Policy</a>.</li>
              </ul>
              <p>Each third-party service processes only the data necessary to provide their specific service to us.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>We retain your personal data for as long as your account is active or as needed to provide services. Specifically:</p>
              <ul>
                <li>Account data: retained for the lifetime of your account, then deleted within 30 days of account closure</li>
                <li>Transaction and order records: retained for 7 years for financial compliance purposes</li>
                <li>Activity logs: retained for 12 months for security purposes</li>
              </ul>
              <p>Delivered credential data (stored in order items) is retained permanently as your purchase receipt.</p>
            </Section>

            <Section title="7. Data Security">
              <p>We implement appropriate technical and organisational measures to protect your personal data against accidental loss, destruction, alteration, and unauthorised access or disclosure. These measures include:</p>
              <ul>
                <li>TLS/HTTPS encryption for all data in transit</li>
                <li>Row-Level Security (RLS) on all database tables — users can only access their own data</li>
                <li>Bcrypt-hashed passwords via Supabase Auth</li>
                <li>Service-role keys restricted to server-side code only</li>
                <li>Secure secret management via environment variables</li>
              </ul>
              <p>Despite these measures, no system is 100% secure. If you believe your account has been compromised, contact us immediately.</p>
            </Section>

            <Section title="8. Cookies and Tracking">
              <p>We use essential cookies and browser local storage to:</p>
              <ul>
                <li>Maintain your authentication session</li>
                <li>Remember your preferences</li>
                <li>Protect against cross-site request forgery (CSRF)</li>
              </ul>
              <p>We do not use third-party advertising cookies or tracking pixels. You may disable cookies in your browser settings, but this will prevent you from logging in to the Platform.</p>
            </Section>

            <Section title="9. Your Rights">
              <p>Under the Nigeria Data Protection Act (NDPA) and related regulations, you have the right to:</p>
              <ul>
                <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                <li><strong>Rectification</strong> — request correction of inaccurate personal data</li>
                <li><strong>Erasure</strong> — request deletion of your personal data, subject to legal retention requirements</li>
                <li><strong>Restriction</strong> — request that we limit how we process your data</li>
                <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format</li>
                <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
                <li><strong>Withdraw consent</strong> — where processing is based on your consent</li>
              </ul>
              <p>To exercise any of these rights, contact us at the details below. We will respond within 30 days.</p>
            </Section>

            <Section title="10. Children's Privacy">
              <p>Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. If we discover that a minor has registered, we will promptly delete their account and associated data.</p>
            </Section>

            <Section title="11. International Data Transfers">
              <p>Your data may be processed in countries outside Nigeria (including the United States and European Union) by our third-party service providers. We ensure that adequate safeguards are in place for such transfers, in compliance with applicable data protection laws.</p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. For significant changes, we will notify you via email or a prominent notice on the Platform. Your continued use of the Platform after changes constitutes acceptance of the updated Policy.</p>
            </Section>

            <Section title="13. Contact Us">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              <ul>
                <li><strong>Email:</strong> contact@kamzybotsmedia.com</li>
                <li><strong>Platform:</strong> <Link to="/contact" className="text-brand-orange hover:underline">Contact Form</Link></li>
              </ul>
            </Section>

          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link to="/terms" className="text-brand-orange hover:underline text-sm font-medium">
              View Terms of Service →
            </Link>
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-navy transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Home
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-brand-navy border-l-4 border-brand-orange pl-3">{title}</h2>
      <div className="text-[15px] leading-relaxed text-muted-foreground space-y-3 [&_strong]:text-brand-navy [&_a]:text-brand-orange [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
