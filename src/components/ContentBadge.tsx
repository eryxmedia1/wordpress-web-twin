interface ContentBadgeProps {
  type: "new" | "trending" | "zoe-original" | "top10";
  rank?: number;
}

const ContentBadge = ({ type, rank }: ContentBadgeProps) => {
  const badgeStyles = {
    "new": "bg-primary text-primary-foreground",
    "trending": "bg-destructive text-destructive-foreground",
    "zoe-original": "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
    "top10": "bg-primary text-primary-foreground",
  };

  const labels = {
    "new": "NEW",
    "trending": "TRENDING",
    "zoe-original": "ZOE ORIGINAL",
    "top10": `TOP ${rank}`,
  };

  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-bold rounded ${badgeStyles[type]}`}>
      {labels[type]}
    </span>
  );
};

export default ContentBadge;
