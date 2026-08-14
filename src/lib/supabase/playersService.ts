import { createClient } from './client'

export interface ActivePlayer {
  id: string
  room_pin: string
  player_name: string
  hp: number
  category_key?: string
  avatar_icon?: string
  current_zone?: string | null
  difficulty_mode?: string
  created_at?: string
}

export interface EmoteEvent {
  senderName: string
  targetName: string
  emote: string
  timestamp: number
}

export interface StateBroadcastPayload {
  room_pin: string
  newState: string
  payload?: any
  timestamp: number
}

interface RoomCallbacks {
  playersUpdate: Set<(players: ActivePlayer[]) => void>
  readyChange: Set<(playerName: string, isReady: boolean) => void>
  stateChange: Set<(newState: string, extraPayload?: any) => void>
  emoteReceived: Set<(emoteData: EmoteEvent) => void>
}

// Singletons for active Realtime Channels and Callbacks per room PIN
const activeRoomChannels = new Map<string, ReturnType<ReturnType<typeof createClient>['channel']>>()
const roomCallbacksMap = new Map<string, RoomCallbacks>()

// In-memory fallback player cache per room to ensure instant 0ms rendering
const localTabPlayersCache = new Map<string, Map<string, ActivePlayer>>()

function getOrCreateRoomCallbacks(cleanPin: string): RoomCallbacks {
  if (!roomCallbacksMap.has(cleanPin)) {
    roomCallbacksMap.set(cleanPin, {
      playersUpdate: new Set(),
      readyChange: new Set(),
      stateChange: new Set(),
      emoteReceived: new Set()
    })
  }
  return roomCallbacksMap.get(cleanPin)!
}

function getOrCreateRoomChannel(room_pin: string) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin || typeof window === 'undefined') return null

  const callbacks = getOrCreateRoomCallbacks(cleanPin)

  if (!activeRoomChannels.has(cleanPin)) {
    try {
      const supabase = createClient()
      const channel = supabase.channel(`room:${cleanPin}`, {
        config: {
          broadcast: { self: true }
        }
      })

      // Register ALL event handlers BEFORE calling subscribe()
      channel
        .on('broadcast', { event: 'player_ready' }, (payload) => {
          if (payload.payload && payload.payload.playerName !== undefined) {
            callbacks.readyChange.forEach((cb) => cb(payload.payload.playerName, Boolean(payload.payload.isReady)))
          }
        })
        .on('broadcast', { event: 'state_change' }, (payload) => {
          if (payload.payload && payload.payload.newState) {
            callbacks.stateChange.forEach((cb) => cb(payload.payload.newState, payload.payload.payload))
          }
        })
        .on('broadcast', { event: 'emote' }, (payload) => {
          if (payload.payload) {
            callbacks.emoteReceived.forEach((cb) => cb(payload.payload as EmoteEvent))
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'active_players',
            filter: `room_pin=eq.${cleanPin}`
          },
          async () => {
            if (callbacks.playersUpdate.size > 0) {
              const players = await getPlayersInRoom(cleanPin)
              callbacks.playersUpdate.forEach((cb) => cb(players))
            }
          }
        )

      // Call subscribe() strictly AFTER all handlers are attached
      channel.subscribe()
      activeRoomChannels.set(cleanPin, channel)
    } catch (err) {
      console.error('Error creating realtime channel:', err)
      return null
    }
  }

  return activeRoomChannels.get(cleanPin) || null
}

// Helper function to enforce a maximum timeout on Promises to prevent UI freezing
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 1500, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs))
  ])
}

// Tab-isolated identity stored strictly in sessionStorage (100% independent per tab/browser window)
export function getTabPlayerName(): string {
  if (typeof window === 'undefined') return ''
  let name = sessionStorage.getItem('geo_royale_tab_player')
  if (!name) {
    name = localStorage.getItem('geo_royale_current_player') || ''
    if (name) {
      sessionStorage.setItem('geo_royale_tab_player', name)
    }
  }
  return name
}

export function setTabPlayerName(name: string): void {
  if (typeof window === 'undefined') return
  const cleanName = name.trim()
  if (cleanName) {
    sessionStorage.setItem('geo_royale_tab_player', cleanName)
    localStorage.setItem('geo_royale_current_player', cleanName)
  }
}

export function getTabAvatar(): string {
  if (typeof window === 'undefined') return '🦊'
  return sessionStorage.getItem('geo_royale_tab_avatar') || '🦊'
}

export function setTabAvatar(avatar: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('geo_royale_tab_avatar', avatar)
}

function saveCachedPlayer(player: ActivePlayer) {
  if (!player || !player.room_pin || !player.player_name) return
  const pin = player.room_pin.trim()
  if (!localTabPlayersCache.has(pin)) {
    localTabPlayersCache.set(pin, new Map())
  }
  localTabPlayersCache.get(pin)!.set(player.player_name.trim(), player)
}

function getCachedRoomPlayers(room_pin: string): ActivePlayer[] {
  const pin = room_pin.trim()
  const map = localTabPlayersCache.get(pin)
  if (!map) return []
  return Array.from(map.values())
}

/**
 * Comprueba si una sala con el PIN dado existe en Supabase (con timeout de seguridad)
 */
export async function checkRoomExists(room_pin: string): Promise<boolean> {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return false

  const cached = getCachedRoomPlayers(cleanPin)
  if (cached.length > 0) return true

  try {
    const supabaseQuery = (async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('active_players')
        .select('id')
        .eq('room_pin', cleanPin)
        .limit(1)

      if (!error && data && data.length > 0) {
        return true
      }
      return false
    })()

    return await withTimeout(supabaseQuery, 1500, false)
  } catch (err) {
    console.error('Error al comprobar existencia de sala:', err)
  }
  return false
}

/**
 * Obtiene la temática (`category_key`) de una sala existente en Supabase (con timeout de seguridad)
 */
export async function getRoomCategoryKey(room_pin: string): Promise<string> {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return 'geografia'

  const cached = getCachedRoomPlayers(cleanPin)
  if (cached.length > 0 && cached[0].category_key) {
    return cached[0].category_key
  }

  try {
    const supabaseQuery = (async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('active_players')
        .select('category_key')
        .eq('room_pin', cleanPin)
        .limit(1)

      if (!error && data && data.length > 0 && data[0].category_key) {
        return data[0].category_key
      }
      return 'geografia'
    })()

    return await withTimeout(supabaseQuery, 1500, 'geografia')
  } catch (err) {
    console.error('Error al obtener categoría de sala:', err)
  }
  return 'geografia'
}

/**
 * Obtiene el modo de dificultad (`difficulty_mode`) de una sala existente en Supabase
 */
export async function getRoomDifficultyMode(room_pin: string): Promise<string> {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return 'normal'

  const cached = getCachedRoomPlayers(cleanPin)
  if (cached.length > 0 && cached[0].difficulty_mode) {
    return cached[0].difficulty_mode
  }

  try {
    const supabaseQuery = (async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('active_players')
        .select('difficulty_mode')
        .eq('room_pin', cleanPin)
        .limit(1)

      if (!error && data && data.length > 0 && data[0].difficulty_mode) {
        return data[0].difficulty_mode
      }
      return 'normal'
    })()

    return await withTimeout(supabaseQuery, 1500, 'normal')
  } catch (err) {
    console.error('Error al obtener dificultad de sala:', err)
  }
  return 'normal'
}

/**
 * Obtiene la lista completa de jugadores de la sala ordenados por fecha de creación (con timeout fail-safe)
 */
export async function getPlayersInRoom(room_pin: string): Promise<ActivePlayer[]> {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return []

  const cached = getCachedRoomPlayers(cleanPin)

  try {
    const fetchSupabase = (async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('active_players')
        .select('*')
        .eq('room_pin', cleanPin)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        const mergedMap = new Map<string, ActivePlayer>()
        cached.forEach((p) => mergedMap.set(p.player_name, p))
        ;(data as ActivePlayer[]).forEach((p) => mergedMap.set(p.player_name, p))

        const result = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        )

        result.forEach(saveCachedPlayer)
        return result
      }
      return cached
    })()

    return await withTimeout(fetchSupabase, 1500, cached)
  } catch (err) {
    console.error('Error al obtener jugadores de Supabase:', err)
  }

  return cached
}

/**
 * Une a un jugador existente o crea una nueva sala si es el anfitrión (con timeout fail-safe)
 */
export async function joinOrCreateRoom(
  room_pin: string,
  player_name: string,
  category_key: string = 'geografia',
  avatar_icon: string = '🦊',
  difficulty_mode: string = 'normal'
): Promise<ActivePlayer> {
  const cleanPin = String(room_pin).trim()
  const cleanName = String(player_name).trim()

  let finalDifficulty = difficulty_mode
  if (!difficulty_mode || difficulty_mode === 'normal') {
    const hostDifficulty = await getRoomDifficultyMode(cleanPin)
    if (hostDifficulty) {
      finalDifficulty = hostDifficulty
    }
  }

  const newPlayer: ActivePlayer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    room_pin: cleanPin,
    player_name: cleanName,
    hp: 100,
    category_key,
    avatar_icon,
    current_zone: null,
    difficulty_mode: finalDifficulty,
    created_at: new Date().toISOString()
  }

  saveCachedPlayer(newPlayer)

  try {
    const insertQuery = (async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('active_players')
        .insert([
          {
            id: newPlayer.id,
            room_pin: newPlayer.room_pin,
            player_name: newPlayer.player_name,
            hp: newPlayer.hp,
            category_key: newPlayer.category_key,
            avatar_icon: newPlayer.avatar_icon,
            current_zone: newPlayer.current_zone,
            difficulty_mode: newPlayer.difficulty_mode
          }
        ])
        .select()

      if (!error && data && data.length > 0) {
        saveCachedPlayer(data[0] as ActivePlayer)
        return data[0] as ActivePlayer
      }
      return newPlayer
    })()

    return await withTimeout(insertQuery, 1500, newPlayer)
  } catch (err) {
    console.error('Error al insertar jugador en Supabase:', err)
  }

  return newPlayer
}

/**
 * Actualiza (UPDATE) la zona de aterrizaje de un jugador en Supabase
 */
export async function updatePlayerZone(
  room_pin: string,
  player_name: string,
  subzone_id: string
): Promise<void> {
  const cleanPin = String(room_pin).trim()
  const cleanName = String(player_name).trim()
  if (!cleanPin || !cleanName) return

  const cachedMap = localTabPlayersCache.get(cleanPin)
  if (cachedMap && cachedMap.has(cleanName)) {
    const p = cachedMap.get(cleanName)!
    p.current_zone = subzone_id
    saveCachedPlayer(p)
  }

  try {
    const supabase = createClient()
    await supabase
      .from('active_players')
      .update({ current_zone: subzone_id })
      .eq('room_pin', cleanPin)
      .eq('player_name', cleanName)
  } catch (err) {
    console.error('Error al actualizar zona de jugador:', err)
  }
}

/**
 * Aplica daño atómico a la vida (HP) de un jugador mediante el procedimiento almacenado RPC apply_damage en PostgreSQL
 */
export async function applyPlayerDamage(
  player_id: string,
  damage_amount: number
): Promise<void> {
  if (!player_id || damage_amount <= 0) return

  try {
    const supabase = createClient()
    await supabase.rpc('apply_damage', {
      player_id: player_id,
      damage_amount: damage_amount
    })
  } catch (err) {
    console.error('Error al aplicar daño atómico al jugador:', err)
  }
}

/**
 * Aplica curación a la vida (HP) de un jugador hasta un máximo de 100 HP
 */
export async function applyPlayerHealing(
  player_id: string,
  heal_amount: number,
  current_hp: number
): Promise<void> {
  if (!player_id || heal_amount <= 0) return
  const newHp = Math.min(current_hp + heal_amount, 100)

  try {
    const supabase = createClient()
    await supabase
      .from('active_players')
      .update({ hp: newHp })
      .eq('id', player_id)
  } catch (err) {
    console.error('Error al curar jugador:', err)
  }
}

/**
 * Elimina (DELETE) un jugador o la sala entera de Supabase al salir
 */
export async function leaveRoom(
  room_pin: string, 
  player_name: string, 
  isHost: boolean = false
): Promise<void> {
  const cleanPin = String(room_pin).trim()
  const cleanName = String(player_name).trim()
  if (!cleanPin) return

  if (isHost) {
    localTabPlayersCache.delete(cleanPin)
    roomCallbacksMap.delete(cleanPin)
    activeRoomChannels.delete(cleanPin)
  } else if (cleanName && localTabPlayersCache.has(cleanPin)) {
    localTabPlayersCache.get(cleanPin)!.delete(cleanName)
  }

  try {
    const supabase = createClient()

    if (isHost) {
      await supabase
        .from('active_players')
        .delete()
        .eq('room_pin', cleanPin)

      broadcastGameState(cleanPin, 'ROOM_CLOSED', { roomClosed: true })
    } else {
      if (cleanName) {
        await supabase
          .from('active_players')
          .delete()
          .eq('room_pin', cleanPin)
          .eq('player_name', cleanName)
      }

      const { data } = await supabase
        .from('active_players')
        .select('id')
        .eq('room_pin', cleanPin)
        .limit(1)

      if (!data || data.length === 0) {
        await supabase
          .from('active_players')
          .delete()
          .eq('room_pin', cleanPin)
      }
    }
  } catch (err) {
    console.error('Error al eliminar jugador/sala en Supabase:', err)
  }
}

/**
 * Elimina de forma garantizada la fila de la base de datos al cerrar la pestaña o ventana del navegador.
 */
export function leaveRoomOnTabClose(
  room_pin: string, 
  player_name: string, 
  isHost: boolean = false
): void {
  const cleanPin = String(room_pin).trim()
  const cleanName = String(player_name).trim()
  if (!cleanPin) return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return

  try {
    const endpoint = isHost
      ? `${url}/rest/v1/active_players?room_pin=eq.${encodeURIComponent(cleanPin)}`
      : `${url}/rest/v1/active_players?room_pin=eq.${encodeURIComponent(cleanPin)}&player_name=eq.${encodeURIComponent(cleanName)}`

    fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      keepalive: true
    }).catch(() => {})
  } catch {}
}

/**
 * Emite el estado de "Listo" de un jugador a la sala vía Realtime Broadcast
 */
export function sendPlayerReady(room_pin: string, playerName: string, isReady: boolean) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return

  const channel = getOrCreateRoomChannel(cleanPin)
  if (!channel) return

  channel.send({
    type: 'broadcast',
    event: 'player_ready',
    payload: {
      playerName,
      isReady,
      timestamp: Date.now()
    }
  })
}

/**
 * Escucha cambios de estado "Listo" de los jugadores en la sala vía Realtime Broadcast
 */
export function subscribeToPlayerReady(
  room_pin: string,
  onReadyChange: (playerName: string, isReady: boolean) => void
) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return () => {}

  const callbacks = getOrCreateRoomCallbacks(cleanPin)
  callbacks.readyChange.add(onReadyChange)

  // Ensure channel is initialized
  getOrCreateRoomChannel(cleanPin)

  return () => {
    callbacks.readyChange.delete(onReadyChange)
  }
}

/**
 * Emite (BROADCAST) una transición del Game State Manager a todos los clientes del canal room:[PIN]
 */
export function broadcastGameState(room_pin: string, newState: string, extraPayload?: any) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return

  const channel = getOrCreateRoomChannel(cleanPin)
  if (!channel) return

  channel.send({
    type: 'broadcast',
    event: 'state_change',
    payload: {
      room_pin: cleanPin,
      newState,
      payload: extraPayload,
      timestamp: Date.now()
    }
  })
}

/**
 * Escucha eventos de Game State Broadcast en el canal único room:[PIN]
 */
export function subscribeToGameStateBroadcast(
  room_pin: string,
  onStateChange: (newState: string, extraPayload?: any) => void
) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return () => {}

  const callbacks = getOrCreateRoomCallbacks(cleanPin)
  callbacks.stateChange.add(onStateChange)

  // Ensure channel is initialized
  getOrCreateRoomChannel(cleanPin)

  return () => {
    callbacks.stateChange.delete(onStateChange)
  }
}

/**
 * Emite (BROADCAST) una reacción de Emote flotante a todos los clientes del canal room:[PIN]
 */
export function sendRoomEmote(
  room_pin: string,
  senderName: string,
  targetName: string,
  emote: string
) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return

  const emoteData: EmoteEvent = {
    senderName,
    targetName,
    emote,
    timestamp: Date.now()
  }

  const channel = getOrCreateRoomChannel(cleanPin)
  if (!channel) return

  channel.send({
    type: 'broadcast',
    event: 'emote',
    payload: emoteData
  })
}

/**
 * Escucha reacciones de Emotes en el canal único room:[PIN]
 */
export function subscribeToRoomEmotes(
  room_pin: string,
  onEmoteReceived: (emoteData: EmoteEvent) => void
) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return () => {}

  const callbacks = getOrCreateRoomCallbacks(cleanPin)
  callbacks.emoteReceived.add(onEmoteReceived)

  // Ensure channel is initialized
  getOrCreateRoomChannel(cleanPin)

  return () => {
    callbacks.emoteReceived.delete(onEmoteReceived)
  }
}

/**
 * Suscripción al canal room:[PIN] que escucha cambios en la base de datos (Postgres Changes)
 */
export function subscribeToRoomPlayers(
  room_pin: string,
  onPlayersUpdate: (players: ActivePlayer[]) => void
) {
  const cleanPin = String(room_pin).trim()
  if (!cleanPin) return () => {}

  const fetchAndNotify = async () => {
    const players = await getPlayersInRoom(cleanPin)
    onPlayersUpdate(players)
  }

  fetchAndNotify()

  const callbacks = getOrCreateRoomCallbacks(cleanPin)
  callbacks.playersUpdate.add(onPlayersUpdate)

  // Ensure channel is initialized with postgres_changes handler added BEFORE subscribe()
  getOrCreateRoomChannel(cleanPin)

  return () => {
    callbacks.playersUpdate.delete(onPlayersUpdate)
  }
}
