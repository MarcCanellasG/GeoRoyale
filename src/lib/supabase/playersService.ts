import { createClient } from './client'

export interface ActivePlayer {
  id: string
  room_pin: string
  player_name: string
  hp: number
  category_key?: string
  avatar_icon?: string
  created_at?: string
}

export interface EmoteEvent {
  senderName: string
  targetName: string
  emote: string
  timestamp: number
}

const LOCAL_STORAGE_KEY = 'geo_royale_active_players'
const BROADCAST_CHANNEL_NAME = 'geo_royale_room_sync'

// Helper function to enforce a maximum timeout on any Promise to prevent hanging
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 500, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs))
  ])
}

// Multi-tab BroadcastChannel Singleton
let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    }
  }
  return broadcastChannel
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url) return false
  if (url.includes('127.0.0.1:54321') || url.includes('localhost:54321')) {
    return process.env.NEXT_PUBLIC_ENABLE_LOCAL_SUPABASE === 'true'
  }
  return true
}

// Get players from local storage (0ms instant access)
function getLocalPlayers(): ActivePlayer[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save players to local storage & notify all open browser tabs instantly
function saveLocalPlayers(players: ActivePlayer[], room_pin?: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players))
    
    // 1. Dispatch event to current tab
    window.dispatchEvent(new Event('geo_royale_players_updated'))

    // 2. Broadcast to ALL OTHER open tabs instantly
    getBroadcastChannel()?.postMessage({
      type: 'ROOM_UPDATED',
      room_pin,
      timestamp: Date.now()
    })
  } catch (e) {
    console.error('Failed to save to local storage', e)
  }
}

/**
 * Checks if a room exists (with 400ms maximum safety timeout)
 */
export async function checkRoomExists(room_pin: string): Promise<boolean> {
  const local = getLocalPlayers()
  if (local.some((p) => p.room_pin === room_pin)) {
    return true
  }

  if (isSupabaseConfigured()) {
    try {
      const supabaseQuery = (async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('active_players')
          .select('id')
          .eq('room_pin', room_pin)
          .limit(1)

        if (!error && data && data.length > 0) {
          return true
        }
        return false
      })()

      return await withTimeout(supabaseQuery, 400, false)
    } catch {
      // Ignore network errors
    }
  }

  return false
}

/**
 * Gets the shared category_key for a room from its existing players
 */
export async function getRoomCategoryKey(room_pin: string): Promise<string> {
  const players = await getPlayersInRoom(room_pin)
  if (players && players.length > 0 && players[0].category_key) {
    return players[0].category_key
  }
  return 'geografia'
}

/**
 * Gets all active players in a room (with 400ms maximum safety timeout)
 */
export async function getPlayersInRoom(room_pin: string): Promise<ActivePlayer[]> {
  const local = getLocalPlayers().filter((p) => p.room_pin === room_pin)

  if (isSupabaseConfigured()) {
    try {
      const fetchSupabase = (async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('active_players')
          .select('*')
          .eq('room_pin', room_pin)
          .order('created_at', { ascending: true })

        if (!error && data && data.length > 0) {
          const mergedMap = new Map<string, ActivePlayer>()
          local.forEach((p) => mergedMap.set(p.player_name, p))
          ;(data as ActivePlayer[]).forEach((p) => mergedMap.set(p.player_name, p))
          const result = Array.from(mergedMap.values())
          
          const allLocal = getLocalPlayers().filter((p) => p.room_pin !== room_pin)
          saveLocalPlayers([...allLocal, ...result], room_pin)
          return result
        }
        return local
      })()

      return await withTimeout(fetchSupabase, 400, local)
    } catch {
      // Ignore network errors
    }
  }

  return local
}

/**
 * Registers a player in a room with category_key and avatar_icon (0ms Non-Blocking)
 */
export function joinOrCreateRoom(
  room_pin: string,
  player_name: string,
  category_key: string = 'geografia',
  avatar_icon: string = '🦊'
): ActivePlayer {
  const newPlayer: ActivePlayer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    room_pin,
    player_name,
    hp: 100,
    category_key,
    avatar_icon,
    created_at: new Date().toISOString()
  }

  // 1. Instant local persistence & multi-tab broadcast (0ms delay)
  const currentLocal = getLocalPlayers()
  const exists = currentLocal.some(
    (p) => p.room_pin === room_pin && p.player_name === player_name
  )

  if (!exists) {
    saveLocalPlayers([...currentLocal, newPlayer], room_pin)
  }

  // 2. Non-blocking background sync if Supabase is configured
  if (isSupabaseConfigured()) {
    setTimeout(() => {
      try {
        const supabase = createClient()
        supabase
          .from('active_players')
          .insert([
            {
              id: newPlayer.id,
              room_pin: newPlayer.room_pin,
              player_name: newPlayer.player_name,
              hp: newPlayer.hp,
              category_key: newPlayer.category_key,
              avatar_icon: newPlayer.avatar_icon
            }
          ])
          .then()
          .catch(() => {})
      } catch {}
    }, 0)
  }

  return newPlayer
}

/**
 * Removes a player from a room
 */
export function leaveRoom(room_pin: string, player_name: string): void {
  if (!room_pin || !player_name) return

  // 1. Remove player from local storage instantly
  const currentLocal = getLocalPlayers()
  const updated = currentLocal.filter(
    (p) => !(p.room_pin === room_pin && p.player_name === player_name)
  )
  
  saveLocalPlayers(updated, room_pin)

  // 2. Non-blocking background delete if Supabase is configured
  if (isSupabaseConfigured()) {
    setTimeout(() => {
      try {
        const supabase = createClient()
        supabase
          .from('active_players')
          .delete()
          .eq('room_pin', room_pin)
          .eq('player_name', player_name)
          .then()
          .catch(() => {})
      } catch {}
    }, 0)
  }
}

/**
 * Sends a floating Emote reaction to a room
 */
export function sendRoomEmote(
  room_pin: string,
  senderName: string,
  targetName: string,
  emote: string
) {
  const emoteData: EmoteEvent = {
    senderName,
    targetName,
    emote,
    timestamp: Date.now()
  }

  // 1. Broadcast locally to same-tab and multi-tab
  getBroadcastChannel()?.postMessage({
    type: 'EMOTE_RECEIVED',
    room_pin,
    emoteData
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('geo_royale_emote_received', { detail: { room_pin, emoteData } })
    )
  }

  // 2. Supabase Realtime Broadcast channel
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const channel = supabase.channel(`room_emotes_${room_pin}`)
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'emote',
            payload: emoteData
          })
        }
      })
    } catch {}
  }
}

/**
 * Subscribes to real-time player updates across ALL tabs & Supabase
 */
export function subscribeToRoomPlayers(
  room_pin: string,
  onPlayersUpdate: (players: ActivePlayer[]) => void
) {
  const updatePlayers = async () => {
    const players = await getPlayersInRoom(room_pin)
    onPlayersUpdate(players)
  }

  // Initial update
  updatePlayers()

  // 1. Supabase Realtime Channel
  let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      channel = supabase
        .channel(`room_players_${room_pin}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'active_players',
            filter: `room_pin=eq.${room_pin}`
          },
          () => {
            updatePlayers()
          }
        )
        .subscribe()
    } catch {}
  }

  // 2. Multi-tab BroadcastChannel listener
  const bc = getBroadcastChannel()
  const handleBcMessage = (event: MessageEvent) => {
    if (event.data?.room_pin === room_pin || !event.data?.room_pin) {
      updatePlayers()
    }
  }

  if (bc) {
    bc.addEventListener('message', handleBcMessage)
  }

  // 3. Native Storage event listener
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      updatePlayers()
    }
  }

  // 4. Custom same-tab event listener
  const handleCustomEvent = () => {
    updatePlayers()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('geo_royale_players_updated', handleCustomEvent)
  }

  // Cleanup function
  return () => {
    if (channel) {
      try {
        const supabase = createClient()
        supabase.removeChannel(channel)
      } catch {}
    }

    if (bc) {
      bc.removeEventListener('message', handleBcMessage)
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('geo_royale_players_updated', handleCustomEvent)
    }
  }
}

/**
 * Subscribes to real-time Emotes across ALL tabs & Supabase
 */
export function subscribeToRoomEmotes(
  room_pin: string,
  onEmoteReceived: (emoteData: EmoteEvent) => void
) {
  // 1. Supabase Realtime Broadcast Channel
  let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      channel = supabase
        .channel(`room_emotes_${room_pin}`)
        .on('broadcast', { event: 'emote' }, (payload) => {
          if (payload.payload) {
            onEmoteReceived(payload.payload as EmoteEvent)
          }
        })
        .subscribe()
    } catch {}
  }

  // 2. Multi-tab BroadcastChannel listener
  const bc = getBroadcastChannel()
  const handleBcMessage = (event: MessageEvent) => {
    if (event.data?.type === 'EMOTE_RECEIVED' && event.data?.room_pin === room_pin) {
      onEmoteReceived(event.data.emoteData)
    }
  }

  if (bc) {
    bc.addEventListener('message', handleBcMessage)
  }

  // 3. Custom same-tab event listener
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent
    if (custom.detail?.room_pin === room_pin && custom.detail?.emoteData) {
      onEmoteReceived(custom.detail.emoteData)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('geo_royale_emote_received', handleCustomEvent)
  }

  return () => {
    if (channel) {
      try {
        const supabase = createClient()
        supabase.removeChannel(channel)
      } catch {}
    }

    if (bc) {
      bc.removeEventListener('message', handleBcMessage)
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('geo_royale_emote_received', handleCustomEvent)
    }
  }
}
