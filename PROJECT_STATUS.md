# 📊 Estatus Completo del Proyecto: GeoRoyale

> **Fecha del informe**: Agosto 2026  
> **Versión de la plataforma**: 0.1.0 (MVP General)  
> **Framework & Stack**: Next.js 16 (React 19, TypeScript), Tailwind CSS v4, Supabase (PostgreSQL + Realtime Channels), Web Audio API.

---

## 📑 Tabla de Contenidos
1. [Visión del Producto & ¿Qué es GeoRoyale?](#1-visión-del-producto--qué-es-georoyale)
2. [Arquitectura del Sistema & Stack Tecnológico](#2-arquitectura-del-sistema--stack-tecnológico)
3. [Estructura del Proyecto y Árbol de Archivos](#3-estructura-del-proyecto-y-árbol-de-archivos)
4. [Game Loop & Máquina de Estados](#4-game-loop--máquina-de-estados)
5. [Matriz de Reglas y Mecánicas de Juego](#5-matriz-de-reglas-y-mecánicas-de-juego)
6. [Funcionalidades Operativas (Lo que se puede hacer)](#6-funcionalidades-operativas-lo-que-se-puede-hacer)
7. [Limitaciones Actuales & Out of Scope (Lo que NO se puede hacer)](#7-limitaciones-actuales--out-of-scope-lo-que-no-se-puede-hacer)
8. [Estatus de Puntos Conflictivos & Deudas Técnicas](#8-estatus-de-puntos-conflictivos--deudas-técnicas)
9. [Roadmap & Hoja de Ruta Estratégica](#9-roadmap--hoja-de-ruta-estratégica)

---

## 1. Visión del Producto & ¿Qué es GeoRoyale?

**GeoRoyale** es un videojuego web multijugador en tiempo real de **trivia táctica y supervivencia estilo Battle Royale**. 

Combina la mecánica de preguntas y respuestas culturales con elementos de posicionamiento táctico sobre un mapa piramidal dividido en disciplinas del conocimiento:
- **Mapa Piramidal de 5 Niveles y 12 Disciplinas**: Los jugadores comienzan en la base (Deportes, Cine, Música, Geografía) y deben ascender hacia la cúspide (Desafío Definitivo).
- **Niebla de Guerra y Posicionamiento Oculto**: Cada jugador elige su zona en secreto durante 15 segundos. Al expirar el tiempo, se revela la posición de todos los rivales de forma simultánea.
- **Duelos Directos (⚔️)**: Si dos o más jugadores caen en la misma subzona, entran en un duelo con preguntas sincronizadas y daño amplificado ($x1.5$).
- **La Tormenta Progresiva (🌩️)**: Un área de peligro que avanza a lo largo de 11 rondas, inhabilitando los niveles inferiores e infligiendo daño por impacto de tormenta (-10 a -50 HP) a quienes queden atrapados.
- **Matriz de Ráfaga de 2 Preguntas**: Conquistar una casilla requiere responder correctamente dos preguntas consecutivas. Un fallo o empate deja al jugador atrapado en esa misma casilla.
- **Último Hombre en Pie (👑 Victory Royale)**: El objetivo es ser el último superviviente con vida ($HP > 0$). Los eliminados pueden continuar la partida en modo espectador con visión omnisciente del mapa.

---

## 2. Arquitectura del Sistema & Stack Tecnológico

### 2.1. Componentes del Stack

| Capa | Tecnología | Función Principal |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Renderizado en cliente y servidor, routing por PIN (`/sala/[pin]`). |
| **Biblioteca de UI** | **React 19 + TypeScript** | Componentes reactivos, tipado estricto y manejo de estados. |
| **Estilos & Diseño** | **Tailwind CSS v4** | Interfaz oscura *gaming*, gradientes de alto contraste, animaciones y *glassmorphism*. |
| **Iconografía** | **Lucide React** | Iconos tácticos de mapa, combate, interfaz y estados de juego. |
| **Base de Datos** | **Supabase (PostgreSQL)** | Almacenamiento efímero de jugadores y salas en `public.active_players`. |
| **Red & Sincronización** | **Supabase Realtime Channels** | Mensajería `broadcast` a baja latencia para cambios de estado, listos, respuestas y emotes. |
| **Audio FX** | **Web Audio API Sintetizada** | Generación procedural de audio (sin ficheros MP3 externos, 0ms de retardo). |
| **Almacenamiento Local** | **`sessionStorage` & `localStorage`** | Identidad aislada por pestaña del navegador (`tab-isolated identity`). |

### 2.2. Diagrama de Arquitectura de Comunicación

```
[ Navegador Jugador 1 (Anfitrión) ]       [ Navegador Jugador 2 (Invitado) ]
         │                                         │
         ├───────────► [ Supabase Realtime ] ◄──────┤
         │             (Canal: room:[PIN])         │
         │             - Broadcast: state_change    │
         │             - Broadcast: player_ready    │
         │             - Broadcast: player_answered │
         │             - Broadcast: emote           │
         │                                         │
         ▼                                         ▼
   [ Supabase DB: active_players ] ◄── (Postgres Changes Sync)
   - id, room_pin, player_name, hp, current_zone, completed_zones
```

---

## 3. Estructura del Proyecto y Árbol de Archivos

```plaintext
GeoRoyale/
├── AGENTS.md                  # Reglas del entorno de desarrollo Next.js
├── GAME_RULES.md              # Manifiesto oficial con las 11 reglas del juego
├── PROJECT_STATUS.md          # Documento maestro de estatus, arquitectura y roadmap
├── package.json               # Dependencias y scripts del proyecto
├── tsconfig.json              # Configuración de TypeScript y path aliases (@/*)
├── supabase/
│   └── schema.sql             # Script SQL maestro con columnas y RPC apply_damage
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz con estilos globales y fuentes
│   │   ├── page.tsx           # Menú principal (Crear sala, Unirse con PIN, Perfil)
│   │   ├── demo-map/page.tsx  # Sandbox de pruebas para el mapa táctico
│   │   └── sala/[pin]/
│   │       └── page.tsx       # Controlador principal del Game Loop multijugador
│   ├── components/
│   │   ├── GameMap.tsx        # Mapa interactivo piramidal, niebla y tormenta
│   │   ├── CombatInterface.tsx# Arena de combate, ráfaga de preguntas y reloj
│   │   ├── RoundResult.tsx    # Pantalla de clasificación post-ronda (5s)
│   │   ├── VictoryRoyale.tsx  # Pantalla final de victoria y revancha
│   │   └── EmotePicker.tsx    # Selector de emotes flotantes en tiempo real
│   ├── config/
│   │   ├── gameConfig.ts      # Configuración de dificultad (daño, curación, tiempos)
│   │   ├── mapConfig.ts       # Definición de niveles, disciplinas y colores
│   │   ├── questionBank.ts    # Re-exportador de preguntas
│   │   └── questions/         # Banco unificado de preguntas (general.ts, index.ts)
│   ├── data/
│   │   └── questions/general/ # Banco modular de preguntas por nivel (L1 a L5)
│   ├── hooks/
│   │   └── useGameState.ts    # Hook de máquina de estados finitos (Game State)
│   ├── lib/
│   │   ├── soundService.ts    # Sintetizador de audio con Web Audio API
│   │   └── supabase/
│   │       ├── client.ts      # Cliente de Supabase para navegador
│   │       ├── server.ts      # Cliente de Supabase para Server Components
│   │       └── playersService.ts # Capa de datos, caché en memoria y Realtime
│   └── utils/
│       └── gameLogic.ts       # Utilidades de cálculo de niveles y progresión
```

---

## 4. Game Loop & Máquina de Estados

El flujo de partida es 100% automatizado y no requiere intervención manual del anfitrión una vez iniciada la partida:

```
[ LOBBY ] ──► [ ZONE_SELECTION ] ──► [ COMBAT ] ──► [ ROUND_RESULT ] ──► [ ZONE_SELECTION ]
                                                            │
                                                     (Supervivientes <= 1)
                                                            ▼
                                                       [ VICTORY ]
```

### Descripción de Fases

1. **`LOBBY` (Sala de Espera)**:
   - Los jugadores se unen con PIN de 4 dígitos.
   - El anfitrión configura capacidad (2 a 12) y dificultad (Normal/Hardcore).
   - Los jugadores marcan "Listo". La partida inicia automáticamente si la sala se llena y todos están listos, o de forma manual por el anfitrión si el 100% de los presentes está listo.
2. **`ZONE_SELECTION` (Mapa Táctico Piramidal)**:
   - Temporizador de 15 segundos con niebla de guerra (cada jugador solo ve su posición).
   - Revelación sincronizada con pausa dramática de 2.0 segundos para observar los movimientos rivales y duelos.
3. **`COMBAT` (Arena de Preguntas)**:
   - Ráfaga de 2 preguntas de la disciplina elegida (5 opciones en niveles 4 y 5; 4 opciones en niveles 1 al 3).
   - Contador en directo de supervivientes que han respondido.
   - Pausa de 2.0 segundos al finalizar para mostrar aciertos, fallos y daño.
4. **`ROUND_RESULT` (Clasificación Automatizada)**:
   - Tabla de clasificación ordenada por vida descendente.
   - Barra de progreso regresiva de 5.0 segundos.
   - Si queda 1 superviviente (o 0), avanza a `VICTORY`. Si no, avanza a la siguiente ronda en `ZONE_SELECTION`.
5. **`VICTORY` (Pantalla de Victoria Royale)**:
   - Corona al campeón, reproduce fanfarria y permite al anfitrión lanzar una revancha inmediata que resetea la sala.

---

## 5. Matriz de Reglas y Mecánicas de Juego

### 5.1. Dificultad Dinámica

| Parámetro | Modo Normal | Modo Hardcore |
| :--- | :--- | :--- |
| **Tiempo por pregunta (Ráfaga)** | **8 segundos** (5s en Nivel 5) | **5 segundos** (fijo en todos los niveles) |
| **Daño Base por Nivel (1 al 5)** | -15 / -25 / -35 / -50 / -75 HP | -25 / -40 / -60 / -80 / -100 HP |
| **Curación por Doble Acierto (L3/L4/L5)** | +10 / +15 / +20 HP | +0 / +5 / +10 HP |

### 5.2. Matriz de Ráfaga de Combate (2 Preguntas)

- **Doble Acierto (✅✅)**: Conquista la zona, no recibe daño y se aplica la curación de su nivel (si aplica).
- **Empate (✅❌ o ❌✅)**: Zona atrapada (`mandatory_zone`), sufre daño base $\times 1$ ($\times 1.5$ si es duelo) y 0 curación.
- **Fracaso Crítico (❌❌)**: Zona atrapada (`mandatory_zone`), sufre el doble de daño base $\times 2$ ($\times 1.5$ si es duelo) y 0 curación.

### 5.3. Matriz de Tormenta (11 Rondas)

- **Rondas 1-2**: Solo Nivel 1 abierto.
- **Rondas 3-4**: Nivel 2 se abre.
- **Ronda 5**: Tormenta destruye Nivel 1 (Impacto: **-10 HP** a atrapados).
- **Rondas 6-7**: Nivel 3 se abre.
- **Ronda 8-9**: Tormenta destruye Nivel 2 (Impacto: **-20 HP** a atrapados) y abre Nivel 4.
- **Ronda 10**: Tormenta destruye Nivel 3 (Impacto: **-30 HP** a atrapados).
- **Rondas 11+**: Tormenta destruye Nivel 4 (Impacto: **-50 HP** a atrapados) y abre el Nivel 5 (Cúspide).

### 5.4. Progresión Vertical ("Sin Retorno")

Al jugar en un nivel superior, el jugador no puede volver a seleccionar casillas de niveles inferiores en rondas posteriores, quedando bloqueadas con la etiqueta `🚫 Sin Retorno`.

---

## 6. Funcionalidades Operativas (Lo que se puede hacer)

- [x] **Creación y Unión de Salas**: Mediante PIN de 4 dígitos con copia rápida al portapapeles.
- [x] **Selección de Avatar y Nickname**: Almacenados en `sessionStorage` para permitir pruebas multi-pestaña aisladas.
- [x] **Configuración de Sala**: Selección de capacidad de 2 a 12 jugadores y modos Normal/Hardcore.
- [x] **Game Loop Completo y Fluido**: Transiciones síncronas sin interrupciones manuales entre fases.
- [x] **Mapa Piramidal Reactivo**: Indicadores visuales de zonas completadas, atrapadas, bloqueadas y destruidas por tormenta.
- [x] **Duelos en Tiempo Real**: Detección de coincidencia de zona con preguntas idénticas por número de ronda.
- [x] **Sistema de Emotes**: Reacciones flotantes en tiempo real durante la partida.
- [x] **Modo Espectador Omnisciente**: Los eliminados pueden continuar en la partida con "Modo Dios" (viendo las casillas de todos los jugadores sin niebla).
- [x] **Revancha Instantánea**: El anfitrión puede reiniciar la sala con un clic, reseteando vida y zonas de todos los jugadores.
- [x] **Limpieza Atómica**: Expulsión automática al menú principal si el anfitrión cierra la ventana o sale de la sala.

---

## 7. Limitaciones Actuales & Out of Scope (Lo que NO se puede hacer)

- [ ] **Sin Autenticación ni Cuentas de Usuario**: No hay login con correo/Google ni perfiles guardados.
- [ ] **Sin Matchmaking Global**: No hay lista de salas públicas ni emparejamiento automático por botón de "Buscar Partida".
- [ ] **Sin Modo Solitario contra Bots**: No se puede jugar solo sin abrir una segunda pestaña para simular otro jugador.
- [ ] **Sin Salas Monotemáticas**: La selección de categorías temáticas individuales del lobby está deshabilitada en favor del modo unificado `General`.
- [ ] **Sin Servidor de Autoridad Anti-Trampas**: Las respuestas se evalúan en el cliente y se envían a Supabase, lo que es vulnerable a manipulación técnica en el navegador.
- [ ] **Sin Chat de Texto o Voz**: Solo se permite comunicación por emotes predefinidos.

---

## 8. Estatus de Puntos Conflictivos & Deudas Técnicas

| Punto Conflictivo | Estado Anterior | Estado Actual | Solución Aplicada |
| :--- | :---: | :---: | :--- |
| **Esquema SQL (`schema.sql`)** | 🔴 Incompleto | ✅ **Corregido** | Columnas `difficulty_mode`, `max_players`, `completed_zones`, `mandatory_zone` y función RPC `apply_damage` incorporadas al script con migraciones seguras. |
| **Mapeo Subzona Nivel 4** | 🟡 Desfasado | ✅ **Corregido** | Subzona `general_l4_astronomia` mapeada con sus preguntas de 5 opciones en [`src/config/questions/general.ts`](file:///c:/Users/71728794/Documents/GeoRoyale/src/config/questions/general.ts). |
| **Preguntas Legacy Huérfanas** | 🟡 Código Muerto | ✅ **Corregido** | Carpetas no utilizadas eliminadas (`cultura_general`, `deportes`, `geografia`, `historia`), dejando el banco limpio y modular. |
| **Autoridad del Game Loop** | 🟡 Cliente Anfitrión | ⏳ **En Roadmap** | La sincronización distribuida cliente-anfitrión funciona correctamente para el MVP; se contempla servidor autoritativo para Fase 3. |

---

## 9. Roadmap & Hoja de Ruta Estratégica

### ✅ Fase 1: Estabilización y Corrección Inmediata (Completada)
- [x] Actualizar `supabase/schema.sql` con todas las columnas y función RPC `apply_damage`.
- [x] Corregir mapeo de subzona de Nivel 4 (`general_l4_astronomia`).
- [x] Limpieza completa de carpetas de preguntas legacy huérfanas.

### 🚀 Fase 2: Expansión de Jugabilidad & Modos (Prioridad Media)
1. **Modo Práctica / Partida con Bots**:
   - Añadir exploradores virtuales con IA simple (decisión de zona aleatoria/ponderada y probabilidad de acierto según dificultad) para permitir partidas individuales.
2. **Power-Ups y Objetos Tácticos**:
   - *Escudo de Energía*: Reduce el 50% del daño en la siguiente ronda.
   - *Radar de Exploración*: Revela hacia dónde van 1 o 2 rivales durante la selección de zona.
   - *Comodín 50/50*: Descarta la mitad de las opciones incorrectas en una pregunta.
3. **Generación Dinámica de Preguntas con IA / APIs**:
   - Integración con APIs externas (Open Trivia DB) o LLM (Gemini API) para renovar automáticamente el banco de preguntas.

### 🌐 Fase 3: Plataforma, Comunidad y Competitivo (Visión a Largo Plazo)
1. **Cuentas y Progresión de Jugador**:
   - Autenticación con Supabase Auth (Google, Discord, Email).
   - Estadísticas de victorias, tasa de aciertos por disciplina, nivel de explorador y marcos de avatar desbloqueables.
2. **Lobby Público y Matchmaking**:
   - Buscador de salas abiertas y sistema de emparejamiento automático por nivel o habilidad (Elo/MMR).
3. **Servidor de Autoridad (Anti-Cheat)**:
   - Migración de la lógica de combate a Supabase Edge Functions o servidor ligero Node.js/WebSockets para validar respuestas y tiempos en backend.
4. **Modo Torneo y Soporte para Espectadores/Casters**:
   - Salas para eventos con vista de espectador libre, tabla de estadísticas en directo y paneles para retransmisiones.
