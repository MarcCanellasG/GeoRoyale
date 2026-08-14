# 📜 El Manifiesto de Geo-Royale: Reglas Oficiales y Arquitectura

## 1. Arquitectura de Datos Innegociable
- **Frontend Estático**: La configuración de la partida, mapas, temáticas, niveles y banco de preguntas son 100% estáticos e inmutables y residen en el frontend. No se crearán tablas relacionales dinámicas para esto en la base de datos.
- **Backend Ligero**: Supabase Cloud se utiliza exclusivamente para sincronización en tiempo real (`active_players`, `hp`, `room_pin`, `estado`).
- **Limpieza**: Al salir o cerrar pestaña, la fila del jugador se elimina. Si el Anfitrión sale, la sala se destruye.

## 2. Flujo de Estados del Juego (Game Loop)
- El flujo es estricto: `LOBBY` -> `ZONE_SELECTION` -> `COMBAT` -> `ROUND_RESULT` -> `VICTORY`.
- **Fase LOBBY**: No se puede pasar de `LOBBY` a `ZONE_SELECTION` hasta que el 100% de los jugadores marquen 'Listo'.
- **Fase ZONE_SELECTION (Aterrizaje en Mapa & Temporizador)**:
  - Se activa un temporizador síncrono de selección (15 segundos).
  - Cada jugador selecciona su subzona y la confirma.
  - **Transición Automática**: En cuanto el 100% de los jugadores confirmen su zona, la partida pasa AUTOMÁTICAMENTE a `COMBAT` sin botones manuales.
  - **Auto-asignación por Expiración**: Si el tiempo llega a 0s, a los jugadores que no hayan elegido se les asigna una zona por defecto (Nivel 1) y se pasa inmediatamente a `COMBAT`.
- **Fase COMBAT (Duelo Royale)**:
  - Transición automática e inmediata cuando todos están listos o expira el tiempo del mapa.
  - **Pregunta Dinámica Individual**: Cada jugador responde la pregunta **específica de la subzona donde ha aterrizado** (`getQuestionsForZone(temática, mi_subzona)`).

## 3. Sistema de Dificultad Dinámica
El anfitrión elige el `difficulty_mode` ('normal' o 'hard') al crear la sala. Esto altera:
- **Tiempo de combate**: Normal = 10s | Hard = 7s.
- **Daño por Nivel (1/2/3/4)**: Normal = -15/-25/-35/-50 | Hard = -25/-40/-60/-80.
- **Curación por Acertar (Nivel 3/4)**: Normal = +10/+15 | Hard = +0/+5.

## 4. Sistema de Combate y Daño
- El reloj de la fase `COMBAT` es síncrono. La pantalla bloquea selecciones, pero no revela aciertos hasta llegar a 0s.
- La revelación dura exactamente 3.5 segundos.
- El cálculo de daño jamás se evalúa localmente para evitar trampas. Se ejecuta de forma atómica mediante la función RPC `apply_damage(player_id, damage_amount)` en PostgreSQL, garantizando que el HP nunca baje de 0.

## 5. Eliminación (KO) y Supervivencia
- Un jugador con 0 HP nunca es expulsado de la sala. Su estado interno pasa a `ELIMINATED`.
- Pasan al 'Modo Espectador': pierden controles táctiles y visualizan el resto de la partida.
- La fase `VICTORY` solo se activa cuando queda exactamente 1 jugador con HP > 0.

## 6. La Tormenta (Storm Shrinking)
- Tras cada ronda, zonas de niveles inferiores quedan inhabilitadas (rojas).
- Un jugador en una zona consumida sufre daño y es forzado a subir de nivel.
