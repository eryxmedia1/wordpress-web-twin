import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm">Last Updated: January 11, 2026</p>
        
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Zoe RatedTV's streaming service, website, and mobile applications 
            (collectively, the "Service"), you agree to be bound by these Terms of Service. If you 
            do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p>
            Zoe RatedTV provides a subscription-based streaming service that allows members to access 
            movies, TV shows, and other content over the Internet on compatible devices. The content 
            available may vary by geographic location and is subject to change.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">3. Membership and Billing</h2>
          <h3 className="text-lg font-medium text-foreground">3.1 Membership</h3>
          <p>
            Your membership will continue until terminated. To use the Service, you must have Internet 
            access and a compatible device, and provide a current, valid payment method.
          </p>
          
          <h3 className="text-lg font-medium text-foreground">3.2 Billing Cycle</h3>
          <p>
            The membership fee for the Service will be charged on a recurring basis according to your 
            chosen plan. You authorize us to charge your payment method automatically.
          </p>
          
          <h3 className="text-lg font-medium text-foreground">3.3 Cancellation</h3>
          <p>
            You can cancel your membership at any time through your account settings. Cancellation 
            will be effective at the end of your current billing period.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">4. Use of Service</h2>
          <h3 className="text-lg font-medium text-foreground">4.1 License</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to access and view content 
            through the Service for personal, non-commercial use only.
          </p>
          
          <h3 className="text-lg font-medium text-foreground">4.2 Restrictions</h3>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Copy, distribute, or share content from the Service</li>
            <li>Circumvent any content protection or access controls</li>
            <li>Use the Service for commercial purposes</li>
            <li>Share your account credentials with others</li>
            <li>Use automated systems to access the Service</li>
            <li>Attempt to harm or disrupt the Service</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">5. Content</h2>
          <h3 className="text-lg font-medium text-foreground">5.1 Availability</h3>
          <p>
            Content available through the Service may change from time to time. We do not guarantee 
            that any specific content will be available or remain available.
          </p>
          
          <h3 className="text-lg font-medium text-foreground">5.2 Ratings and Warnings</h3>
          <p>
            We provide content ratings and warnings. You are responsible for ensuring that content 
            is appropriate for all viewers using your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">6. User Profiles</h2>
          <p>
            Your account may include multiple user profiles. You are responsible for all activity 
            that occurs under your account and profiles.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">7. Intellectual Property</h2>
          <p>
            The Service and all content, features, and functionality are owned by Zoe RatedTV, its 
            licensors, or other content providers and are protected by copyright, trademark, and 
            other intellectual property laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
            ERROR-FREE, OR FREE OF VIRUSES.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZOE RATEDTV SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR 
            USE OF THE SERVICE.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the 
            jurisdiction in which Zoe RatedTV operates, without regard to conflict of law principles.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of any 
            material changes by posting the new Terms on the Service. Your continued use of the 
            Service after such changes constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">12. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at:
          </p>
          <p>
            Email: legal@zoeratedtv.com<br />
            Address: Zoe RatedTV, Legal Department<br />
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

export default TermsOfService;
