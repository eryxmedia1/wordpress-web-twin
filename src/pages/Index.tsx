import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-black/95 px-4 py-4 flex items-center justify-between fixed w-full z-50">
        <div className="flex items-center">
          <Link to="/">
            <img 
              src="/lovable-uploads/9a7cf8fd-061c-4786-9863-03cfcb4f3b7d.png" 
              alt="Zoe RatedTV" 
              className="h-16 object-contain" 
            />
          </Link>
        </div>
        
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-black min-h-screen flex items-center justify-center text-white px-4" style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://assets.nflxext.com/ffe/siteui/vlv3/dc1cf82d-97c9-409f-b7c8-6ac1718946d6/14a8fe85-b6f4-4c06-8eaf-eccf3276d557/US-en-20230911-popsignuptwoweeks-perspective_alpha_website_large.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="max-w-3xl mx-auto text-center pt-20">
          <img 
            src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png" 
            alt="Zoe RatedTV Logo"
            className="h-40 object-contain mx-auto mb-6" 
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Unlimited movies, TV shows, and more.</h1>
          <p className="text-xl md:text-2xl mb-6">Watch anywhere. Cancel anytime.</p>
          <p className="text-xl md:text-lg mb-6">Ready to watch? Enter your email to create or restart your membership.</p>
          
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
      
      {/* Features Section */}
      <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enjoy on your TV.</h2>
            <p className="text-lg md:text-xl">Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.</p>
          </div>
          <div className="md:w-1/2 relative">
            <img 
              src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tv.png" 
              alt="TV" 
              className="relative z-10" 
            />
            <div className="absolute top-[48%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] max-w-[73%] max-h-[54%] z-0">
              <video autoPlay playsInline muted loop className="w-full h-full">
                <source src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-tv-0819.m4v" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>
      
      {/* Membership Plans Section */}
      <section className="bg-black text-white border-t-8 border-[#222] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose the plan that's right for you</h2>
          <p className="text-xl mb-12">Join with a free trial, cancel anytime.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#222] p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Free</h3>
              <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/month</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Limited content access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Ad-supported viewing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>SD quality (480p)</span>
                </li>
              </ul>
              <Link to="/signup?plan=free">
                <Button className="w-full mt-6 bg-[#e50914] hover:bg-[#f6121d]">Get Started</Button>
              </Link>
            </div>
            
            <div className="bg-[#222] p-6 rounded-lg border-2 border-[#e50914] relative">
              <div className="absolute -top-3 -right-3 bg-[#e50914] text-white text-sm font-bold py-1 px-3 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-4">Standard</h3>
              <p className="text-3xl font-bold mb-6">$9.99<span className="text-sm font-normal">/month</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Full content access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Ad-free viewing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>HD quality (1080p)</span>
                </li>
              </ul>
              <Link to="/signup?plan=standard">
                <Button className="w-full mt-6 bg-[#e50914] hover:bg-[#f6121d]">Get Started</Button>
              </Link>
            </div>
            
            <div className="bg-[#222] p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Premium</h3>
              <p className="text-3xl font-bold mb-6">$14.99<span className="text-sm font-normal">/month</span></p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Full content access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Ad-free viewing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>4K + HDR quality</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Multiple devices</span>
                </li>
              </ul>
              <Link to="/signup?plan=premium">
                <Button className="w-full mt-6 bg-[#e50914] hover:bg-[#f6121d]">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Frequently Asked Questions */}
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
      
      {/* Footer */}
      <footer className="bg-black text-[#757575] py-16 px-4 border-t-8 border-[#222]">
        <div className="max-w-6xl mx-auto">
          <p className="mb-6">Questions? Call 1-800-555-5555</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <ul className="space-y-3">
                <li><a href="#" className="hover:underline">FAQ</a></li>
                <li><a href="#" className="hover:underline">Investor Relations</a></li>
                <li><a href="#" className="hover:underline">Privacy</a></li>
                <li><a href="#" className="hover:underline">Speed Test</a></li>
              </ul>
            </div>
            
            <div>
              <ul className="space-y-3">
                <li><a href="#" className="hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:underline">Jobs</a></li>
                <li><a href="#" className="hover:underline">Cookie Preferences</a></li>
                <li><a href="#" className="hover:underline">Legal Notices</a></li>
              </ul>
            </div>
            
            <div>
              <ul className="space-y-3">
                <li><a href="#" className="hover:underline">Account</a></li>
                <li><a href="#" className="hover:underline">Ways to Watch</a></li>
                <li><a href="#" className="hover:underline">Corporate Information</a></li>
                <li><a href="#" className="hover:underline">Only on ZOE</a></li>
              </ul>
            </div>
            
            <div>
              <ul className="space-y-3">
                <li><a href="#" className="hover:underline">Media Center</a></li>
                <li><a href="#" className="hover:underline">Terms of Use</a></li>
                <li><a href="#" className="hover:underline">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <p className="mt-8">Zoe RatedTV Is Our Reality</p>
        </div>
      </footer>
    </div>
  );
};

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

export default Index;
