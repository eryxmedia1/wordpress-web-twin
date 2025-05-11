
const Footer = () => {
  return (
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
  );
};

export default Footer;
