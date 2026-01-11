import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm">Last Updated: January 11, 2026</p>
        
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p>
            Welcome to Zoe RatedTV ("we," "our," or "us"). We are committed to protecting your privacy 
            and personal information. This Privacy Policy explains how we collect, use, disclose, and 
            safeguard your information when you use our streaming service, website, and mobile applications.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-foreground">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (name, email address, password)</li>
            <li>Payment and billing information</li>
            <li>Profile information (avatar, preferences)</li>
            <li>Communication preferences</li>
          </ul>
          
          <h3 className="text-lg font-medium text-foreground">2.2 Usage Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Viewing history and preferences</li>
            <li>Search queries</li>
            <li>Device information and identifiers</li>
            <li>IP address and location data</li>
            <li>Browser type and operating system</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and personalize our streaming service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Recommend content based on your preferences</li>
            <li>Communicate with you about your account and service updates</li>
            <li>Improve our services and develop new features</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">4. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers who assist in operating our platform</li>
            <li>Payment processors for billing purposes</li>
            <li>Analytics providers to improve our services</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. However, 
            no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">7. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect personal 
            information from children under 13. If you believe we have collected such information, 
            please contact us immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: privacy@zoeratedtv.com<br />
            Address: Zoe RatedTV, Privacy Team<br />
            Phone: 1-800-555-5555
          </p>
        </section>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout>
        {content}
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ExpandingSidebar />
      <div className="pl-16 pt-16">
        {content}
        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
