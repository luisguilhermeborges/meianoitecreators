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

  useEffect(() => {
    fetchProfileData();
  }, [username]);

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
        🏠 midnight
      </Link>

      <main className="profile-card-wrapper">
        <div className="profile-card glass-panel">
          
          {/* Avatar Area */}
          <div className="profile-avatar-circle">
            <img src={user.avatar} alt={user.displayName} className="profile-avatar-img" />
            {user.verified && <span className="profile-verified-checkmark">✓</span>}
          </div>

          <h2 className="profile-display-name">{user.displayName}</h2>
          <p className="profile-bio-text">{user.bio}</p>

          <div className="card-divider-dashed"></div>

          {/* Social Links */}
          <div className="profile-social-icons">
            {user.socials?.instagram && (
              <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" className="social-icon instagram" title="Instagram">
                📸
              </a>
            )}
            {user.socials?.youtube && (
              <a href={`https://youtube.com/${user.socials.youtube}`} target="_blank" className="social-icon youtube" title="YouTube">
                🎥
              </a>
            )}
            {user.socials?.twitch && (
              <a href={`https://twitch.tv/${user.socials.twitch}`} target="_blank" className="social-icon twitch" title="Twitch">
                🎮
              </a>
            )}
            {user.socials?.discord && (
              <a href={`https://discord.com/users/${user.id}`} target="_blank" className="social-icon discord" title="Discord Link">
                💬
              </a>
            )}
          </div>

          <div className="card-divider-dashed"></div>

          {/* Favorite Game */}
          {user.favoriteGame && (
            <div className="favorite-game-block">
              {user.favoriteGameImage && (
                <img src={user.favoriteGameImage} alt={user.favoriteGame} className="fav-game-img" />
              )}
              <div className="fav-game-info">
                <span className="fav-label">Jogo favorito:</span>
                <span className="fav-name">{user.favoriteGame}</span>
              </div>
              <span className="fav-arrow">›</span>
            </div>
          )}

          {user.favoriteGame && <div className="card-divider-dashed"></div>}

          {/* Favorite Music */}
          {user.favoriteMusic && (
            <div className="favorite-music-block">
              <div className="fav-music-info">
                <span className="fav-label">Música favorita:</span>
                <span className="fav-name">{user.favoriteMusic}</span>
              </div>
              {user.favoriteMusicImage && (
                <img src={user.favoriteMusicImage} alt="Album Art" className="fav-music-img" />
              )}
            </div>
          )}

          {user.favoriteMusic && <div className="card-divider-dashed"></div>}

          {/* Views stats & Store path */}
          <div className="profile-footer-stats">
            <span className="profile-views-count">👁️ {user.views?.toLocaleString()} visualizações</span>
            <Link href={`/${user.username}?shop=1`} className="glow-btn profile-shop-btn">
              🛒 Ir para a Loja
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
}
