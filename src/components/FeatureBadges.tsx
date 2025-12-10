import { Crown, Sparkles, Radio, Monitor } from 'lucide-react';

interface BadgeProps {
  className?: string;
}

export const AdFreeBadge = ({ className = '' }: BadgeProps) => (
  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-semibold ${className}`}>
    <Sparkles className="w-3 h-3" />
    AD-FREE
  </div>
);

export const PremiumBadge = ({ className = '' }: BadgeProps) => (
  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-semibold ${className}`}>
    <Crown className="w-3 h-3" />
    PREMIUM
  </div>
);

export const LiveChannelBadge = ({ className = '' }: BadgeProps) => (
  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold animate-pulse ${className}`}>
    <Radio className="w-3 h-3" />
    LIVE
  </div>
);

export const HDRBadge = ({ className = '' }: BadgeProps) => (
  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold ${className}`}>
    <Monitor className="w-3 h-3" />
    4K HDR
  </div>
);

export const QualityBadge = ({ quality, className = '' }: { quality: '480p' | '1080p' | '4k'; className?: string }) => {
  const colors = {
    '480p': 'bg-muted text-muted-foreground',
    '1080p': 'bg-primary/80 text-primary-foreground',
    '4k': 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black',
  };

  return (
    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colors[quality]} ${className}`}>
      {quality.toUpperCase()}
    </div>
  );
};

export const TierBadge = ({ tier, className = '' }: { tier: 'free' | 'standard' | 'premium'; className?: string }) => {
  const styles = {
    free: 'bg-muted text-muted-foreground',
    standard: 'bg-primary text-primary-foreground',
    premium: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black',
  };

  const icons = {
    free: null,
    standard: <Sparkles className="w-3 h-3" />,
    premium: <Crown className="w-3 h-3" />,
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[tier]} ${className}`}>
      {icons[tier]}
      {tier.toUpperCase()}
    </div>
  );
};
