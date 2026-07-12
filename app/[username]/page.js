'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function UserProfile({ params: paramsPromise, searchParams: searchParamsPromise }) {
  const params = use(paramsPromise);
  const searchParams = use(searchParamsPromise);
  const username = params.username;
  const isShopView = searchParams?.shop === '1' || searchParams?.shop === 'true';

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewsUpdated, setViewsUpdated] = useState(false);
  const [lanyardData, setLanyardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchProfileData();
    fetchCurrentUser();
  }, [username]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchLanyard = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLanyardData(data.data);
          }
        }
      } catch (err) {
        console.error("Lanyard error:", err);
      }
    };

    fetchLanyard();
    const interval = setInterval(fetchLanyard, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchProfileData = async () => {
    try {
      // Find the streamer in our system
      const res = await fetch(`/api/streamers`);
      if (res.ok) {
        const streamers = await res.json();
        const found = streamers.find(s => s.username.toLowerCase() === username.toLowerCase());
        
        if (found) {
          // Fetch detailed profile (including socials, background, favorites)
          const detailRes = await fetch(`/api/profile`); // Just a mock or let's use the local API
          // Wait, the detail API /api/profile only returns the LOGGED IN user. We need to fetch details for ANY user!
          // Let's call a specific endpoint or we can get it from an endpoint that returns any user's profile details.
          // Wait! Let's check how we can fetch details for a specific user.
          // We can create a new route `/api/streamers/[username]` or search in details.
          // Let's create an API route `/api/streamers/[username]/route.js` next, or request it.
          // For now, let's fetch from the `/api/streamers/detail?username=...` endpoint, which we will implement.
          const userRes = await fetch(`/api/streamers/detail?username=${username}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
            
            // Fetch products for this specific user
            const productsRes = await fetch(`/api/streamers/products?userId=${userData.id}`);
            if (productsRes.ok) {
              const productsData = await productsRes.json();
              setProducts(productsData);
            }

            // Increment views once
            if (!viewsUpdated) {
              await fetch(`/api/streamers/views`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id })
              });
              setViewsUpdated(true);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Carregando espaço do streamer...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found-container">
        <div className="glass-panel not-found-card">
          <h2>Streamer Não Encontrado</h2>
          <p>O piloto <strong>@{username}</strong> não está cadastrado em nossa cidade.</p>
          <Link href="/" className="glow-btn">Voltar para a Página Inicial</Link>
        </div>
      </div>
    );
  }

  // Calculate product categories and count
  const categories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];
  const getCategoryCount = (cat) => {
    if (cat === 'Todos') return products.length;
    return products.filter(p => p.category === cat).length;
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isShopView) {
    // Render SHOP VIEW (Image 1 style)
    return (
      <div className="shop-view-container">
        {/* Left Sidebar */}
        <aside className="shop-sidebar glass-panel">
          <div className="shop-sidebar-header">
            <span className="shop-icon-yellow">🛍️</span>
            <div>
              <h3>Loja</h3>
              <p className="shop-subtitle">{user.displayName}</p>
            </div>
          </div>
          
          <div className="sidebar-divider"></div>
          
          <div className="shop-categories-title">CATEGORIAS</div>
          <div className="shop-categories-list">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`category-item-btn ${selectedCategory === cat ? 'active' : ''}`}
              >
                <span className="category-name">📦 {cat}</span>
                <span className="category-count">{getCategoryCount(cat)}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-divider"></div>
          
          <Link href={`/${user.username}`} className="sidebar-back-btn">
            👤 Ver Perfil do Streamer
          </Link>
          <Link href="/" className="sidebar-back-btn">
            🏠 Ir para a Home
          </Link>
        </aside>

        {/* Main Content Area */}
        <main className="shop-main-content">
          {/* Top Search bar */}
          <div className="shop-top-bar glass-panel">
            <span className="search-glass">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shop-search-input"
            />
          </div>

          {/* Products Grid */}
          <div className="shop-products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div key={p.id} className="product-card glass-panel">
                  <div className="product-buy-top-banner">Comprar →</div>
                  <div className="product-image-container">
                    <img src={p.image} alt={p.title} className="product-card-image" />
                  </div>
                  <div className="product-card-details">
                    <h4 className="product-card-title">{p.title}</h4>
                    <p className="product-card-desc">{p.description}</p>
                    <div className="product-card-footer">
                      <span className="product-card-price">R$ {p.price.toFixed(2)}</span>
                      <a href={`https://discord.com/users/${user.id}`} target="_blank" className="glow-btn buy-card-btn">
                        Comprar →
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products-message glass-panel">
                Nenhum produto encontrado nesta categoria.
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Render PROFILE VIEW (Image 2 style)
  return (
    <div 
      className="profile-view-container"
      style={{ backgroundImage: `url(${user.background})` }}
    >
      <div className="profile-backdrop-overlay"></div>
      
      {/* Home shortcut */}
      <Link href="/" className="profile-home-link">
        <img src="/images/midnight-logo.png" alt="Midnight Logo" style={{ height: '70px', objectFit: 'contain' }} />
      </Link>

      <main className="profile-card-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="profile-card-floating" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', zIndex: 10 }}>
          
          {/* Avatar Area */}
          <div className="profile-avatar-circle" style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '20px' }}>
            <img src={user.avatar} alt={user.displayName} className="profile-avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
            {user.verified && (
              <span className="profile-verified-checkmark" style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#3b82f6', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', border: '2px solid #000', fontWeight: '900' }}>✓</span>
            )}
          </div>

          {/* Name */}
          <h2 className="profile-display-name-centered" style={{ fontSize: '32px', fontWeight: '800', textTransform: 'uppercase', color: 'white', marginBottom: '8px', letterSpacing: '0.5px' }}>
            {user.displayName}
          </h2>

          {/* Bio tagline */}
          <p className="profile-bio-text-centered" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px', fontStyle: 'italic', maxWidth: '380px', lineHeight: '1.4' }}>
            {user.bio || "don't be a copy, be the reference"}
          </p>

          {/* Flag list */}
          {user.flags && (
            <div className="profile-flags-row" style={{ fontSize: '22px', display: 'flex', gap: '10px', marginBottom: '24px' }}>
              {user.flags}
            </div>
          )}

          {/* Social Links Icons Row */}
          <div className="profile-social-icons-centered" style={{ display: 'flex', gap: '14px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {user.socials?.instagram && (
              <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" className="social-circle-btn" title="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            )}
            {user.socials?.x && (
              <a href={`https://x.com/${user.socials.x}`} target="_blank" className="social-circle-btn" title="X (Twitter)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {user.socials?.twitch && (
              <a href={`https://twitch.tv/${user.socials.twitch}`} target="_blank" className="social-circle-btn" title="Twitch">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
              </a>
            )}
            {user.socials?.youtube && (
              <a href={`https://youtube.com/${user.socials.youtube}`} target="_blank" className="social-circle-btn" title="YouTube">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.528 3.545 12 3.545 12 3.545s-7.528 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.022 0 12 0 12s0 3.978.502 5.837a3.003 3.003 0 002.11 2.11c1.86.508 9.388.508 9.388.508s7.528 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.978 24 12 24 12s0-3.978-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
            {user.socials?.steam && (
              <a href={`https://steamcommunity.com/id/${user.socials.steam}`} target="_blank" className="social-circle-btn" title="Steam">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.979 0A12 12 0 000 11.995c0 5.485 3.68 10.114 8.74 11.533l1.104-4.575a3.46 3.46 0 01-.194-1.129c0-1.802 1.402-3.284 3.178-3.435l2.457-3.522a3.46 3.46 0 01.077-4.88 3.42 3.42 0 014.826 0 3.46 3.46 0 010 4.88 3.42 3.42 0 01-4.801.054l-3.513 2.454a3.45 3.45 0 01-1.144.179 3.46 3.46 0 01-3.232-2.222l-4.492-1.3A11.97 11.97 0 0012 23.99c6.627 0 12-5.373 12-12S18.607 0 11.979 0zM7.35 15.006l4.24 1.23a1.92 1.92 0 001.81-1.222 1.94 1.94 0 00-1.81-2.58h-.024a1.92 1.92 0 00-1.786 1.226l-4.225-1.224a9.7 9.7 0 011.795-3.77z"/></svg>
              </a>
            )}
            {user.socials?.spotify && (
              <a href={`https://open.spotify.com/user/${user.socials.spotify}`} target="_blank" className="social-circle-btn" title="Spotify">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12 12-5.372 12-12S18.627 0 12 0zm5.489 17.309c-.218.359-.687.472-1.046.25-2.903-1.776-6.557-2.177-10.858-1.194-.41.093-.82-.166-.913-.576-.093-.41.167-.82.576-.913 4.708-1.076 8.736-.615 11.99 1.38.36.218.472.686.251 1.043zm1.467-3.262c-.275.446-.86.591-1.306.315-3.323-2.043-8.39-2.634-12.31-1.444-.501.15-1.029-.133-1.18-.634-.15-.501.134-1.029.634-1.18 4.49-1.36 10.07-.7 13.85 1.624.446.275.592.86.312 1.319zm.126-3.374C14.73 7.822 7.55 7.585 3.393 8.847c-.64.195-1.316-.164-1.511-.806-.195-.64.164-1.316.806-1.51 4.78-1.452 12.72-1.173 17.74 1.808.577.342.766 1.09.424 1.666-.342.578-1.094.767-1.664.425z"/></svg>
              </a>
            )}
            {user.socials?.kick && (
              <a href={`https://kick.com/${user.socials.kick}`} target="_blank" className="social-circle-btn" title="Kick">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M0 0h5.085v3.39H8.47v3.39h3.39V0h5.085v6.78h-3.39v3.39h3.39v6.78H13.56v3.39H8.47v-3.39H5.085V24H0V0zm18.915 6.78H24v10.44h-5.085V6.78z"/></svg>
              </a>
            )}
            {user.socials?.discord && (
              <a href={`https://discord.com/users/${user.id}`} target="_blank" className="social-circle-btn" title="Discord">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 11-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/></svg>
              </a>
            )}
            {currentUser && currentUser.id === user.id ? (
              <Link href="/dashboard" className="social-circle-btn" style={{ background: 'rgba(139, 92, 246, 0.25)', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc', fontWeight: '800', fontSize: '13px' }} title="Adicionar Redes Sociais">
                ➕
              </Link>
            ) : (
              <span className="social-circle-btn-more">-5</span>
            )}
          </div>

          {/* Discord Live Status capsule (Syncing from Lanyard in real-time) */}
          <div className="discord-status-capsule" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderRadius: '100px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', minWidth: '220px', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div className="capsule-avatar-wrapper" style={{ position: 'relative', width: '32px', height: '32px' }}>
              <img src={user.avatar} alt="Discord Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              <span className="status-dot" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '11px', height: '11px', borderRadius: '50%', border: '2px solid #000', background: lanyardData ? (lanyardData.discord_status === 'online' ? '#22c55e' : lanyardData.discord_status === 'dnd' ? '#ef4444' : lanyardData.discord_status === 'idle' ? '#eab308' : '#94a3b8') : '#94a3b8' }}></span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{user.username}</span>
            {user.discordServerTag && (
              <span className="guild-tag" style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px', color: '#a855f7', letterSpacing: '0.5px' }}>
                {user.discordServerTag}
              </span>
            )}
          </div>

          {/* Favorite Game block (Real-time presence game sync / Fallback) */}
          {(lanyardData?.activities?.find(a => a.type === 0) || user.favoriteGame) && (
            <div className="favorite-game-block-premium" style={{ width: '100%', maxWidth: '380px', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', borderRadius: '16px', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', justifyContent: 'space-between', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={
                    lanyardData?.activities?.find(a => a.type === 0) 
                      ? (lanyardData.activities.find(a => a.type === 0).assets?.large_image?.startsWith('spotify:') 
                        ? lanyardData.spotify.album_art_url 
                        : `https://cdn.discordapp.com/app-assets/${lanyardData.activities.find(a => a.type === 0).application_id}/${lanyardData.activities.find(a => a.type === 0).assets?.large_image}.png`)
                      : (user.favoriteGameImage || '/images/game-placeholder.jpg')
                  } 
                  alt="Game Art" 
                  style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = user.favoriteGameImage || '/images/game-placeholder.jpg'; }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                    {lanyardData?.activities?.find(a => a.type === 0) ? 'Jogando agora:' : 'Jogo favorito:'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>
                    {lanyardData?.activities?.find(a => a.type === 0)?.name || user.favoriteGame}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)' }}>❯</span>
            </div>
          )}

          {/* Spotify / Playlist block (Real-time Spotify sync / Fallback) */}
          {(lanyardData?.listening_to_spotify || user.playlistName || user.favoriteMusic) && (
            <div className="favorite-music-block-premium" style={{ width: '100%', maxWidth: '380px', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', borderRadius: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', justifyContent: 'space-between', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={
                    lanyardData?.listening_to_spotify 
                      ? lanyardData.spotify.album_art_url 
                      : (user.playlistImage || user.favoriteMusicImage || '/images/music-placeholder.jpg')
                  } 
                  alt="Music Cover" 
                  style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = user.playlistImage || user.favoriteMusicImage || '/images/music-placeholder.jpg'; }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                    {lanyardData?.listening_to_spotify ? 'Ouvindo no Spotify:' : 'Playlist favorita:'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lanyardData?.listening_to_spotify 
                      ? `${lanyardData.spotify.song} - ${lanyardData.spotify.artist}` 
                      : (user.playlistName || user.favoriteMusic)}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)' }}>❮</span>
            </div>
          )}

          {/* Views stats & Store path */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <span className="profile-views-count" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              👁️ {user.views?.toLocaleString()} visualizações
            </span>
            <Link href={`/${user.username}?shop=1`} className="glow-btn" style={{ padding: '8px 24px', borderRadius: '100px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'none' }}>
              🛒 Visitar Bazar
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
}
