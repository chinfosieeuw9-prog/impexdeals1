import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

interface Props { compact?: boolean; count?: number }

// Nieuwe skeleton afgestemd op EnhancedProductCard lay‑out (breedte, radius, schaduw, tag placeholders)
const SkeletonProductCard: React.FC<Props> = ({ compact }) => {
  const w = compact ? 230 : 280;
  // Aspect-ratio enforced container (4/3 standaard) -> skeleton gebruikt aspectRatio i.p.v. vaste hoogte
  const aspect = '16 / 9';
  return (
    <Box role="status" aria-label="Product wordt geladen" sx={(t)=> ({
      position:'relative',
      width: w,
      borderRadius:16,
      background: t.palette.mode==='dark'? 'linear-gradient(180deg,#102332 0%,#0a1b27 65%,#08141d 100%)':'linear-gradient(180deg,#ffffff 0%,#f7fbff 70%,#f2f8ff 100%)',
      border: t.palette.mode==='dark'? '1px solid rgba(255,255,255,0.08)':'1px solid #d6e5f5',
      boxShadow:'0 4px 16px -6px rgba(15,45,75,0.18), 0 2px 6px -2px rgba(15,45,75,0.15)',
      overflow:'hidden',
      display:'flex', flexDirection:'column'
    })}>
  <Box sx={{ position:'relative', width:'100%', aspectRatio: aspect, background:'linear-gradient(110deg, rgba(255,255,255,0.35) 0%, rgba(220,235,248,0.9) 45%, rgba(255,255,255,0.35) 100%)', overflow:'hidden' }}>
        <Box sx={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 100%)', animation:'cardShimmer 1.6s linear infinite' }} />
        <Box sx={{ position:'absolute', top:8, left:8, display:'flex', gap:.5 }}>
          <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius:2 }} />
          {compact? null : <Skeleton variant="rounded" width={90} height={22} sx={{ borderRadius:2 }} />}
        </Box>
        <Box sx={{ position:'absolute', top:6, right:6 }}>
          <Skeleton variant="circular" width={28} height={28} />
        </Box>
      </Box>
  <Box sx={{ p: compact? 1.1:1.3, display:'flex', flexDirection:'column', gap: compact? .55: .7, flexGrow:1 }}>
        <Skeleton variant="text" width="70%" height={compact? 20:24} />
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="55%" height={compact? 26:32} />
        <Skeleton variant="text" width="35%" height={14} />
        <Box sx={{ display:'flex', gap:.5, mt:.4 }}>
          <Skeleton variant="rounded" width={52} height={22} sx={{ borderRadius:999 }} />
          <Skeleton variant="rounded" width={48} height={22} sx={{ borderRadius:999 }} />
          {!compact && <Skeleton variant="rounded" width={42} height={22} sx={{ borderRadius:999 }} />}
        </Box>
        <Box sx={{ mt:'auto', display:'flex', justifyContent:'space-between', alignItems:'center', pt:1 }}>
          <Skeleton variant="rounded" width={88} height={34} sx={{ borderRadius:8 }} />
          <Skeleton variant="circular" width={26} height={26} />
        </Box>
      </Box>
      <style>{`@keyframes cardShimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}`}</style>
    </Box>
  );
};

export default SkeletonProductCard;
