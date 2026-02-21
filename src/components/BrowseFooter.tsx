import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const BrowseFooter = () => {
  return (
    <footer className="bg-[#0a0a14] border-t border-white/10 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="text-2xl font-bold text-white">
              Zoe<span className="text-purple-500">Rated</span>
            </Link>
            <p className="text-gray-400 text-sm mt-4 max-w-xs">
              Your ultimate destination for streaming movies, TV shows, and exclusive content.
            </p>
            
            {/* App Store Buttons */}
            <div className="flex gap-3 mt-6">
              <a href="#" className="block">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on App Store"
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Browse</h4>
            <ul className="space-y-2">
              <li><Link to="/movies" className="text-gray-400 hover:text-white text-sm transition-colors">Movies</Link></li>
              <li><Link to="/tv-shows" className="text-gray-400 hover:text-white text-sm transition-colors">TV Shows</Link></li>
              <li><Link to="/live" className="text-gray-400 hover:text-white text-sm transition-colors">Live Stream</Link></li>
              <li><Link to="/videos" className="text-gray-400 hover:text-white text-sm transition-colors">Videos</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              <li><Link to="/producers" className="text-gray-400 hover:text-white text-sm transition-colors">Producers</Link></li>
              <li><a href="https://zoenationuniverse.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Zoe Nation Universe</a></li>
              <li><Link to="/news" className="text-gray-400 hover:text-white text-sm transition-colors">News</Link></li>
              <li><Link to="/shop" className="text-gray-400 hover:text-white text-sm transition-colors">Shop</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Employment</h4>
            <ul className="space-y-2">
              <li><Link to="/casting" className="text-gray-400 hover:text-white text-sm transition-colors">Casting Calls</Link></li>
              <li><Link to="/casting/crew" className="text-gray-400 hover:text-white text-sm transition-colors">Crew</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/feedback" className="text-gray-400 hover:text-white text-sm transition-colors">Feedback</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm">
            © 2024 ZoeRated. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BrowseFooter;
