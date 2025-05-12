
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CategoriesTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">TV Show Categories</h2>
      <p>Manage categories for your TV shows.</p>
      <Button 
        className="mt-4 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
        onClick={() => navigate("/admin/tvshows/categories")}
      >
        Manage Categories
      </Button>
    </div>
  );
};

export default CategoriesTab;
