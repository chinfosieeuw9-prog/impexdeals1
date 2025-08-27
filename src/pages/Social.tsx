import React, { useState } from 'react';
import { getCurrentUser } from '../services/authService';
import './Social.css';

interface Comment {
  id: string;
  user: string;
  text: string;
  minutesAgo: number;
}

interface Post {
  id: string;
  user: string;
  handle: string;
  avatarColor: string;
  minutesAgo: number;
  text: string;
  image?: string;
  likes: number;
  comments: number; // count cache
  shares: number;
  verified?: boolean;
  liked?: boolean;
  saved?: boolean;
  commentList?: Comment[];
  openComments?: boolean;
}

const seedPosts: Post[] = [
  {
    id: '1',
    user: 'TechTrader',
    handle: 'TechTrader_NL',
    avatarColor: '3b82f6',
    minutesAgo: 120,
    text: 'Zojuist een geweldige partij laptops verkocht! 💻✨ AI matching werkte perfect! #TechDeals #ImportExport',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  likes: 24,
  comments: 0,
    shares: 12,
    verified: true
  },
  {
    id: '2',
    user: 'RetailMaster',
    handle: 'RetailMaster',
    avatarColor: '10b981',
    minutesAgo: 240,
    text: 'AR product viewer is mind-blowing! 🥽 Meubels bekijken alsof ze al in de winkel staan. Game changer! 🚀',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
  likes: 156,
  comments: 0,
    shares: 45,
    verified: true
  },
  {
    id: '3',
    user: 'EcoTrading',
    handle: 'EcoTrading',
    avatarColor: '059669',
    minutesAgo: 2880,
    text: 'Supply chain gerevolutioneerd! 📈 IoT tracking + blockchain = perfect. CO2 footprint -40%. 🌍 #SmartLogistics',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
  likes: 89,
  comments: 0,
    shares: 28,
    verified: true
  }
];

const trendingTags = [
  { tag: 'ImportExport', count: 15420 },
  { tag: 'TechTrading', count: 8930 },
  { tag: 'BlockchainBusiness', count: 5670 },
  { tag: 'AIMatching', count: 4580 },
  { tag: 'IoTTracking', count: 3210 },
  { tag: 'ARCommerce', count: 2840 },
  { tag: 'SmartLogistics', count: 2156 },
  { tag: 'DigitalTrade', count: 1890 }
];

interface SuggestedProfile { user: string; color: string; followers: string; followed?: boolean }

const suggestedSeed: SuggestedProfile[] = [
  { user: 'TechGuru_NL', color: '8b5cf6', followers: '500+' },
  { user: 'RetailKing', color: 'ef4444', followers: '1.2K' },
  { user: 'StartupQueen', color: '10b981', followers: '800+' },
];

const Social: React.FC = () => {
  const user = getCurrentUser();
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const raw = localStorage.getItem('social_posts_v1');
      if (raw) return JSON.parse(raw) as Post[];
    } catch {}
    return seedPosts;
  });
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedProfile[]>(() => {
    try {
      const raw = localStorage.getItem('social_follow_v1');
      if (raw) return JSON.parse(raw) as SuggestedProfile[];
    } catch {}
    return suggestedSeed;
  });

  // Persist posts & follow data
  React.useEffect(()=> { try { localStorage.setItem('social_posts_v1', JSON.stringify(posts)); } catch {} }, [posts]);
  React.useEffect(()=> { try { localStorage.setItem('social_follow_v1', JSON.stringify(suggested)); } catch {} }, [suggested]);

  // Update time every minute
  React.useEffect(()=> {
    const t = setInterval(()=> {
      setPosts(p => p.map(post => ({ ...post, minutesAgo: post.minutesAgo + 1 })));
    }, 60_000);
    return ()=> clearInterval(t);
  }, []);

  const focusComposer = () => {
    if (!user) return; // no focus if not logged in
    document.getElementById('composer-textarea')?.focus();
    document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const addPost = () => {
  if (!user || !composer.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setPosts(prev => [
        {
          id: Date.now().toString(),
      user: user.username,
      handle: user.username,
          avatarColor: '2b5f9f',
          minutesAgo: 0,
            text: composer.trim(),
          likes: 0,
          comments: 0,
          shares: 0,
          verified: false
        },
        ...prev
      ]);
      setComposer('');
      setLoading(false);
    }, 600);
  };

  const toggleLike = (id: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p));
  };

  const toggleSave = (id: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const toggleComments = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, openComments: !p.openComments } : p));
  };

  const addComment = (id: string, text: string) => {
    if (!user) return;
    if (!text.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const list = p.commentList || [];
      const newComment: Comment = { id: Date.now().toString(), user: user.username, text: text.trim(), minutesAgo: 0 };
      return { ...p, commentList: [newComment, ...list], comments: list.length + 1, openComments: true };
    }));
  };

  // Increment minutesAgo for comments too
  React.useEffect(()=> {
    const t2 = setInterval(()=> {
      setPosts(prev => prev.map(p => p.commentList ? { ...p, commentList: p.commentList!.map(c => ({ ...c, minutesAgo: c.minutesAgo + 1 })) } : p));
    }, 60_000);
    return ()=> clearInterval(t2);
  }, []);

  const deletePost = (id: string) => {
    if (!user) return;
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const sharePost = async (id: string) => {
    const url = window.location.origin + '/social#post-' + id;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link gekopieerd naar klembord');
    } catch {
      alert(url);
    }
  };

  const loadMore = () => {
    const more: Post[] = Array.from({length:3}).map((_,i)=> ({
      id: 'old_'+Date.now()+'_'+i,
      user: 'Archivist',
      handle: 'ArchiveBot',
      avatarColor: '555777',
      minutesAgo: 4320 + i*30,
      text: 'Historische post #' + (i+1) + ' uit het archief voor demo doeleinden.',
      likes: Math.floor(Math.random()*50),
      comments: 0,
      shares: Math.floor(Math.random()*10)
    }));
    setPosts(prev => [...prev, ...more]);
  };

  // Infinite scroll listener
  React.useEffect(()=> {
    const onScroll = () => {
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400)) {
        loadMore();
      }
    };
    window.addEventListener('scroll', onScroll);
    return ()=> window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFollow = (user: string) => {
    setSuggested(prev => prev.map(s => s.user === user ? { ...s, followed: !s.followed } : s));
  };

  const scrollToSuggested = () => {
    document.getElementById('suggested-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="social-wrap">
      <div className="social-header">
        <h1>Social Trading Hub</h1>
        <p className="lead">Verbind, deel en ontdek in onze levendige handelsgemeenschap. Waar deals tot stand komen en netwerken groeien.</p>
        <div className="social-actions">
      <button className="pill-btn primary" disabled={!user} title={user?'+ Nieuwe Post':'Log in om te posten'} onClick={focusComposer}>+ Nieuwe Post</button>
      <button className="pill-btn" disabled={!user} title={user?'Zoek traders':'Log in om te volgen'} onClick={scrollToSuggested}>Volg Traders</button>
        </div>
      </div>
      <div className="social-layout">
        <main className="feed">
          <section className="composer">
              <div className="avatar static">J</div>
            <div className="composer-body">
              <textarea
        id="composer-textarea"
                placeholder="Deel iets met de community..."
                value={composer}
                onChange={e => setComposer(e.target.value)}
                rows={3}
                disabled={!user}
              />
              <div className="composer-bar">
                <div className="mini-tools">
                  <span title="Foto">🖼️</span>
                  <span title="Video">📹</span>
                  <span title="Poll">🗳️</span>
                  <span title="Analytics">📊</span>
                </div>
                <button disabled={!user || !composer.trim() || loading} onClick={addPost} className="pill-btn primary small">{user? (loading?'Posten...':'Posten') : 'Log in'}</button>
              </div>
            </div>
          </section>
          <h5 className="subhead">Live Feed</h5>
          {posts.map(p => (
            <article key={p.id} className="post" id={'post-'+p.id}>
              <div className="avatar dynamic" data-avatar={p.avatarColor}>{p.user.charAt(0)}</div>
              <div className="post-body">
                <header>
                  <strong>{p.user}</strong>{' '}
                  {p.verified && <span className="veri">✔</span>}{' '}
                  <span className="handle">@{p.handle}</span>
                  <span className="dot" />
                  <time>{p.minutesAgo < 60 ? `${p.minutesAgo}m` : p.minutesAgo < 1440 ? `${Math.round(p.minutesAgo/60)}u` : `${Math.round(p.minutesAgo/1440)}d`}</time>
                </header>
                <p className="text">{p.text}</p>
                {p.image && (
                  <div className="media"><img src={p.image} alt="post" /></div>
                )}
                <footer className="post-actions">
                  <button disabled={!user} onClick={() => toggleLike(p.id)}>{p.liked ? '💙' : '❤'} {p.likes}</button>
                  <button onClick={() => toggleComments(p.id)}>💬 {p.comments}</button>
                  <button onClick={() => sharePost(p.id)}>🔁 {p.shares}</button>
                  <button disabled={!user} onClick={() => toggleSave(p.id)}>{p.saved ? '🔖' : '📑'} Bewaar</button>
                  {user && p.user === user.username && <button onClick={() => deletePost(p.id)}>🗑️ Verwijder</button>}
                </footer>
                {p.openComments && (
                  <div className="comments" id={'post-'+p.id}>
                    {user ? <CommentBox postId={p.id} addComment={addComment} /> : <div className="comment-login">Log in om te reageren.</div>}
                    <ul className="comment-list">
                      {(p.commentList||[]).map(c => (
                        <li key={c.id} className="comment"><strong>{c.user}</strong> {c.text} <span className="time">{c.minutesAgo<60? c.minutesAgo+'m' : Math.round(c.minutesAgo/60)+'u'}</span></li>
                      ))}
                      {(!p.commentList||p.commentList.length===0) && <li className="comment empty">Nog geen reacties.</li>}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
          <div className="center-more">
            <button className="pill-btn small" onClick={loadMore}>Meer Laden</button>
          </div>
        </main>
        <aside className="side">
          <section className="panel">
            <h5 className="subhead">Trending Now</h5>
            <div className="tags">
              {trendingTags.map(t => (
                <span key={t.tag} className="tag" onClick={()=>{ if(!user) return; setComposer(c=> (c? c+ ' ':'') + '#'+t.tag ); focusComposer();}}>#{t.tag} <small>{t.count.toLocaleString('nl-NL')}</small></span>
              ))}
            </div>
          </section>
    <section className="panel" id="suggested-box">
            <h5 className="subhead">Suggested Follows</h5>
            <ul className="suggested">
              {suggested.map(s => (
                <li key={s.user}>
                  <div className="avatar small dynamic" data-avatar={s.color}>{s.user.charAt(0)}</div>
                  <div className="info">
                    <strong>{s.user}</strong>
                    <span className="meta">{s.followers} volgers</span>
                  </div>
                  <button disabled={!user} onClick={() => toggleFollow(s.user)} className={`pill-btn tiny follow-btn ${s.followed ? 'following':''}`}>{s.followed ? 'Volgend' : 'Volgen'}</button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel stats">
            <h5 className="subhead">Jouw Stats</h5>
            <div className="stats-grid">
              <div><span className="val">3</span><span className="label">Posts vandaag</span></div>
              <div><span className="val">1.234</span><span className="label">Totaal likes</span></div>
              <div><span className="val">567</span><span className="label">Volgers</span></div>
              <div><span className="val">8.5%</span><span className="label">Engagement</span></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Social;

// Lightweight comment box component
const CommentBox: React.FC<{ postId: string; addComment: (id:string,text:string)=>void }> = ({ postId, addComment }) => {
  const [value,setValue] = useState('');
  return (
    <form className="comment-box" onSubmit={e=>{e.preventDefault();addComment(postId,value);setValue('');}}>
      <input
        value={value}
        onChange={e=>setValue(e.target.value)}
        placeholder="Plaats een reactie..."
        className="comment-input"
      />
      <button type="submit" disabled={!value.trim()} className="pill-btn tiny">Reageren</button>
    </form>
  );
};
