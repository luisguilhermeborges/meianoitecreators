import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Warn developer if credentials are not configured yet
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'AVISO: Supabase não está configurado. Por favor, adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env.local'
  );
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

// Helpers to map camelCase (Next.js) to snake_case (Supabase/Postgres)
function mapUserFromDb(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatar: u.avatar,
    background: u.background,
    isOnline: u.is_online,
    verified: u.verified,
    bio: u.bio,
    socials: u.socials || {},
    games: u.games || [],
    favoriteGame: u.favorite_game,
    favoriteGameImage: u.favorite_game_image,
    favoriteMusic: u.favorite_music,
    favoriteMusicImage: u.favorite_music_image,
    views: u.views || 0,
    tags: u.tags || [],
    flags: u.flags || '',
    playlistName: u.playlist_name || '',
    playlistImage: u.playlist_image || '',
    discordServerTag: u.discord_server_tag || ''
  };
}

function mapUserToDb(u) {
  if (!u) return null;
  const mapped = {};
  if (u.id !== undefined) mapped.id = u.id;
  if (u.username !== undefined) mapped.username = u.username;
  if (u.displayName !== undefined) mapped.display_name = u.displayName;
  if (u.avatar !== undefined) mapped.avatar = u.avatar;
  if (u.background !== undefined) mapped.background = u.background;
  if (u.isOnline !== undefined) mapped.is_online = u.isOnline;
  if (u.verified !== undefined) mapped.verified = u.verified;
  if (u.bio !== undefined) mapped.bio = u.bio;
  if (u.socials !== undefined) mapped.socials = u.socials;
  if (u.games !== undefined) mapped.games = u.games;
  if (u.favoriteGame !== undefined) mapped.favorite_game = u.favoriteGame;
  if (u.favoriteGameImage !== undefined) mapped.favorite_game_image = u.favoriteGameImage;
  if (u.favoriteMusic !== undefined) mapped.favorite_music = u.favoriteMusic;
  if (u.favoriteMusicImage !== undefined) mapped.favorite_music_image = u.favoriteMusicImage;
  if (u.views !== undefined) mapped.views = u.views;
  if (u.tags !== undefined) mapped.tags = u.tags;
  if (u.flags !== undefined) mapped.flags = u.flags;
  if (u.playlistName !== undefined) mapped.playlist_name = u.playlistName;
  if (u.playlistImage !== undefined) mapped.playlist_image = u.playlistImage;
  if (u.discordServerTag !== undefined) mapped.discord_server_tag = u.discordServerTag;
  return mapped;
}

function mapProductFromDb(p) {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.user_id,
    title: p.title,
    description: p.description,
    price: parseFloat(p.price) || 0,
    image: p.image,
    category: p.category
  };
}

function mapProductToDb(p) {
  if (!p) return null;
  const mapped = {};
  if (p.id !== undefined) mapped.id = p.id;
  if (p.userId !== undefined) mapped.user_id = p.userId;
  if (p.title !== undefined) mapped.title = p.title;
  if (p.description !== undefined) mapped.description = p.description;
  if (p.price !== undefined) mapped.price = p.price;
  if (p.image !== undefined) mapped.image = p.image;
  if (p.category !== undefined) mapped.category = p.category;
  return mapped;
}

// Check database client availability
function assertClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Check environment variables.');
  }
}

export async function getUsers() {
  assertClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getUsers error:', error);
    return [];
  }
  return data.map(mapUserFromDb);
}

export async function getUserById(id) {
  assertClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('getUserById error:', error);
    return null;
  }
  return mapUserFromDb(data);
}

export async function getUserByUsername(username) {
  assertClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (error) {
    console.error('getUserByUsername error:', error);
    return null;
  }
  return mapUserFromDb(data);
}

export async function createUser(user) {
  assertClient();
  
  // Clean username
  const exists = await getUserByUsername(user.username);
  if (exists) {
    user.username = `${user.username}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const dbRow = mapUserToDb(user);
  const { data, error } = await supabase
    .from('users')
    .insert(dbRow)
    .select()
    .single();

  if (error) {
    console.error('createUser error:', error);
    throw error;
  }
  return mapUserFromDb(data);
}

export async function updateUser(id, updates) {
  assertClient();
  const dbRow = mapUserToDb(updates);
  const { data, error } = await supabase
    .from('users')
    .update(dbRow)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateUser error:', error);
    throw error;
  }
  return mapUserFromDb(data);
}

export async function getProducts() {
  assertClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProducts error:', error);
    return [];
  }
  return data.map(mapProductFromDb);
}

export async function getProductsByUserId(userId) {
  assertClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProductsByUserId error:', error);
    return [];
  }
  return data.map(mapProductFromDb);
}

export async function addProduct(product) {
  assertClient();
  const newProduct = {
    id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...product
  };
  
  const dbRow = mapProductToDb(newProduct);
  const { data, error } = await supabase
    .from('products')
    .insert(dbRow)
    .select()
    .single();

  if (error) {
    console.error('addProduct error:', error);
    throw error;
  }
  return mapProductFromDb(data);
}

export async function updateProduct(id, updates) {
  assertClient();
  const dbRow = mapProductToDb(updates);
  const { data, error } = await supabase
    .from('products')
    .update(dbRow)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateProduct error:', error);
    throw error;
  }
  return mapProductFromDb(data);
}

export async function deleteProduct(id) {
  assertClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteProduct error:', error);
    throw error;
  }
  return true;
}
