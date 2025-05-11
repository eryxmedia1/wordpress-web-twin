
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <img 
        src="/lovable-uploads/5806b50d-0fbb-4e69-bec1-5c2d43f7d0bd.png" 
        alt="ZOE Logo" 
        className="h-20 mb-8" 
      />
      <h1 className="text-4xl md:text-6xl font-bold mb-4">Lost your way?</h1>
      <p className="text-xl mb-8 text-center max-w-md">
        Sorry, we can't find that page. You'll find lots to explore on the home page.
      </p>
      <Link to="/">
        <Button className="bg-white text-black hover:bg-gray-200 font-medium text-lg px-6 py-6">
          ZOE Home
        </Button>
      </Link>
      <p className="mt-8 text-gray-400">Error Code: 404</p>
    </div>
  );
};

export default NotFound;
