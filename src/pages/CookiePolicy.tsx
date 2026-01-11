import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import Footer from "@/components/landing/Footer";

const CookiePolicy = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Cookie Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm">Last Updated: January 11, 2026</p>
        
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website. 
            They are widely used to make websites work more efficiently and provide information 
            to website owners. Cookies help us improve your experience on Zoe RatedTV.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Cookies</h2>
          <p>We use cookies and similar technologies for several purposes:</p>
          
          <h3 className="text-lg font-medium text-foreground">2.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the Service to function properly. They enable core 
            functionality such as security, network management, and accessibility. You cannot 
            opt-out of these cookies.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentication and login status</li>
            <li>Security features</li>
            <li>Load balancing</li>
            <li>Session management</li>
          </ul>
          
          <h3 className="text-lg font-medium text-foreground">2.2 Performance Cookies</h3>
          <p>
            These cookies collect information about how you use our Service, such as which pages 
            you visit most often. This data helps us improve how our Service works.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Page load times</li>
            <li>Error messages</li>
            <li>User behavior analytics</li>
          </ul>
          
          <h3 className="text-lg font-medium text-foreground">2.3 Functionality Cookies</h3>
          <p>
            These cookies allow our Service to remember choices you make and provide enhanced, 
            personalized features.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Language preferences</li>
            <li>Playback settings</li>
            <li>User preferences</li>
            <li>Recently watched content</li>
          </ul>
          
          <h3 className="text-lg font-medium text-foreground">2.4 Targeting/Advertising Cookies</h3>
          <p>
            These cookies are used to deliver advertisements more relevant to you and your interests. 
            They may also be used to limit the number of times you see an advertisement and measure 
            the effectiveness of advertising campaigns.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">3. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third-party services that appear on our pages. We do not 
            control the use of these cookies. Third parties that may set cookies include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Analytics providers (e.g., Google Analytics)</li>
            <li>Advertising networks</li>
            <li>Social media platforms</li>
            <li>Payment processors</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">4. Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View cookies stored on your device</li>
            <li>Delete all or specific cookies</li>
            <li>Block all cookies or third-party cookies</li>
            <li>Set preferences for certain websites</li>
          </ul>
          <p>
            Please note that disabling cookies may affect the functionality of our Service. Some 
            features may not work properly without cookies.
          </p>
          
          <h3 className="text-lg font-medium text-foreground">Browser Settings</h3>
          <p>To manage cookies in popular browsers:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">5. Similar Technologies</h2>
          <p>In addition to cookies, we may use similar technologies such as:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Local Storage:</strong> Stores data in your browser for a longer period</li>
            <li><strong>Session Storage:</strong> Stores data for the duration of your session</li>
            <li><strong>Pixel Tags:</strong> Small graphics used for tracking and analytics</li>
            <li><strong>Device Fingerprinting:</strong> Collecting device characteristics for identification</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for operational, legal, or regulatory reasons. We will notify you of any material 
            changes by updating the "Last Updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at:
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

export default CookiePolicy;
