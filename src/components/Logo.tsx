import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export type LogoVariant = 'circle' | 'shield' | 'cube' | 'bars' | 'orb' | 'hex' | 'spark' | 'wave' | 'arrows' | 'outline' | 'wheel' | 'wheelSimple';

export interface LogoProps {
  variant?: LogoVariant;
  size?: number;              // square px size of emblem (excluding wordmark)
  withWordmark?: boolean;     // show "ImpexDeals" text
  animate?: boolean;          // enable subtle shimmer / scale animation
  wordmarkGap?: number;       // gap between emblem + wordmark
  colorMode?: 'auto' | 'light' | 'dark'; // force a mode for gradient selection
  wordmarkFontSize?: number;  // override font size of wordmark
  className?: string;
  style?: React.CSSProperties;
}

/*
  Re-usable Logo component with multiple inline SVG variants that leverage theme gradients.
  Variants:
    - circle: rounded badge with ID monogram
    - shield: vertical shield shape containing ID
    - cube: isometric diamond / cube illusion with ID letters
  - bars: abstract bars (stylized brand mark)
  - orb: gradient sphere with inner shine ring (symbol only)
  - hex: beveled hexagon jewel
  - spark: energetic multi-point spark icon
  - wave: layered wave arcs (dynamic feel)
  - arrows: dual circular trade arrows (import/export)
  - outline: minimal dun-lijn symbool (cirkel + pijlen) voor strak design
  - wheel: gelaagd handelswiel met spaken + dubbele tegengestelde rotatie
  - wheelSimple: minimal wiel met 4 spaken / 8 arc segmenten (spin alleen bij hover)
*/

const Logo: React.FC<LogoProps> = ({
  variant = 'circle',
  size = 48,
  withWordmark = false,
  animate = false,
  wordmarkGap = 10,
  colorMode = 'auto',
  wordmarkFontSize,
  className,
  style
}) => {
  const theme = useTheme();
  const isDark = (colorMode === 'auto' ? theme.palette.mode === 'dark' : colorMode === 'dark');
  const gradA = theme.palette.gradient?.brand || theme.palette.primary.main;
  const gradB = theme.palette.gradient?.brandAlt || theme.palette.secondary.main;
  const gradientId = React.useId();

  const commonSvgProps = {
    width: size,
    height: size,
    role: 'img',
  'aria-label': 'ImpexDeals logo'
  } as const;

  const animatedStyles = animate ? (() => {
    const base: any = {
      position: 'relative',
      animation: 'logoPop .8s ease-out',
      '@keyframes logoPop': {
        '0%': { opacity: 0, transform: 'scale(.65) rotate(-6deg)' },
        '60%': { opacity: 1, transform: 'scale(1.04) rotate(1deg)' },
        '100%': { opacity: 1, transform: 'scale(1) rotate(0deg)' }
      }
    };
    // Continuous spin for outline (wheel effect) after pop
    if (variant === 'outline') {
      base.animation = 'logoPop .8s ease-out, wheelSpin 14s linear infinite .85s';
      base['@keyframes wheelSpin'] = {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      };
      base.transformOrigin = '50% 50%';
    }
    if (variant === 'wheel') {
      base.animation = 'logoPop .8s ease-out'; // container stationary (groups rotate)
      base['@keyframes wheelSpinOuter'] = {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      };
      base['@keyframes wheelSpinInner'] = {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(-360deg)' }
      };
    }
    if (variant === 'wheelSimple') {
      // No continuous spin; only hover spin via container sx
      base.animation = 'logoPop .6s ease-out';
    }
    return base;
  })() : undefined;

  const emblem = (() => {
    switch (variant) {
      case 'circle':
        return (
          <svg {...commonSvgProps} viewBox="0 0 100 100">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#4fa3ff' : '#1f6fd6'} />
                <stop offset="55%" stopColor={isDark ? '#3a7bd5' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#4fa3ff'} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} />
            <text x="50" y="56" textAnchor="middle" fontSize="40" fontFamily="Inter,Roboto,Arial" fontWeight="700" fill="#fff">ID</text>
          </svg>
        );
      case 'shield':
        return (
          <svg {...commonSvgProps} viewBox="0 0 100 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#4fa3ff' : '#1f6fd6'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#3a7bd5'} />
              </linearGradient>
            </defs>
            <path d="M50 4 L92 18 V58 C92 82 74 106 50 116 C26 106 8 82 8 58 V18 Z" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <text x="50" y="58" textAnchor="middle" fontSize="36" fontFamily="Inter,Roboto,Arial" fontWeight="700" fill="#fff">ID</text>
          </svg>
        );
      case 'cube':
        return (
          <svg {...commonSvgProps} viewBox="0 0 100 100">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#4fa3ff' : '#1f6fd6'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#3a7bd5'} />
              </linearGradient>
            </defs>
            <g transform="translate(50,50)">
              <polygon points="0,-40 34,-20 34,20 0,40 -34,20 -34,-20" fill={`url(#${gradientId})`} />
              <text x="0" y="12" fontSize="34" fontFamily="Inter,Roboto,Arial" fontWeight="700" textAnchor="middle" fill="#fff">ID</text>
            </g>
          </svg>
        );
      case 'bars':
        return (
            <svg {...commonSvgProps} viewBox="0 0 120 100">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? '#4fa3ff' : '#1f6fd6'} />
                  <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#3a7bd5'} />
                </linearGradient>
              </defs>
              <rect x="10" y="12" width="24" height="76" rx="6" fill={`url(#${gradientId})`} />
              <rect x="42" y="12" width="44" height="24" rx="6" fill={`url(#${gradientId})`} />
              <rect x="42" y="44" width="24" height="44" rx="6" fill={`url(#${gradientId})`} />
              <rect x="74" y="44" width="24" height="44" rx="6" fill={`url(#${gradientId})`} />
            </svg>
        );
      case 'orb':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <radialGradient id={gradientId} cx="50%" cy="38%" r="60%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#d9ecff'} />
                <stop offset="35%" stopColor={isDark ? '#6bb8ff' : '#4fa3ff'} />
                <stop offset="75%" stopColor={isDark ? '#1f6fd6' : '#2369c4'} />
                <stop offset="100%" stopColor={isDark ? '#0d3c78' : '#0d3c78'} />
              </radialGradient>
              <linearGradient id={gradientId + '-ring'} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#bfe4ff' : '#ffffff'} stopOpacity="0.9" />
                <stop offset="60%" stopColor={isDark ? '#4fa3ff' : '#3a7bd5'} stopOpacity="0.35" />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill={`url(#${gradientId})`} />
            <circle cx="60" cy="60" r="44" fill="none" stroke={`url(#${gradientId + '-ring'})`} strokeWidth="6" />
            <circle cx="42" cy="42" r="14" fill="#fff" fillOpacity="0.25" />
            <circle cx="40" cy="40" r="10" fill="#fff" fillOpacity="0.55" />
          </svg>
        );
      case 'hex':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#6bb8ff' : '#1f6fd6'} />
                <stop offset="55%" stopColor={isDark ? '#3a7bd5' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#4fa3ff'} />
              </linearGradient>
              <linearGradient id={gradientId + '-edge'} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <polygon points="60,6 108,36 108,84 60,114 12,84 12,36" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <polygon points="60,18 96,40 96,80 60,102 24,80 24,40" fill="url(#${gradientId + '-edge'})" opacity="0.18" />
            <circle cx="60" cy="60" r="18" fill="#fff" fillOpacity="0.15" />
            <circle cx="56" cy="54" r="10" fill="#fff" fillOpacity="0.55" />
          </svg>
        );
      case 'spark':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#d9ecff'} />
                <stop offset="50%" stopColor={isDark ? '#4fa3ff' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} />
              </linearGradient>
            </defs>
            <g transform="translate(60 60)">
              <polygon points="0,-46 10,-10 46,0 10,10 0,46 -10,10 -46,0 -10,-10" fill={`url(#${gradientId})`} />
              <circle cx="0" cy="0" r="14" fill="#fff" fillOpacity="0.25" />
            </g>
          </svg>
        );
      case 'wave':
        return (
          <svg {...commonSvgProps} viewBox="0 0 140 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isDark ? '#6bb8ff' : '#1f6fd6'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#4fa3ff'} />
              </linearGradient>
            </defs>
            <path d="M6 72 C26 52 46 52 66 72 C86 92 106 92 134 66 L134 108 L6 108 Z" fill={`url(#${gradientId})`} opacity="0.55" />
            <path d="M6 54 C26 34 46 34 66 54 C86 74 106 74 134 48 L134 96 L6 96 Z" fill={`url(#${gradientId})`} opacity="0.75" />
            <path d="M6 36 C26 16 46 16 66 36 C86 56 106 56 134 30 L134 84 L6 84 Z" fill={`url(#${gradientId})`} />
            <circle cx="46" cy="34" r="10" fill="#fff" fillOpacity="0.4" />
          </svg>
        );
      case 'arrows':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#6bb8ff' : '#1f6fd6'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#4fa3ff'} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="#0d3c78" fillOpacity={isDark ? 0.4 : 0.15} />
            <path d="M88 50 A28 28 0 0 0 40 44" fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M42 42 L38 58 L54 54" fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 70 A28 28 0 0 0 80 76" fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M78 78 L82 62 L66 66" fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'outline':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#ffffff'} stopOpacity={1} />
                <stop offset="35%" stopColor={isDark ? '#bfe4ff' : '#e3f3ff'} />
                <stop offset="65%" stopColor={isDark ? '#4fa3ff' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} />
              </linearGradient>
              <radialGradient id={gradientId + '-bg'} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#ffffff'} stopOpacity="0.08" />
                <stop offset="100%" stopColor={isDark ? '#1f2a40' : '#0d3c78'} stopOpacity="0.25" />
              </radialGradient>
              <filter id={gradientId + '-glow'} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="60" cy="60" r="56" fill={`url(#${gradientId + '-bg'})`} />
            <circle cx="60" cy="60" r="50" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" filter={`url(#${gradientId + '-glow'})`} strokeLinecap="round" />
            <path d="M79 47 A26 26 0 0 0 46 41" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
            <path d="M44 43 L41 55 L53 52" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M41 73 A26 26 0 0 0 74 79" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
            <path d="M76 77 L79 65 L67 68" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="60" cy="60" r="7" fill={`url(#${gradientId})`} />
          </svg>
        );
      case 'wheel':
        return (
          <svg {...commonSvgProps} viewBox="0 0 140 140">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#bfe4ff' : '#ffffff'} />
                <stop offset="55%" stopColor={isDark ? '#4fa3ff' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} />
              </linearGradient>
              <linearGradient id={gradientId + '-seg'} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#e8f5ff'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#2b6fbf'} />
              </linearGradient>
              <radialGradient id={gradientId + '-hub'} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#ffffff'} />
                <stop offset="70%" stopColor={isDark ? '#4fa3ff' : '#3a7bd5'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} />
              </radialGradient>
            </defs>
            {/* outer segmented ring */}
            <g data-part="outer" transform="translate(70 70)">
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * Math.PI / 180;
                const x1 = Math.cos(angle) * 52;
                const y1 = Math.sin(angle) * 52;
                const x2 = Math.cos(angle) * 60;
                const y2 = Math.sin(angle) * 60;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${gradientId})`} strokeWidth={6} strokeLinecap="round" />;
              })}
              <circle r={58} fill="none" stroke={`url(#${gradientId})`} strokeWidth={4} strokeDasharray="28 14" strokeLinecap="round" />
            </g>
            {/* inner ring counter rotation */}
            <g data-part="inner" transform="translate(70 70)">
              <circle r={34} fill="none" stroke={`url(#${gradientId + '-seg'})`} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round" />
              {[...Array(4)].map((_, i) => {
                const angle = (i * 90 + 45) * Math.PI / 180;
                const x = Math.cos(angle) * 24;
                const y = Math.sin(angle) * 24;
                return <polygon key={i} points={`${x},${y} ${x+6},${y+2} ${x},${y+10} ${x-6},${y+2}`} fill={`url(#${gradientId})`} opacity={0.85} />;
              })}
            </g>
            {/* hub */}
            <circle cx={70} cy={70} r={14} fill={`url(#${gradientId + '-hub'})`} stroke={`url(#${gradientId})`} strokeWidth={2} />
            <circle cx={70} cy={70} r={4} fill="#fff" opacity={0.85} />
          </svg>
        );
      case 'wheelSimple':
        return (
          <svg {...commonSvgProps} viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#ffffff'} />
                <stop offset="55%" stopColor={isDark ? '#6bb8ff' : '#3a8be0'} />
                <stop offset="100%" stopColor={isDark ? '#1f6fd6' : '#1f6fd6'} />
              </linearGradient>
              <radialGradient id={gradientId + '-bg'} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={isDark ? '#ffffff' : '#ffffff'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={isDark ? '#0d3c78' : '#0d3c78'} stopOpacity="0.35" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill={`url(#${gradientId + '-bg'})`} />
            {/* arcs */}
            {[...Array(8)].map((_, i) => {
              const start = (i * 45 - 8) * Math.PI / 180;
              const end = (i * 45 + 18) * Math.PI / 180;
              const r = 46;
              const x1 = 60 + r * Math.cos(start);
              const y1 = 60 + r * Math.sin(start);
              const x2 = 60 + r * Math.cos(end);
              const y2 = 60 + r * Math.sin(end);
              const large = end - start > Math.PI ? 1 : 0;
              return <path key={i} d={`M${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={`url(#${gradientId})`} strokeWidth={5} strokeLinecap="round" fill="none" />;
            })}
            {/* spokes */}
            {[0,90,180,270].map(a => {
              const rad = a * Math.PI/180;
              const x2 = 60 + Math.cos(rad)*34;
              const y2 = 60 + Math.sin(rad)*34;
              return <line key={a} x1={60} y1={60} x2={x2} y2={y2} stroke={`url(#${gradientId})`} strokeWidth={4} strokeLinecap="round" />;
            })}
            <circle cx="60" cy="60" r="10" fill={`url(#${gradientId})`} stroke="#fff" strokeWidth={2} />
          </svg>
        );
      default:
        return null;
    }
  })();

  return (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1,
        ...animatedStyles,
        ...style
      }}
    >
      {/* For wheel variant, scope nested group animations via data attributes */}
  {variant === 'wheel' && animate ? (
        <Box sx={{
          '& svg [data-part="outer"]': { animation: 'wheelSpinOuter 12s linear infinite' },
          '& svg [data-part="inner"]': { animation: 'wheelSpinInner 7s linear infinite' }
        }}>
          {emblem}
        </Box>
  ) : emblem}
      {withWordmark && (
        <Typography
          variant="h5"
          sx={{
            ml: wordmarkGap / 8,
            fontSize: wordmarkFontSize || Math.round(size * 0.52),
            fontWeight: 800,
            letterSpacing: .5,
            position: 'relative',
            lineHeight: 1,
            display: 'inline-block',
            // Layered technique: solid fallback + gradient text + outline for contrast
            color: isDark ? '#f5f9ff' : '#0f3b70',
            background: `linear-gradient(90deg, ${isDark ? '#ffffff' : '#0d54a8'} 0%, ${isDark ? '#d3ecff' : '#3a7bd5'} 35%, ${isDark ? '#8dcfff' : '#4fa3ff'} 70%, ${isDark ? '#ffffff' : '#6ec3ff'} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.55), 0 0 4px rgba(79,163,255,0.35)'
              : '0 1px 2px rgba(255,255,255,0.55), 0 0 4px rgba(31,111,214,0.25)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
            userSelect: 'none'
          }}
        >
          ImpexDeals
        </Typography>
      )}
    </Box>
  );
};

export default Logo;

// Helper showcase component (optional usage example for ImpexDeals brand)
export const LogoShowcase: React.FC = () => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
  {(['circle','shield','cube','bars','orb','hex','spark','wave','arrows','outline'] as LogoVariant[]).map(v => (
      <Box key={v} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Logo variant={v} animate size={64} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{v}</Typography>
      </Box>
    ))}
  </Box>
);
