
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TagsTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">TV Show Tags</h2>
      <p>Manage tags for all your content.</p>
      <Button 
        className="mt-4 bg-[#e50914] hover:bg-[#f6121d]"
        onClick={() => navigate("/admin/tags")}
      >
        Manage Tags
      </Button>
    </div>
  );
};

export default TagsTab;
