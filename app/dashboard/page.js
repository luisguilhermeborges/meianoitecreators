'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'shop' | 'status'
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    background: '',
    bio: '',
    tags: '',
    favoriteGame: '',
    favoriteGameImage: '',
    favoriteMusic: '',
    favoriteMusicImage: '',
    flags: '',
    playlistName: '',
    playlistImage: '',
    discordServerTag: '',
    socials: {
      instagram: '',
      youtube: '',
      twitch: '',
      discord: ''
    }
  });

  // Shop Form State
  const [shopForm, setShopForm] = useState({
    id: '', // Empty means new product
    title: '',
    description: '',
    price: '',
    image: '',
    category: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        // Not logged in or error
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      setUser(data);
      
      // Map to form
      setProfileForm({
        displayName: data.displayName || '',
        background: data.background || '',
        bio: data.bio || '',
        tags: data.tags ? data.tags.join(', ') : '',
        favoriteGame: data.favoriteGame || '',
        favoriteGameImage: data.favoriteGameImage || '',
        favoriteMusic: data.favoriteMusic || '',
        favoriteMusicImage: data.favoriteMusicImage || '',
        flags: data.flags || '',
        playlistName: data.playlistName || '',
        playlistImage: data.playlistImage || '',
        discordServerTag: data.discordServerTag || '',
        socials: {
          instagram: data.socials?.instagram || '',
          youtube: data.socials?.youtube || '',
          twitch: data.socials?.twitch || '',
          discord: data.socials?.discord || ''
        }
      });

      // Fetch shop products
      const shopRes = await fetch('/api/shop');
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setProducts(shopData);
      }
    } catch (err) {
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    const formattedTags = profileForm.tags
      ? profileForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          tags: formattedTags
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setSuccessMsg('Perfil atualizado com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError('Falha ao atualizar perfil');
      }
    } catch (err) {
      setError('Erro de rede');
    }
  };

  const handleStatusToggle = async () => {
    setError(null);
    const newStatus = !user.isOnline;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setSuccessMsg(`Você agora está ${newStatus ? 'AO VIVO' : 'OFFLINE'}!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Erro de rede ao mudar status');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    const isEdit = !!shopForm.id;
    const url = '/api/shop';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopForm)
      });

      if (res.ok) {
        setSuccessMsg(isEdit ? 'Produto atualizado!' : 'Produto adicionado!');
        setShopForm({ id: '', title: '', description: '', price: '', image: '', category: '' });
        // Refresh products
        const shopRes = await fetch('/api/shop');
        if (shopRes.ok) {
          setProducts(await shopRes.json());
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError('Erro ao salvar produto');
      }
    } catch (err) {
      setError('Erro de rede');
    }
  };

  const handleEditProduct = (p) => {
    setShopForm({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price.toString(),
      image: p.image,
      category: p.category
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/shop?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        setSuccessMsg('Produto removido!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError('Erro ao remover produto');
      }
    } catch (err) {
      setError('Erro de rede');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner"></div>
        <p>Carregando painel do streamer...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div className="dash-logo">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/images/midnight-logo.png" alt="Midnight Logo" style={{ height: '45px', width: '130px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
            <span className="logo-text-fallback" style={{ display: 'none', fontSize: '18px', fontWeight: '800', color: 'white' }}><span className="logo-accent" style={{ color: 'var(--accent-yellow)' }}>mid</span>night</span>
          </Link>
          <span className="dash-tag">Painel</span>
        </div>
        <div className="dash-user-info">
          <img src={user?.avatar} alt={user?.displayName} className="dash-avatar" />
          <div>
            <h4>{user?.displayName}</h4>
            <span className="dash-username">@{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Sair</button>
        </div>
      </header>

      <div className="dash-content">
        {/* Sidebar tabs */}
        <aside className="dash-sidebar glass-panel">
          <button 
            className={`sidebar-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Personalizar Perfil
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            🛍️ Gerenciar Bazar/Loja
          </button>
           <button 
             className={`sidebar-tab ${activeTab === 'profile' && typeof document !== 'undefined' && document.getElementById('socials-section')?.getBoundingClientRect().top < window.innerHeight ? 'active' : ''}`}
             onClick={() => { setActiveTab('profile'); setTimeout(() => { document.getElementById('socials-section')?.scrollIntoView({ behavior: 'smooth' }); }, 150); }}
           >
             📱 Adicionar Redes Sociais
           </button>
           
           <div className="sidebar-links-divider"></div>
          
          <button 
            className={`sidebar-tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            ⚡ Status de Live
          </button>
          
          <div className="sidebar-links-divider"></div>
          
          <Link href={`/${user?.username}`} target="_blank" className="view-profile-link">
            🔗 Ver Perfil Público
          </Link>
          <Link href={`/${user?.username}?shop=1`} target="_blank" className="view-profile-link">
            🛒 Ver Loja Pública
          </Link>
        </aside>

        {/* Form area */}
        <main className="dash-main-panel glass-panel">
          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="dash-form">
              <h3>Personalizar Visual e Informações</h3>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nome de Exibição</label>
                  <input 
                    type="text" 
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tags (separadas por vírgula)</label>
                  <input 
                    type="text" 
                    value={profileForm.tags}
                    placeholder="Ex: Streamer, GTA V, RP"
                    onChange={(e) => setProfileForm({ ...profileForm, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Biografia Curta</label>
                <textarea 
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Imagem ou GIF de Fundo (URL)</label>
                <input 
                  type="text" 
                  value={profileForm.background}
                  placeholder="https://exemplo.com/fundo.gif"
                  onChange={(e) => setProfileForm({ ...profileForm, background: e.target.value })}
                />
                <span className="field-tip">Cole o link de uma imagem ou GIF para personalizar o fundo do seu perfil.</span>
              </div>

              <h4 className="section-subtitle">🎮 Jogos e Música Favoritos</h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Jogo Favorito</label>
                  <input 
                    type="text" 
                    value={profileForm.favoriteGame}
                    placeholder="Ex: Forza Horizon 6"
                    onChange={(e) => setProfileForm({ ...profileForm, favoriteGame: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Imagem do Jogo (URL)</label>
                  <input 
                    type="text" 
                    value={profileForm.favoriteGameImage}
                    placeholder="https://exemplo.com/jogo.jpg"
                    onChange={(e) => setProfileForm({ ...profileForm, favoriteGameImage: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Música Favorita (Título - Cantor)</label>
                  <input 
                    type="text" 
                    value={profileForm.favoriteMusic}
                    placeholder="Ex: Zorro do Asfalto - Hungria"
                    onChange={(e) => setProfileForm({ ...profileForm, favoriteMusic: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Capa do Álbum (URL)</label>
                  <input 
                    type="text" 
                    value={profileForm.favoriteMusicImage}
                    placeholder="https://exemplo.com/album.jpg"
                    onChange={(e) => setProfileForm({ ...profileForm, favoriteMusicImage: e.target.value })}
                  />
                </div>
              </div>

              <h4 className="section-subtitle">🌍 Bandeiras, Playlist e Discord Guild</h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Bandeiras (Emojis de Bandeira)</label>
                  <input 
                    type="text" 
                    value={profileForm.flags}
                    placeholder="Ex: 🇫🇷 🇧🇷 🇺🇸"
                    onChange={(e) => setProfileForm({ ...profileForm, flags: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tag de Servidor/Guilda Discord</label>
                  <input 
                    type="text" 
                    value={profileForm.discordServerTag}
                    placeholder="Ex: ⚡ RUSH"
                    onChange={(e) => setProfileForm({ ...profileForm, discordServerTag: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Playlist Favorita (Título)</label>
                  <input 
                    type="text" 
                    value={profileForm.playlistName}
                    placeholder="Ex: All The Way Down"
                    onChange={(e) => setProfileForm({ ...profileForm, playlistName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Capa da Playlist (URL)</label>
                  <input 
                    type="text" 
                    value={profileForm.playlistImage}
                    placeholder="https://exemplo.com/capa-playlist.jpg"
                    onChange={(e) => setProfileForm({ ...profileForm, playlistImage: e.target.value })}
                  />
                </div>
              </div>

              <h4 id="socials-section" className="section-subtitle">📱 Redes Sociais Sync (Discord Sync)</h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Discord Tag (Username)</label>
                  <input 
                    type="text" 
                    value={profileForm.socials.discord}
                    disabled
                    className="disabled-input"
                  />
                  <span className="field-tip">Sincronizado automaticamente com seu Discord.</span>
                </div>
                <div className="form-group">
                  <label>Instagram Username</label>
                  <input 
                    type="text" 
                    value={profileForm.socials.instagram}
                    placeholder="exemplo_ig"
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      socials: { ...profileForm.socials, instagram: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Twitch Channel Name</label>
                  <input 
                    type="text" 
                    value={profileForm.socials.twitch}
                    placeholder="canal_twitch"
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      socials: { ...profileForm.socials, twitch: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>YouTube Channel Handle</label>
                  <input 
                    type="text" 
                    value={profileForm.socials.youtube}
                    placeholder="@canal_yt"
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      socials: { ...profileForm.socials, youtube: e.target.value }
                    })}
                  />
                </div>
              </div>

              <button type="submit" className="glow-btn save-btn">Salvar Alterações</button>
            </form>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <div className="dash-shop-container">
              <form onSubmit={handleProductSubmit} className="dash-form">
                <h3>{shopForm.id ? 'Editar Produto' : 'Adicionar Produto ao Bazar'}</h3>
                
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Título do Produto</label>
                    <input 
                      type="text" 
                      value={shopForm.title}
                      onChange={(e) => setShopForm({ ...shopForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Preço (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={shopForm.price}
                      onChange={(e) => setShopForm({ ...shopForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Categoria</label>
                    <input 
                      type="text" 
                      value={shopForm.category}
                      placeholder="Ex: Teclado, Fone, SSD, Quadro"
                      onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Imagem do Produto (URL)</label>
                    <input 
                      type="text" 
                      value={shopForm.image}
                      placeholder="https://exemplo.com/imagem-produto.jpg"
                      onChange={(e) => setShopForm({ ...shopForm, image: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição do Produto</label>
                  <textarea 
                    value={shopForm.description}
                    onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>

                <div className="shop-form-actions">
                  <button type="submit" className="glow-btn">{shopForm.id ? 'Salvar Edição' : 'Adicionar Produto'}</button>
                  {shopForm.id && (
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={() => setShopForm({ id: '', title: '', description: '', price: '', image: '', category: '' })}
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </form>

              <div className="products-list-section">
                <h4>Seus Produtos no Bazar</h4>
                <div className="products-table-wrapper">
                  {products.length > 0 ? (
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>Imagem</th>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id}>
                            <td>
                              <img src={p.image} alt={p.title} className="table-product-img" />
                            </td>
                            <td>
                              <div className="table-product-title">{p.title}</div>
                              <div className="table-product-desc">{p.description.slice(0, 50)}...</div>
                            </td>
                            <td><span className="table-category-tag">{p.category}</span></td>
                            <td className="table-price">R$ {p.price.toFixed(2)}</td>
                            <td>
                              <div className="table-actions">
                                <button onClick={() => handleEditProduct(p)} className="edit-btn">✏️ Editar</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="delete-btn">🗑️ Excluir</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-products-text">Nenhum produto cadastrado no seu bazar ainda.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="status-tab-panel">
              <h3>Status de Transmissão (Live)</h3>
              <p className="status-desc">
                Defina se você está online transmitindo ou não. Streamers online aparecem em destaque na página inicial de lives da cidade.
              </p>

              <div className="status-control-card glass-panel">
                <div className="status-indicator-big">
                  <span className={user?.isOnline ? 'live-dot-glow' : 'offline-dot'}></span>
                  <h4>Seu status atual: <span className={user?.isOnline ? 'status-text-online' : 'status-text-offline'}>{user?.isOnline ? 'AO VIVO' : 'OFFLINE'}</span></h4>
                </div>

                <button 
                  onClick={handleStatusToggle} 
                  className={`status-toggle-btn ${user?.isOnline ? 'btn-turn-offline' : 'btn-turn-online'}`}
                >
                  {user?.isOnline ? 'Ficar Offline' : 'Ficar Online / Iniciar Transmissão'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
