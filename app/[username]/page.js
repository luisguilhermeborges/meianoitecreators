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
              <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" className="social-circle-btn">
                📸
              </a>
            )}
            {user.socials?.twitch && (
              <a href={`https://twitch.tv/${user.socials.twitch}`} target="_blank" className="social-circle-btn">
                🎮
              </a>
            )}
            {user.socials?.youtube && (
              <a href={`https://youtube.com/${user.socials.youtube}`} target="_blank" className="social-circle-btn">
                🎥
              </a>
            )}
            {user.socials?.discord && (
              <a href={`https://discord.com/users/${user.id}`} target="_blank" className="social-circle-btn">
                💬
              </a>
            )}
            {currentUser && currentUser.id === user.id ? (
              <Link href="/dashboard" className="social-circle-btn" style={{ background: 'rgba(139, 92, 246, 0.25)', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc', fontWeight: '800', fontSize: '13px' }} title="Adicionar Redes Sociais">
                ➕
              </Link>
            ) : (
              <span className="social-circle-btn-more">+5</span>
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
