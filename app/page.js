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

  // Split streamers into online vs offline for visual organization, or column systems
  const onlineStreamers = filteredStreamers.filter(s => s.isOnline);
  const offlineStreamers = filteredStreamers.filter(s => !s.isOnline);

  return (
    <div className="home-container">
      {/* Background Star Particle Effect Mock CSS */}
      <div className="stars-overlay"></div>

      <header className="home-header">
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/midnight-logo.png" alt="Midnight Logo" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
          <span className="logo-text-fallback" style={{ display: 'none', fontSize: '20px', fontWeight: '800' }}><span className="logo-accent">mid</span>night</span>
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
          <h2>Encontre os Streamers da Cidade</h2>
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

        {/* Streamers Grid Panel */}
        <section className="streamers-container-grid">
          {/* Online Column/Section */}
          <div className="streamers-column">
            <div className="column-header">
              <span className="live-dot-glow"></span>
              <h3>AO VIVO AGORA</h3>
            </div>
            <div className="streamers-grid">
              {onlineStreamers.length > 0 ? (
                onlineStreamers.map(s => (
                  <Link href={`/${s.username}`} key={s.id} className="streamer-card card-online">
                    <div className="card-avatar-wrapper">
                      <img src={s.avatar} alt={s.displayName} className="card-avatar" />
                      <span className="online-tag">LIVE</span>
                    </div>
                    <div className="card-info">
                      <div className="card-name-wrapper">
                        <h4>{s.displayName}</h4>
                        {s.verified && <span className="verified-badge">✓</span>}
                      </div>
                      <span className="card-username">@{s.username}</span>
                      <div className="card-tags">
                        {s.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className="card-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-column-message">
                  Nenhum streamer em live no momento.
                </div>
              )}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="grid-vertical-divider"></div>

          {/* Offline Column/Section */}
          <div className="streamers-column">
            <div className="column-header">
              <span className="offline-dot"></span>
              <h3>OFFLINE</h3>
            </div>
            <div className="streamers-grid">
              {offlineStreamers.length > 0 ? (
                offlineStreamers.map(s => (
                  <Link href={`/${s.username}`} key={s.id} className="streamer-card">
                    <div className="card-avatar-wrapper">
                      <img src={s.avatar} alt={s.displayName} className="card-avatar" />
                    </div>
                    <div className="card-info">
                      <div className="card-name-wrapper">
                        <h4>{s.displayName}</h4>
                        {s.verified && <span className="verified-badge">✓</span>}
                      </div>
                      <span className="card-username">@{s.username}</span>
                      <div className="card-tags">
                        {s.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className="card-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-column-message">
                  Nenhum streamer cadastrado.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer-text">
        <p>&copy; {new Date().getFullYear()} Midnight RP - Todos os direitos reservados. Design Premium.</p>
      </footer>
    </div>
  );
}
