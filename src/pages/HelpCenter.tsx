import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ExpandingSidebar from "@/components/ExpandingSidebar";
import MobileLayout from "@/components/mobile/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Mail, MessageCircle, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const HelpCenter = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time by going to Account > Membership & Billing > Cancel Subscription. Your access will continue until the end of your current billing period.",
    },
    {
      question: "How do I change my password?",
      answer: "To change your password, go to Account > Security > Change Password. You'll need to enter your current password and then your new password twice to confirm.",
    },
    {
      question: "How do I add or remove profiles?",
      answer: "You can manage profiles by clicking on your profile icon and selecting 'Manage Profiles'. From there, you can add new profiles or edit/delete existing ones.",
    },
    {
      question: "Why isn't my video playing?",
      answer: "Video playback issues can be caused by slow internet connections, browser compatibility, or device issues. Try refreshing the page, clearing your browser cache, or switching to a different browser.",
    },
    {
      question: "How do I download videos for offline viewing?",
      answer: "Offline downloads are available on our mobile app for Premium subscribers. Open the app, find the content you want to download, and tap the download icon.",
    },
    {
      question: "How do I upgrade my subscription?",
      answer: "Go to Account > Manage Subscription to view available plans. Select the plan you want to upgrade to and follow the prompts to complete the upgrade.",
    },
    {
      question: "What devices can I use to watch Zoe RatedTV?",
      answer: "Zoe RatedTV works on most modern web browsers, iOS and Android devices, smart TVs, and streaming devices. Visit our supported devices page for a complete list.",
    },
    {
      question: "How do I report a problem with content?",
      answer: "If you encounter any issues with content, you can report it by clicking the 'Report' button on the content details page or by contacting our support team.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contactOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      action: () => {
        window.location.href = "mailto:support@zoeratedtv.com";
      },
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: () => toast.info("Live chat coming soon"),
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for immediate help",
      action: () => toast.info("Phone support: 1-800-ZOE-RATD"),
    },
  ];

  const content = (
    <div className="min-h-screen bg-background">
      {!isMobile && (
        <>
          <Navbar />
          <ExpandingSidebar />
        </>
      )}

      <main className={`${isMobile ? 'pt-4 px-4 pb-24' : 'pt-24 pl-20 pr-6 md:pl-24 md:pr-8'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
          <p className="text-muted-foreground mb-8">
            Find answers to common questions or contact our support team
          </p>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* FAQs */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card/50 border border-border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-foreground hover:text-primary text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No results found. Try a different search term.
              </p>
            )}
          </div>

          {/* Contact Options */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Contact Support
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {contactOptions.map((option) => (
                <Card
                  key={option.title}
                  className="bg-card/50 border-border hover:bg-card/70 transition-colors cursor-pointer"
                  onClick={option.action}
                >
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <option.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Back to Account */}
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link to="/account">Back to Account</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return content;
};

export default HelpCenter;
