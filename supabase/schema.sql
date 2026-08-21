-- Tabla ligera para gestión de jugadores activos en salas en tiempo real
CREATE TABLE IF NOT EXISTS public.active_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_pin VARCHAR(4) NOT NULL,
    player_name TEXT NOT NULL,
    hp INT NOT NULL DEFAULT 100,
    category_key VARCHAR(50) NOT NULL DEFAULT 'geografia',
    avatar_icon VARCHAR(10) NOT NULL DEFAULT '🦊',
    current_zone VARCHAR(100) DEFAULT NULL,
    difficulty_mode VARCHAR(20) NOT NULL DEFAULT 'normal',
    max_players INT NOT NULL DEFAULT 4,
    completed_zones TEXT[] DEFAULT '{}',
    mandatory_zone VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que las columnas existen si la tabla ya fue creada previamente (migraciones no destructivas)
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS category_key VARCHAR(50) NOT NULL DEFAULT 'geografia';
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS avatar_icon VARCHAR(10) NOT NULL DEFAULT '🦊';
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS current_zone VARCHAR(100) DEFAULT NULL;
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS difficulty_mode VARCHAR(20) NOT NULL DEFAULT 'normal';
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS max_players INT NOT NULL DEFAULT 4;
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS completed_zones TEXT[] DEFAULT '{}';
ALTER TABLE public.active_players ADD COLUMN IF NOT EXISTS mandatory_zone VARCHAR(100) DEFAULT NULL;

-- Índice para acelerar búsquedas por PIN de sala
CREATE INDEX IF NOT EXISTS idx_active_players_room_pin ON public.active_players(room_pin);

-- Habilitar Row Level Security (RLS) con acceso público para lectura y escritura
ALTER TABLE public.active_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de jugadores por PIN"
ON public.active_players FOR SELECT
USING (true);

CREATE POLICY "Permitir insercion publica de jugadores"
ON public.active_players FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica de estado de jugadores"
ON public.active_players FOR UPDATE
USING (true);

CREATE POLICY "Permitir eliminacion de jugadores al salir de sala"
ON public.active_players FOR DELETE
USING (true);

-- Publicar en Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_players;

-- Procedimiento almacenado para aplicar daño atómico a los jugadores
CREATE OR REPLACE FUNCTION public.apply_damage(player_id UUID, damage_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.active_players
    SET hp = GREATEST(0, hp - damage_amount)
    WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

