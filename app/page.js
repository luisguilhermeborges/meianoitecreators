'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [streamers, setStreamers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showMockLogin, setShowMockLogin] = useState(false);
  const [mockUsername, setMockUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreamers();
    checkSession();
  }, []);

  const fetchStreamers = async () => {
    try {
      const res = await fetch('/api/streamers');
      if (res.ok) {
        const data = await res.json();
        setStreamers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLoginSubmit = async (e) => {
    e.preventDefault();
    if (!mockUsername.trim()) return;

    try {
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: mockUsername })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setShowMockLogin(false);
        fetchStreamers(); // Refresh streamers list
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        const err = await res.json();
        setError(err.error || 'Login falhou');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    fetchStreamers();
  };

  const filteredStreamers = streamers.filter(s =>
    s.displayName.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  // Split streamers into online vs offline
  const onlineStreamers = filteredStreamers.filter(s => s.isOnline);
  
  // Split ALL filtered streamers into two columns for the double grid (Image 3 style)
  const halfIndex = Math.ceil(filteredStreamers.length / 2);
  const leftColumnStreamers = filteredStreamers.slice(0, halfIndex);
  const rightColumnStreamers = filteredStreamers.slice(halfIndex);

  return (
    <div className="home-container">
      {/* Background Star Particle Effect Mock CSS */}
      <div className="stars-overlay"></div>

      <header className="home-header">
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/midnight-logo.png" alt="Midnight Logo" style={{ height: '65px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
          <span className="logo-text-fallback" style={{ display: 'none', fontSize: '24px', fontWeight: '800' }}><span className="logo-accent">mid</span>night</span>
        </div>
        
        <div className="header-actions">
          {loading ? (
            <div className="spinner-small"></div>
          ) : currentUser ? (
            <div className="user-profile-badge">
              <img src={currentUser.avatar} alt={currentUser.displayName} className="small-avatar" />
              <span className="user-name">{currentUser.displayName}</span>
              <Link href="/dashboard" className="glow-btn header-btn">Painel</Link>
              <button onClick={handleLogout} className="logout-btn">Sair</button>
            </div>
          ) : (
            <div className="login-group">
              <Link href="/api/auth/discord" className="discord-btn">
                <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.89-.65,1.76-1.34,2.58-2.07a75.17,75.17,0,0,0,72.68,0c.83.73,1.69,1.42,2.58,2.07a68.74,68.74,0,0,1-10.5,5,77.5,77.5,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.6-18.83C129.87,48.24,123.63,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
                Entrar com Discord
              </Link>
              <button onClick={() => setShowMockLogin(true)} className="glow-btn">
                Login Rápido (Dev)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mock Login Modal */}
      {showMockLogin && (
        <div className="modal-overlay">
          <div className="login-modal glass-panel">
            <h3>Login de Desenvolvedor</h3>
            <p>Crie ou acesse uma conta de teste instantaneamente digitando um nome de usuário Discord fictício:</p>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleMockLoginSubmit}>
              <input 
                type="text" 
                placeholder="Ex: streamer_felipe" 
                value={mockUsername}
                onChange={(e) => setMockUsername(e.target.value)}
                autoFocus
                className="modal-input"
              />
              <div className="modal-actions">
                <button type="submit" className="glow-btn">Entrar</button>
                <button type="button" onClick={() => setShowMockLogin(false)} className="cancel-btn">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="home-main">
        {/* Main Search Panel */}
        <section className="search-section">
          <h2>Onde o verdadeiro roleplay acontece!</h2>
          <div className="search-bar-container">
            <input 
              type="text" 
              placeholder="Buscar streamer pelo nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </section>

        {/* Online Streams Horizontal Swipe Row */}
        <section className="live-slider-section">
          <div className="column-header">
            <span className="live-dot-glow"></span>
            <h3>AO VIVO AGORA</h3>
          </div>
          <div className="live-streams-row">
            {onlineStreamers.length > 0 ? (
              onlineStreamers.map(s => (
                <Link href={`/${s.username}`} key={s.id} className="live-stream-slide">
                  <div className="slide-avatar-wrapper">
                    <img src={s.avatar} alt={s.displayName} className="slide-avatar" />
                    <span className="slide-live-badge">LIVE</span>
                  </div>
                  <div className="slide-info">
                    <div className="slide-name-wrapper">
                      <h4>{s.displayName}</h4>
                      {s.verified && <span className="verified-badge">✓</span>}
                    </div>
                    <span className="slide-username">@{s.username}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-slider-message">
                Nenhum streamer em live no momento.
              </div>
            )}
          </div>
        </section>

        {/* Double Column Grid Section (pilotos.gg layout style) */}
        <section className="pilotos-double-panel">
          {/* Left Column Grid */}
          <div className="pilotos-panel-column">
            <div className="pilotos-panel-grid">
              {leftColumnStreamers.length > 0 ? (
                leftColumnStreamers.map(s => (
                  <Link href={`/${s.username}`} key={s.id} className="piloto-grid-card">
                    <div className="grid-card-avatar-wrapper">
                      <img src={s.avatar} alt={s.displayName} className="grid-card-avatar" />
                      {s.verified && <span className="grid-card-verified">✓</span>}
                    </div>
                    <div className="grid-card-info">
                      <div className="grid-card-name-row">
                        <h4>{s.displayName}</h4>
                      </div>
                      <span>@{s.username}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-column-message">Nenhum perfil nesta coluna.</div>
              )}
            </div>
          </div>

          {/* Vertical Separator Line */}
          <div className="pilotos-panel-divider"></div>

          {/* Right Column Grid */}
          <div className="pilotos-panel-column">
            <div className="pilotos-panel-grid">
              {rightColumnStreamers.length > 0 ? (
                rightColumnStreamers.map(s => (
                  <Link href={`/${s.username}`} key={s.id} className="piloto-grid-card">
                    <div className="grid-card-avatar-wrapper">
                      <img src={s.avatar} alt={s.displayName} className="grid-card-avatar" />
                      {s.verified && <span className="grid-card-verified">✓</span>}
                    </div>
                    <div className="grid-card-info">
                      <div className="grid-card-name-row">
                        <h4>{s.displayName}</h4>
                      </div>
                      <span>@{s.username}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-column-message">Nenhum perfil nesta coluna.</div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer-text">
        <p>Midnight</p>
      </footer>
    </div>
  );
}
