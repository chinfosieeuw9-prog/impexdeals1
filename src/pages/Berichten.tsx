import React, { useEffect, useState } from 'react';
import { getInbox, getConversation, sendMessage, markConversationRead, subscribeMessages, setTyping, getTypingForConversation, subscribeTyping, deleteMessage, restoreMessage } from '../services/messageService';
import { getCurrentUser } from '../services/authService';
import type { ConversationSummary, Message, MessageAttachment } from '../types/message';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import ImageIcon from '@mui/icons-material/Image';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ForwardIcon from '@mui/icons-material/Forward';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';

const Berichten: React.FC = () => {
  const me = getCurrentUser();
  const [inbox, setInbox] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('prefill') || '';
  });
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [showOptions,setShowOptions] = useState(true);
  const [filter,setFilter] = useState('');
  const [sending,setSending] = useState(false);
  const [templates] = useState<string[]>([
    'Hallo, ik heb interesse in uw partij.',
    'Kunt u extra foto\'s sturen?',
    'Is de prijs onderhandelbaar?',
    'Wat is de minimum afname?',
  ]);
  const [showEmoji,setShowEmoji] = useState(false);
  const [typing,setTypingState] = useState(false);
  const [emojiSearch,setEmojiSearch] = useState('');
  const EMOJIS = ['😀','😁','😂','😊','😍','🤝','👍','✅','🔥','💶','📦','📍','❓','⚠️','🚀','👏'];
  const [menuAnchor,setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuMsg,setMenuMsg] = useState<Message | null>(null);
  const [quote,setQuote] = useState<Message | null>(null);
  const [deleted,setDeleted] = useState<Message | null>(null);
  const [layout,setLayout] = useState<'classic'|'bubbly'|'compact'>('classic');
  const [bubbleTheme,setBubbleTheme] = useState<'blue'|'green'|'sunset'|'purple'|'ocean'|'magma'|'mono'|'aurora'|string>('blue');
  const [darkMode,setDarkMode] = useState(false);
  const [density,setDensity] = useState<'cozy'|'normal'|'compact'>('normal');
  const [customOpen,setCustomOpen] = useState(false);
  const [gradColor1,setGradColor1] = useState('#3a7bd5');
  const [gradColor2,setGradColor2] = useState('#1f6fd6');
  const [gradAngle,setGradAngle] = useState(135);
  const [customGradients,setCustomGradients] = useState<{ id:string; name:string; css:string }[]>([]);
  const [sidebarCompact,setSidebarCompact] = useState(false);

  // Auto-compact the sidebar when overall layout is set to 'compact'
  useEffect(()=>{ setSidebarCompact(layout==='compact'); }, [layout]);

  // Deep link conversation via query params
  useEffect(()=>{
    if (!me) return;
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const user = params.get('user');
    const product = params.get('product') || undefined;
    if (to && user) {
      setActive({ userId: Number(to), username: user, lastMessage:'', lastAt:0, unread:0, productId: product });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => { if (me) setInbox(getInbox()); }, [me]);
  useEffect(() => {
    if (active) {
      setMessages(getConversation(active.userId, active.productId));
      markConversationRead(active.userId, active.productId);
      setInbox(getInbox());
    }
  }, [active]);

  // subscribe to updates & typing
  useEffect(()=>{
    const unsub = subscribeMessages(()=>{
      if (me) setInbox(getInbox());
      if (active) setMessages(getConversation(active.userId, active.productId));
    });
    const unsubTyping = subscribeTyping(()=>{
      if (active) setTypingState(getTypingForConversation(active.userId, active.productId));
    });
    return ()=>{ unsub(); unsubTyping(); };
  }, [active, me]);

  useEffect(()=>{ if (active) setTypingState(getTypingForConversation(active.userId, active.productId)); }, [active]);

  const handleSend = async () => {
    if (!active || (!draft.trim() && !attachments.length)) return;
    setSending(true);
    // simulate tiny delay
    await new Promise(r=>setTimeout(r,120));
    const msg = sendMessage(active.userId, active.username, draft.trim(), active.productId, attachments, quote?.id);
    if (msg) {
      setDraft('');
      setAttachments([]);
      setQuote(null);
      setMessages(prev => [...prev, msg]);
      setInbox(getInbox());
    }
    setSending(false);
  };

  // Message action menu handlers (moved out of handleSend scope)
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, m: Message) => { setMenuAnchor(e.currentTarget); setMenuMsg(m); };
  const closeMenu = () => { setMenuAnchor(null); setMenuMsg(null); };
  const doCopyMessage = () => {
    if (menuMsg) {
      try { navigator.clipboard.writeText(menuMsg.body); } catch {}
    }
    closeMenu();
  };
  const doQuote = () => { if (menuMsg) setQuote(menuMsg); closeMenu(); };
  const doForward = () => {
    if (menuMsg) {
      setDraft(d => d ? d + '\n\nFW: ' + menuMsg.body : 'FW: ' + menuMsg.body);
    }
    closeMenu();
  };
  const doDelete = () => {
    if (menuMsg) {
      deleteMessage(menuMsg.id);
      setMessages(ms => ms.filter(m => m.id !== menuMsg.id));
      setInbox(getInbox());
      setDeleted(menuMsg);
    }
    closeMenu();
  };

  const handleUndoDelete = () => {
    if (deleted) {
      restoreMessage(deleted);
      setMessages(ms => [...ms, deleted].sort((a,b)=> a.createdAt - b.createdAt));
      setInbox(getInbox());
      setDeleted(null);
    }
  };

  const handleLayoutChange = (_: any, val: 'classic'|'bubbly'|'compact'|null) => { if (val) setLayout(val); };
  const handleBubbleTheme = (_: any, val: any) => { if (val) setBubbleTheme(val); };

  // persist bubble theme
  useEffect(()=>{
    try {
      const saved = localStorage.getItem('impex_bubble_theme');
      if (saved) setBubbleTheme(saved);
      const dm = localStorage.getItem('impex_dark_mode');
      if (dm==='1') setDarkMode(true);
      const dens = localStorage.getItem('impex_density');
      if (dens==='cozy' || dens==='normal' || dens==='compact') setDensity(dens);
      const custom = localStorage.getItem('impex_custom_gradients');
      if (custom) setCustomGradients(JSON.parse(custom));
    } catch {}
  }, []);
  useEffect(()=>{ try { localStorage.setItem('impex_bubble_theme', bubbleTheme); } catch {} }, [bubbleTheme]);
  useEffect(()=>{ try { localStorage.setItem('impex_dark_mode', darkMode? '1':'0'); } catch {} }, [darkMode]);
  useEffect(()=>{ try { localStorage.setItem('impex_density', density); } catch {} }, [density]);
  useEffect(()=>{ try { localStorage.setItem('impex_custom_gradients', JSON.stringify(customGradients)); } catch {} }, [customGradients]);

  // gradients + backgrounds
  const bubbleGradients: Record<string,string> = {
    blue: 'linear-gradient(135deg,#3a7bd5,#1f6fd6)',
    green: 'linear-gradient(135deg,#00b09b,#96c93d)',
    sunset: 'linear-gradient(135deg,#f83600,#f9d423)',
    purple: 'linear-gradient(135deg,#8e2de2,#4a00e0)',
    ocean: 'linear-gradient(135deg,#00c6ff,#0072ff)',
    magma: 'linear-gradient(135deg,#ff512f,#dd2476)',
    mono: 'linear-gradient(135deg,#778899,#2f3b45)',
    aurora: 'linear-gradient(135deg,#00c9ff,#92fe9d)'
  };
  customGradients.forEach(c => { bubbleGradients[c.id] = c.css; });
  const convoBackgrounds: Record<string,string> = {
    blue: 'radial-gradient(at 75% 20%, rgba(31,111,214,0.20), transparent 55%), radial-gradient(at 15% 80%, rgba(58,123,213,0.18), transparent 60%), linear-gradient(135deg,#f7fafe,#eef4fa)',
    green: 'radial-gradient(at 80% 25%, rgba(0,176,155,0.22), transparent 55%), radial-gradient(at 20% 85%, rgba(150,201,61,0.20), transparent 60%), linear-gradient(135deg,#f6fbf7,#eef8f0)',
    sunset: 'radial-gradient(at 78% 22%, rgba(248,54,0,0.20), transparent 55%), radial-gradient(at 18% 82%, rgba(249,212,35,0.25), transparent 60%), linear-gradient(135deg,#fff8f2,#fff4ea)',
    purple: 'radial-gradient(at 78% 22%, rgba(142,45,226,0.22), transparent 55%), radial-gradient(at 18% 82%, rgba(74,0,224,0.20), transparent 60%), linear-gradient(135deg,#faf7ff,#f4f0ff)',
    ocean: 'radial-gradient(at 78% 22%, rgba(0,114,255,0.22), transparent 55%), radial-gradient(at 18% 82%, rgba(0,198,255,0.24), transparent 60%), linear-gradient(135deg,#f2f9ff,#eef6ff)',
    magma: 'radial-gradient(at 78% 22%, rgba(255,81,47,0.23), transparent 55%), radial-gradient(at 18% 82%, rgba(221,36,118,0.24), transparent 60%), linear-gradient(135deg,#fff5f7,#fff1f4)',
    mono: 'radial-gradient(at 78% 22%, rgba(47,59,69,0.20), transparent 55%), radial-gradient(at 18% 82%, rgba(119,136,153,0.25), transparent 60%), linear-gradient(135deg,#f5f7f8,#edf0f2)',
    aurora: 'radial-gradient(at 78% 22%, rgba(0,201,255,0.22), transparent 55%), radial-gradient(at 18% 82%, rgba(146,254,157,0.28), transparent 60%), linear-gradient(135deg,#f2fdf8,#ebfaf5)'
  };
  customGradients.forEach(c => { convoBackgrounds[c.id] = `linear-gradient(135deg,#ffffff,#ffffff)`; });
  const darkBg = 'linear-gradient(135deg,#0f1824,#1c2c3f)';
  const darkPanel = 'rgba(30,45,63,0.55)';

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const list: MessageAttachment[] = [];
    const ALLOWED = ['image/jpeg','image/png','image/webp'];
    const MAX_SIZE = 1_000_000; // 1MB
    Array.from(files).slice(0,4).forEach(f=>{
      if (!ALLOWED.includes(f.type) || f.size>MAX_SIZE) return;
      const reader = new FileReader();
      reader.onload = () => {
        list.push({ id: crypto.randomUUID(), name: f.name, dataUrl: reader.result as string, size: f.size, type: f.type });
        if (list.length === Math.min(Array.from(files).length,4)) {
          setAttachments(prev => [...prev, ...list].slice(0,4));
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removeAttachment = (id:string) => setAttachments(a=>a.filter(x=>x.id!==id));
  const applyTemplate = (t:string) => setDraft(prev=> prev? prev + (prev.endsWith(' ')?'':' ') + t : t);

  const filteredInbox = filter? inbox.filter(c=> c.username.toLowerCase().includes(filter.toLowerCase()) || (c.lastMessage&& c.lastMessage.toLowerCase().includes(filter.toLowerCase()))): inbox;
  const insertEmoji = (e:string) => { setDraft(d=> d + e); setShowEmoji(false); };

  if (!me) return <Typography sx={{ p:3 }}>Log in om berichten te bekijken.</Typography>;

  return (
    <>
  <Box sx={(theme)=>({ display:'flex', height:'75vh', border:'1px solid '+ (darkMode? 'rgba(255,255,255,0.08)':'rgba(31,111,214,0.18)'), borderRadius:2, overflow:'hidden', backdropFilter:'blur(14px)', background: darkMode? 'linear-gradient(135deg,rgba(25,38,52,0.9),rgba(25,38,52,0.75))': ((theme.palette as any).gradient?.card || 'linear-gradient(135deg,#f8fbff 0%,#e3f0ff 100%)'), boxShadow: darkMode? '0 4px 16px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)': '0 6px 18px -6px rgba(63,122,185,0.25)' })}>
      {/* Left sidebar */}
  <Box sx={(theme)=>({ width: sidebarCompact? 190: 300, transition:'width .25s', borderRight:'1px solid '+ (darkMode? 'rgba(255,255,255,0.07)':'rgba(31,111,214,0.15)'), display:'flex', flexDirection:'column', background: darkMode? 'rgba(20,32,46,0.7)': 'linear-gradient(180deg,#ffffffd9,#f4faffee)', backdropFilter:'blur(18px)' })}>
        <Box sx={(theme)=>({ p: sidebarCompact? 0.8:1.1, borderBottom:'1px solid '+ (darkMode? 'rgba(255,255,255,0.06)':'rgba(31,111,214,0.15)'), display:'flex', alignItems:'center', gap:0.6 })}>
          {!sidebarCompact && (
            <TextField value={filter} onChange={e=>setFilter(e.target.value)} size="small" fullWidth placeholder="Zoeken" InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, endAdornment: filter? <InputAdornment position="end"><IconButton size="small" onClick={()=>setFilter('')}><ClearIcon fontSize="small" /></IconButton></InputAdornment>: undefined }} sx={{ '& .MuiInputBase-input': { py:0.7, fontSize:13 } }} />
          )}
          {sidebarCompact && (
            <IconButton size="small" onClick={()=>setSidebarCompact(false)}><SearchIcon fontSize="small" /></IconButton>
          )}
          <Tooltip title={showOptions? 'Verberg templates':'Toon templates'}><IconButton size="small" onClick={()=>setShowOptions(o=>!o)}>{showOptions? <CloseIcon fontSize="small" />: <AttachFileIcon fontSize="small" />}</IconButton></Tooltip>
          <Tooltip title={sidebarCompact? 'Zijbalk normaal':'Zijbalk compact'}><IconButton size="small" onClick={()=>setSidebarCompact(c=>!c)}><ViewCompactIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <Box sx={{ flex:1, overflowY:'auto' }}>
          <List dense>
            {filteredInbox.map(conv => (
              <ListItem key={conv.userId + (conv.productId||'')} disablePadding secondaryAction={!sidebarCompact && conv.productId && <Chip label="Product" size="small" color="primary" variant="outlined" /> }>
                <ListItemButton selected={active?.userId===conv.userId && active?.productId===conv.productId} onClick={() => setActive(conv)} sx={{ alignItems:'flex-start', py: sidebarCompact? 0.5: 0.9, px: sidebarCompact? 0.8: 1.2 }}>
                  <Avatar sx={{ width: sidebarCompact?26:34, height: sidebarCompact?26:34, mr: sidebarCompact?0.6:0.8, fontSize: sidebarCompact? 12: 14 }}>{conv.username[0]?.toUpperCase()}</Avatar>
                  <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
                    <Badge color="primary" badgeContent={conv.unread||0} invisible={!conv.unread} sx={{ '& .MuiBadge-badge': { right:-4 } }}>
                      <Typography fontWeight={600} sx={{ fontSize: sidebarCompact? 12: 14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: sidebarCompact? 88: 140 }}>{conv.username}</Typography>
                    </Badge></Box>} secondary={!sidebarCompact && <Typography variant="caption" color="text.secondary" sx={{ display:'block', maxHeight:32, overflow:'hidden' }}>{conv.lastMessage}</Typography>} />
                </ListItemButton>
              </ListItem>
            ))}
            {filteredInbox.length === 0 && <Typography sx={{ p:2 }}>Geen berichten</Typography>}
          </List>
        </Box>
        <Collapse in={showOptions} unmountOnExit>
          <Divider />
          <Box sx={{ p:1.5, display:'flex', flexWrap:'wrap', gap:0.5 }}>
            {templates.map(t => <Chip key={t} label={t} size="small" onClick={()=>applyTemplate(t)} sx={{ cursor:'pointer', maxWidth: '100%' }} />)}
          </Box>
        </Collapse>
      </Box>
      {/* Conversation area */}
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', position:'relative' }}>
  <Box sx={(theme)=>({ p:2, borderBottom:'1px solid '+ (darkMode? 'rgba(255,255,255,0.06)':'rgba(31,111,214,0.15)'), background: darkMode? 'linear-gradient(135deg,rgba(34,55,80,0.9),rgba(28,48,70,0.85))': ((theme.palette as any).gradient?.card || 'linear-gradient(135deg,#f8fbff 0%,#e3f0ff 100%)'), display:'flex', alignItems:'center', gap:2, minHeight:68, position:'relative', boxShadow: darkMode? '0 2px 6px rgba(0,0,0,0.5)': '0 2px 6px rgba(63,122,185,0.25)', backdropFilter:'blur(12px)', '&:before': { content:'""', position:'absolute', top:0, left:0, right:0, height:3, background: ((theme.palette as any).gradient?.brand || 'linear-gradient(135deg,#1f6fd6 0%,#3a7bd5 55%,#4fa3ff 100%)'), opacity: darkMode? 0.9: 1 } })}>
          {active ? <>
            <Avatar sx={{ width:40, height:40 }}>{active.username[0]?.toUpperCase()}</Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight:1 }}>{active.username}</Typography>
              {active.productId && <Typography variant="caption" color="primary">Product context</Typography>}
              {typing && <Typography variant="caption" color="text.secondary" sx={{ display:'block' }}>typt...</Typography>}
            </Box>
          </> : <Typography>Kies een gesprek</Typography>}
          {active?.productId && (
            <Box sx={{ ml:'auto', display:'flex', alignItems:'center', gap:1 }}>
              <Tooltip title="Bekijk product"><Button size="small" variant="outlined" href={`/product/${active.productId}`} target="_blank">Product</Button></Tooltip>
            </Box>
          )}
          <ToggleButtonGroup size="small" value={layout} exclusive onChange={handleLayoutChange} sx={{ ml: active?.productId ? 1 : 'auto', flexShrink:0,
            '& .MuiToggleButton-root': { textTransform:'none', fontSize:12, px:1.7, borderRadius:2, border:'1px solid rgba(0,0,0,0.08)',
              '&.Mui-selected': { background:'linear-gradient(135deg,#ffffff 0%, #e6f1ff 100%)', boxShadow:'0 0 0 1px #1f6fd6 inset', color:'#1f4d7a' } }
           }}>
            <ToggleButton value="classic">Classic</ToggleButton>
            <ToggleButton value="bubbly">Bubbly</ToggleButton>
            <ToggleButton value="compact">Compact</ToggleButton>
          </ToggleButtonGroup>
          {layout==='bubbly' && (
            <ToggleButtonGroup size="small" color="primary" value={bubbleTheme} exclusive onChange={handleBubbleTheme} sx={{ ml:1, flexWrap:'wrap', maxWidth:520,
              '& .MuiToggleButton-root': { position:'relative', minWidth:54, borderRadius:2, border:'1px solid rgba(0,0,0,0.07)',
               '&:before': { content:'""', position:'absolute', inset:2, borderRadius:1, background: (theme:any)=>'var(--grad,none)', opacity:0.9 },
               '& span': { position:'relative', zIndex:1 },
               '&.Mui-selected': { boxShadow:'0 0 0 1px #1f6fd6 inset', background:'rgba(255,255,255,0.85)' }
              } }}>
              {['blue','green','sunset','purple','ocean','magma','mono','aurora', ...customGradients.map(c=>c.id)].map(key => (
                <ToggleButton key={key} value={key} style={{ ['--grad' as any]: bubbleGradients[key] }}>{key.startsWith('custom-')? 'Custom': key.charAt(0).toUpperCase()+key.slice(1)}</ToggleButton>
              ))}
              <ToggleButton value={bubbleTheme} onClick={()=>setCustomOpen(true)} style={{ ['--grad' as any]: 'linear-gradient(135deg,#999,#444)' }}>+</ToggleButton>
            </ToggleButtonGroup>
          )}
          <FormControlLabel sx={{ ml:1 }} control={<Switch size="small" checked={darkMode} onChange={e=>setDarkMode(e.target.checked)} />} label={<Typography variant="caption">Dark</Typography>} />
        </Box>
        <Box sx={{ flex:1, overflowY:'auto', p: density==='compact'?1: density==='cozy'? 1.5:2, display:'flex', flexDirection:'column', gap: density==='compact'?0.5: density==='cozy'?0.75:1,
          background: darkMode? darkBg : (layout==='bubbly'? convoBackgrounds[bubbleTheme] : 'linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0.4))'),
          color: darkMode? '#d8e4ef':'inherit', transition:'background .6s ease, color .4s ease' }}>
          {messages.map(m => {
            const quoted = m.quotedId ? messages.find(mm=>mm.id===m.quotedId) : undefined;
            const isMine = m.fromUserId===me.id;
            const outgoingBg = bubbleGradients[bubbleTheme];
            const incomingBg = layout==='bubbly' ? (darkMode? 'linear-gradient(135deg,rgba(40,58,78,0.9),rgba(55,80,110,0.85))':'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,245,255,0.85))') : (darkMode? 'rgba(45,64,85,0.85)' : 'rgba(255,255,255,0.9)');
            return (
            <Box key={m.id} sx={{ alignSelf: isMine ? 'flex-end':'flex-start', maxWidth: density==='compact'? '78%': density==='cozy'? '74%':'72%', display:'flex', flexDirection:'column', gap:.5, position:'relative' }}>
              <Paper elevation={0} sx={(theme)=>({ p: density==='compact'?0.7: density==='cozy'?0.95:1.2, pt: quoted? (density==='compact'?0.45: density==='cozy'?0.7:1):(density==='compact'?0.7: density==='cozy'?0.95:1.2), borderRadius: layout==='bubbly'?20:2, background: isMine ? (layout==='bubbly'? outgoingBg: ((theme.palette as any).gradient?.brand || 'linear-gradient(135deg,#1f6fd6 0%,#3a7bd5 55%,#4fa3ff 100%)')) : (layout==='bubbly'? incomingBg : (darkMode? 'rgba(34,55,80,0.9)':'rgba(255,255,255,0.9)')), color: isMine ? '#fff': (darkMode? '#e4eef7':'#162b47'), boxShadow: density==='compact'? '0 1px 3px rgba(0,0,0,.15)': (isMine? '0 3px 10px -2px rgba(31,111,214,.45)': '0 2px 6px rgba(0,0,0,.18)'), backdropFilter:'blur(5px)', position:'relative', border: layout==='bubbly'? (density==='compact'? '1px solid rgba(0,0,0,0.08)':'none') : (darkMode? '1px solid rgba(255,255,255,0.08)':'1px solid rgba(31,111,214,0.25)'),
                transition:'all .25s ease',
                ...(layout==='bubbly'? { '&:hover': { transform:'translateY(-2px)', boxShadow: isMine? '0 6px 16px -4px rgba(31,111,214,.55)': '0 6px 16px -4px rgba(0,0,0,.25)' } }: {}),
                ...(layout==='bubbly'? { '&:after': { content:'""', position:'absolute', bottom:6, width:14, height:14, background: isMine? outgoingBg: incomingBg, transform:'rotate(45deg)', right: isMine? -6: 'auto', left: isMine? 'auto': -6, borderRadius:3, boxShadow: isMine? '0 2px 4px rgba(31,111,214,.35)': '0 2px 4px rgba(0,0,0,.15)' } }: {}) })}>
                {quoted && (
                  <Box sx={{ mb:.6, px:1, py:.5, borderLeft:'3px solid #1f6fd6', bgcolor:'rgba(255,255,255,0.25)', borderRadius:1 }}>
                    <Typography variant="caption" sx={{ display:'block', fontWeight:600 }}>{quoted.fromUserId===me.id? 'Jij': quoted.fromUsername}</Typography>
                    <Typography variant="caption" sx={{ display:'block', opacity:.8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }}>{quoted.body.slice(0,140)}</Typography>
                  </Box>
                )}
                <Typography variant="body2" sx={{ whiteSpace:'pre-wrap', fontSize: layout==='compact'? '0.75rem':'0.8125rem', lineHeight:1.35 }}>{m.body || (m.attachments?.length? '(Bijlage)':'')}</Typography>
                {m.attachments?.length && (
                  <Box sx={{ mt:0.6, display:'flex', flexWrap:'wrap', gap:1 }}>
                    {m.attachments.map(att => (
                      <Box key={att.id} sx={{ width:120, height:80, borderRadius:2, overflow:'hidden', position:'relative', boxShadow:'0 2px 6px rgba(0,0,0,.25)', '& img': { width:'100%', height:'100%', objectFit:'cover', display:'block' } }}>
                        {att.type.startsWith('image/') && <img src={att.dataUrl} alt={att.name} />}
                      </Box>
                    ))}
                  </Box>
                )}
                {m.readAt && isMine && (
                  <Tooltip title={new Date(m.readAt).toLocaleString()}><Box sx={{ position:'absolute', bottom:4, right:6, display:'flex', alignItems:'center', gap:.25, opacity:.8 }}><DoneAllIcon fontSize="inherit" sx={{ fontSize:14, color:'#bde2ff' }} /></Box></Tooltip>
                )}
                <IconButton size="small" onClick={(e)=>openMenu(e,m)} sx={{ position:'absolute', top:2, right:2, opacity:.65, '&:hover':{ opacity:1 } }}><MoreVertIcon fontSize="inherit" /></IconButton>
              </Paper>
              <Typography variant="caption" sx={{ opacity:.5, alignSelf: isMine? 'flex-end':'flex-start', fontSize: density==='compact'?10:11, mt: density==='compact'?0.1:0.25 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</Typography>
            </Box>
          ); })}
        </Box>
        {active && (
          <Box sx={{ p:1.5, borderTop:'1px solid '+ (darkMode? 'rgba(255,255,255,0.06)':'rgba(31,111,214,0.15)'), display:'flex', flexDirection:'column', gap:1, background: darkMode? 'rgba(25,38,52,0.7)':'rgba(255,255,255,0.65)', backdropFilter:'blur(8px)', position:'relative' }}>
            {quote && (
              <Paper variant="outlined" sx={{ mb:1, p:.8, display:'flex', alignItems:'flex-start', gap:1, position:'relative', borderLeft:'4px solid #1f6fd6', background:'rgba(255,255,255,0.6)' }}>
                <Box sx={{ flex:1 }}>
                  <Typography variant="caption" sx={{ fontWeight:600, display:'block' }}>{quote.fromUserId===me.id? 'Jij': quote.fromUsername}</Typography>
                  <Typography variant="caption" sx={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{quote.body.slice(0,160)}</Typography>
                </Box>
                <IconButton size="small" onClick={()=>setQuote(null)} sx={{ ml:1 }}><CloseIcon fontSize="inherit" /></IconButton>
              </Paper>
            )}
            {showEmoji && (
              <Paper elevation={3} sx={{ position:'absolute', bottom:'100%', mb:1, left:8, width:260, maxHeight:260, overflow:'hidden', display:'flex', flexDirection:'column', borderRadius:3 }}>
                <Box sx={{ p:1, borderBottom:'1px solid #e3f0ff', display:'flex', gap:1 }}>
                  <TextField size="small" value={emojiSearch} onChange={e=>setEmojiSearch(e.target.value)} placeholder="Zoek" fullWidth />
                  <IconButton size="small" onClick={()=>setShowEmoji(false)}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ p:1, display:'flex', flexWrap:'wrap', gap:.5, overflowY:'auto' }}>
                  {EMOJIS.filter(e=> !emojiSearch || e.toLowerCase().includes(emojiSearch.toLowerCase())).map(e => (
                    <Button key={e} size="small" onClick={()=>insertEmoji(e)} sx={{ minWidth:36, fontSize:20, lineHeight:1 }}>{e}</Button>
                  ))}
                </Box>
              </Paper>
            )}
            {attachments.length>0 && (
              <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                {attachments.map(a => (
                  <Box key={a.id} sx={{ width:90, height:64, position:'relative', borderRadius:2, overflow:'hidden', boxShadow:'0 2px 6px rgba(0,0,0,.25)', background:'#e3f0ff', '& img': { width:'100%', height:'100%', objectFit:'cover', display:'block' } }}>
                    {a.type.startsWith('image/') && <img src={a.dataUrl} alt={a.name} />}
                    <IconButton size="small" onClick={()=>removeAttachment(a.id)} sx={{ position:'absolute', top:2, right:2, background:'rgba(0,0,0,.45)', color:'#fff', '&:hover':{ background:'rgba(0,0,0,.65)' } }}>
                      <ClearIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ display:'flex', gap:1, alignItems:'flex-end' }}>
              <TextField value={draft} onChange={e=>{ setDraft(e.target.value); if (active) setTyping(active.userId, active.productId); }} fullWidth size="small" multiline maxRows={6} placeholder="Bericht..." onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); } }} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf:'flex-end' }}><IconButton component="label" size="small"><AttachFileIcon fontSize="small" /><input hidden multiple type="file" accept="image/*" onChange={e=>{ handleFiles(e.target.files); e.target.value=''; }} /></IconButton><IconButton size="small" onClick={()=>setShowEmoji(v=>!v)}><EmojiEmotionsIcon fontSize="small" /></IconButton></InputAdornment>, endAdornment: <InputAdornment position="end"><Tooltip title="Verzend"><span><IconButton color="primary" disabled={sending || (!draft.trim() && !attachments.length)} onClick={handleSend}>{sending? <CircularProgress size={18} />:<SendIcon />}</IconButton></span></Tooltip></InputAdornment> }} sx={{ '& .MuiInputBase-root': { background: darkMode? 'rgba(255,255,255,0.08)':'#fff' } }} />
            </Box>
          </Box>
        )}
      </Box>
  </Box>
  <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} elevation={3} transformOrigin={{ vertical:'top', horizontal:'right' }} anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
      <MenuItem onClick={doCopyMessage}><ContentCopyIcon fontSize="small" style={{ marginRight:8 }} /> Kopieer</MenuItem>
      <MenuItem onClick={doQuote}><ReplyIcon fontSize="small" style={{ marginRight:8 }} /> Quote</MenuItem>
      <MenuItem onClick={doForward}><ForwardIcon fontSize="small" style={{ marginRight:8 }} /> Doorsturen</MenuItem>
      <MenuItem onClick={doDelete}><DeleteIcon fontSize="small" style={{ marginRight:8 }} /> Verwijderen</MenuItem>
    </Menu>
    <Snackbar open={!!deleted} autoHideDuration={5000} onClose={()=>setDeleted(null)} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
      <Alert severity="info" variant="filled" action={<Button color="inherit" size="small" onClick={handleUndoDelete}>Undo</Button>} onClose={()=>setDeleted(null)}>Bericht verwijderd</Alert>
    </Snackbar>
    <Dialog open={customOpen} onClose={()=>setCustomOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Eigen gradient</DialogTitle>
      <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
        <Box sx={{ display:'flex', gap:2 }}>
          <Box sx={{ display:'flex', flexDirection:'column', gap:0.5 }}>
            <Typography variant="caption">Kleur 1</Typography>
            <input type="color" value={gradColor1} onChange={e=>setGradColor1(e.target.value)} aria-label="Kleur 1" title="Kleur 1" />
          </Box>
          <Box sx={{ display:'flex', flexDirection:'column', gap:0.5 }}>
            <Typography variant="caption">Kleur 2</Typography>
            <input type="color" value={gradColor2} onChange={e=>setGradColor2(e.target.value)} aria-label="Kleur 2" title="Kleur 2" />
          </Box>
          <Box sx={{ flex:1 }}>
            <Typography variant="caption">Hoek</Typography>
            <Slider size="small" value={gradAngle} onChange={(_,v)=> setGradAngle(v as number)} min={0} max={360} />
          </Box>
        </Box>
        <Box sx={{ height:60, borderRadius:2, boxShadow:'0 0 0 1px rgba(0,0,0,0.15) inset', background:`linear-gradient(${gradAngle}deg,${gradColor1},${gradColor2})` }} />
        <Box sx={{ display:'flex', gap:2 }}>
          <FormControlLabel control={<Switch size="small" checked={density==='compact'} onChange={e=> setDensity(e.target.checked? 'compact':'normal')} />} label={<Typography variant="caption">Compact</Typography>} />
          <FormControlLabel control={<Switch size="small" checked={density==='cozy'} onChange={e=> setDensity(e.target.checked? 'cozy':'normal')} />} label={<Typography variant="caption">Cozy</Typography>} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setCustomOpen(false)}>Sluit</Button>
        <Button variant="contained" onClick={()=>{
          const id = 'custom-' + Date.now();
          const css = `linear-gradient(${gradAngle}deg,${gradColor1},${gradColor2})`;
          setCustomGradients(list => [...list, { id, name:'Custom', css }]);
          setBubbleTheme(id);
          setCustomOpen(false);
        }}>Opslaan</Button>
      </DialogActions>
    </Dialog>
  </>
  );
};
export default Berichten;
