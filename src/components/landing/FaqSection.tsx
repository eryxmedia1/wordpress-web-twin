
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface FaqSectionProps {
  email: string;
  setEmail: (email: string) => void;
}

// FAQ data
const faqs = [
  {
    question: "What is Zoe RatedTV?",
    answer: "Zoe RatedTV is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices."
  },
  {
    question: "How much does Zoe RatedTV cost?",
    answer: "Watch Zoe RatedTV on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $0 to $14.99 a month. No extra costs, no contracts."
  },
  {
    question: "Where can I watch?",
    answer: "Watch anywhere, anytime. Sign in with your Zoe RatedTV account to watch instantly on the web at zoeratedtv.com from your personal computer or on any internet-connected device that offers the Zoe RatedTV app."
  },
  {
    question: "How do I cancel?",
    answer: "Zoe RatedTV is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime."
  },
  {
    question: "What can I watch on Zoe RatedTV?",
    answer: "Zoe RatedTV has an extensive library of feature films, documentaries, TV shows, anime, award-winning Zoe RatedTV originals, and more. Watch as much as you want, anytime you want."
  }
];

const FaqSection = ({ email, setEmail }: FaqSectionProps) => {
  return (
    <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#222] rounded">
              <button className="w-full p-6 text-left text-xl flex justify-between items-center">
                {faq.question}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        <p className="text-xl mt-12 mb-6 text-center">Ready to watch? Enter your email to create or restart your membership.</p>
        
        <div className="flex flex-col md:flex-row gap-2 max-w-lg mx-auto">
          <input 
            type="email" 
            placeholder="Email address" 
            className="flex-1 p-4 text-black rounded-md focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Link to="/signup" className="whitespace-nowrap">
            <Button className="w-full md:w-auto bg-[#e50914] hover:bg-[#f6121d] text-white font-semibold text-lg py-6 px-6 rounded-md">
              Get Started <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
