import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";

export default function TermsPage() {
  const lastUpdated = "June 8, 2026";

  return (
    <>
      <PageHero
        title="Terms of Service"
        subtitle={`Last updated: ${lastUpdated}`}
        breadcrumbs={[{ name: "Terms of Service" }]}
      />

      <section className="w-full bg-background py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-brand-orange/5 border border-brand-orange/20">
            <FileText className="w-5 h-5 text-brand-orange shrink-0" />
            <p className="text-sm text-muted-foreground">
              Please read these Terms of Service carefully before using Kamzybot's Media. By accessing or using our platform, you agree to be bound by these terms.
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">

            <Section title="1. Acceptance of Terms">
              <p>By accessing and using Kamzybot's Media ("Platform", "we", "us", or "our"), you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our Platform.</p>
              <p>We reserve the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>
            </Section>

            <Section title="2. Nature of Products and Services">
              <p>Kamzybot's Media provides digital solutions and creative services for social media growth. Our offerings may include account services, content strategy guidance, growth consultation, and related digital products. All products and services are:</p>
              <ul>
                <li>Delivered digitally via your order dashboard immediately after payment</li>
                <li>Transferred "as-is" — we do not guarantee continued access beyond the point of delivery</li>
                <li>Non-physical — no physical item will be shipped</li>
                <li>Subject to the terms and policies of the respective social media platforms (Facebook, Instagram, Twitter/X, TikTok, LinkedIn, etc.)</li>
              </ul>
              <p>We make no representation that the use of purchased accounts complies with the terms of service of third-party social media platforms. You assume full responsibility for how you use any delivered credentials.</p>
            </Section>

            <Section title="3. Eligibility">
              <p>To use our Platform, you must:</p>
              <ul>
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into a binding contract</li>
                <li>Not be prohibited from using our Platform under any applicable law</li>
                <li>Provide accurate and truthful registration information</li>
              </ul>
            </Section>

            <Section title="4. Account Registration">
              <p>When you create an account, you agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized account use</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
              <p>We reserve the right to terminate accounts that violate these Terms or engage in fraudulent activity.</p>
            </Section>

            <Section title="5. Wallet and Payment">
              <p>KAMZYBOT'S MEDIA uses a pre-funded wallet system:</p>
              <ul>
                <li>All transactions are conducted in Nigerian Naira (NGN)</li>
                <li>Wallet funds may be added via Paystack (card, bank transfer, USSD) or Monify (crypto / alternative providers)</li>
                <li>Wallet funds are non-transferable between users</li>
                <li>We are not responsible for delays caused by payment processors or blockchain congestion</li>
                <li>Minimum top-up amount is ₦100</li>
              </ul>
            </Section>

            <Section title="6. No Refund Policy">
              <p>Due to the digital nature of our products, <strong>all sales are final</strong>. We do not offer refunds once credentials have been delivered to your account dashboard.</p>
              <p>Exceptions may be considered at our sole discretion in the following cases:</p>
              <ul>
                <li>Technical failure on our part that prevents credential delivery</li>
                <li>Duplicate charge due to a payment processing error</li>
              </ul>
              <p>To request an exception, contact our support team within 24 hours of purchase with full details. We do not refund for accounts that were subsequently banned or suspended by the third-party platform after delivery.</p>
            </Section>

            <Section title="7. Prohibited Activities">
              <p>You agree not to use the Platform to:</p>
              <ul>
                <li>Engage in fraud, money laundering, or any illegal activity</li>
                <li>Harass, threaten, or harm any individual or group</li>
                <li>Distribute spam, malware, or phishing content using purchased accounts</li>
                <li>Resell purchased credentials to minors</li>
                <li>Circumvent or attempt to reverse-engineer any part of our Platform</li>
                <li>Use automated bots or scrapers on our Platform</li>
                <li>Create multiple accounts to abuse promotional offers</li>
              </ul>
              <p>Violation of these prohibitions may result in immediate account suspension and forfeiture of any wallet balance.</p>
            </Section>

            <Section title="8. Intellectual Property">
              <p>All content on the KAMZYBOT'S MEDIA platform — including logos, text, graphics, and software — is owned by or licensed to KAMZYBOT'S MEDIA. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
            </Section>

            <Section title="9. Disclaimer of Warranties">
              <p>The Platform and all products are provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
              <p>We do not warrant that accounts purchased will remain active, that credentials will be accepted by the respective platforms, or that the Platform will be uninterrupted or error-free.</p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>To the maximum extent permitted by applicable law, KAMZYBOT'S MEDIA shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising out of or in connection with your use of the Platform.</p>
              <p>Our total cumulative liability to you shall not exceed the amount you paid for the specific product or service giving rise to the claim in the thirty (30) days preceding the claim.</p>
            </Section>

            <Section title="11. Indemnification">
              <p>You agree to indemnify, defend, and hold harmless KAMZYBOT'S MEDIA and its officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the Platform, your violation of these Terms, or your violation of any rights of another party.</p>
            </Section>

            <Section title="12. Governing Law">
              <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict-of-law provisions. Any disputes shall be resolved in the competent courts of Nigeria.</p>
            </Section>

            <Section title="13. Contact Us">
              <p>If you have questions or concerns about these Terms, please contact us:</p>
              <ul>
                <li><strong>Email:</strong> contact@kamzybotsmedia.com</li>
                <li><strong>Platform:</strong> <Link to="/contact" className="text-brand-orange hover:underline">Contact Form</Link></li>
              </ul>
            </Section>

          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link to="/privacy-policy" className="text-brand-orange hover:underline text-sm font-medium">
              View Privacy Policy →
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
