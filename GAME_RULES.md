# 📜 El Manifiesto de Geo-Royale: Reglas Oficiales y Arquitectura

## 1. Arquitectura de Datos Innegociable & Modo General
- **MVP General**: El juego utiliza un único modo **'General'** que abarca una pirámide de 5 niveles con múltiples disciplinas (Deportes, Cine, Música, Geografía, Ciencia, Historia, Literatura, Tecnología, Arte, Astronomía, Mitología y Desafío Definitivo). Ya no hay selección de temáticas en el Lobby.
- **Frontend Estático**: La configuración del mapa, pirámide de 5 niveles y banco de preguntas son 100% estáticos e inmutables y residen en el frontend.
- **Backend Ligero & Supabase Realtime**: Supabase Cloud se utiliza exclusivamente para la sincronización en tiempo real (`active_players`, `hp`, `room_pin`, `estado`, `readyMap`, `answeredMap`, `floatingEmotes`).
- **Limpieza Atómica**: Al salir o cerrar la pestaña, la fila del jugador se elimina. Si el Anfitrión sale o cierra el navegador, la sala se destruye atómicamente y **todos los jugadores son devueltos automáticamente al menú principal**.

---

## 2. Flujo de Estados del Juego (Game Loop 100% Automatizado)
El flujo del juego es estricto y libre de intervención manual del anfitrión durante la partida:  
`LOBBY` ➔ `ZONE_SELECTION` ➔ `COMBAT` ➔ `ROUND_RESULT` ➔ `ZONE_SELECTION` (o `VICTORY`).

### A. Fase LOBBY (Sala de Espera, UI Premium & Expulsión Automática)
- **Selección de Capacidad**: El Anfitrión elige la capacidad máxima de la sala (`max_players`: 2, 3, 4, 5, 6, 8 o 10 jugadores) y la dificultad ('normal' o 'hard').
- **Tarjeta Unificada de PIN & Conectados**:
  - Código `#PIN` en gradiente de alto contraste con botón de copiado inteligente y estado *"¡Copiado!"*.
  - Contador de exploradores conectados (`X/Y`) con **barra de capacidad animada reactiva**.
- **Tarjetas de Jugadores (2 por Fila)**:
  - Disposición limpia y simétrica de 2 tarjetas por fila (`grid-cols-2`).
  - Resaltado esmeralda en tu propia tarjeta (`"TÚ"`).
  - Insignia de anfitrión (`"👑 Anfitrión"`) e indicador de estado `¡Listo!` / `Esperando`.
- **Inicio de Partida**:
  - **Automático al Llenarse**: Al alcanzar `max_players` y estar el 100% "Listo", la partida inicia automáticamente en 600ms.
  - **Manual por el Anfitrión**: Si hay menos jugadores pero el 100% presente está "Listo", el anfitrión puede iniciar la partida.
- **Sistema de Expulsión Automática al Salir el Anfitrión**:
  - Si el anfitrión pulsa *"Salir"* o cierra el navegador/pestaña, emite un evento `ROOM_CLOSED` y elimina la sala de Supabase. Redirige a todos al menú principal (`/`) en 1.5s.

### B. Fase ZONE_SELECTION (Mapa Táctico de 5 Niveles, Posicionamiento Oculto y Pausa de 2s)
- **Temporizador de Selección**: Cuenta atrás síncrona de 15 segundos.
- **Niebla de Mapa (Posicionamiento Oculto)**: Durante la selección, cada jugador solo visualiza su propia posición.
- **Revelación Sincronizada + Pausa de 2.0s**: Al llegar a 0s o estar todos listos, se revelan las posiciones de todos los exploradores en el mapa y transcurre una **pausa dramática de 2.0 segundos** para observar la táctica rival.
- **Transición Automática**: Al finalizar los 2s de revelación en el mapa, avanza automáticamente a `COMBAT`.

### C. Fase COMBAT (Arena de Duelo Temática & Pregunta Dinámica)
- **Pregunta Dinámica Individual**: Cada jugador responde la pregunta de la subzona temática en la que ha aterrizado.
- **Contador Realtime**: Muestra en directo el progreso de respuestas de los supervivientes (`X/Y jugadores listos` ➔ `¡Todos los jugadores respondieron!`).
- **Revelación de Resultado (2s)**: Al expirar el temporizador o responder todos, transcurren **2.0 segundos de muestra del acierto/fallo y daño** sin botones manuales.
- **Transición Automática**: Finalizados los 2s, avanza automáticamente a `ROUND_RESULT`.

### D. Fase ROUND_RESULT (Clasificación Automatizada de 5 Segundos)
- **Clasificación en Tiempo Real**: Ranking actualizado de jugadores ordenados por HP descendente.
- **Barra de Progreso Animada (5s)**: Cuenta atrás de 5.0s.
- **Interceptor del Bucle**: Transcurridos los 5s, el juego avanza automáticamente a `ZONE_SELECTION`, o a `VICTORY` si solo queda 1 superviviente (o Muerte Súbita si quedan 0).

---

## 3. Sistema de Dificultad Dinámica
El anfitrión elige el `difficulty_mode` ('normal' o 'hard') al crear la sala:
- **Tiempo por pregunta (Ráfaga)**: Normal = **8s** | Hard = **5s** | Nivel 5 (Cúspide) = **5s fijos** en cualquier modo.
- **Daño Base por Nivel (1/2/3/4/5)**: Normal = -15 / -25 / -35 / -50 / -75 | Hard = -25 / -40 / -60 / -80 / -100.
- **Curación por Doble Acierto (Nivel 3/4/5)**: Normal = +10 / +15 / +20 | Hard = +0 / +5 / +10.

---

## 4. Sistema de Combate y Matriz de Ráfaga de 2 Preguntas
Cada asalto en la fase `COMBAT` consiste en una **ráfaga de 2 preguntas consecutivas** evaluadas localmente:
- **Doble Acierto (✅✅)**:
  - **Conquista la zona**: Se añade a `completed_zones` y se limpia `mandatory_zone`.
  - **Daño 0**: No sufre daño alguno.
  - **Curación**: Recibe la curación de su nivel (si aplica).
- **Empate (✅❌ o ❌✅)**:
  - **Zona Atrapada**: Queda atrapado (`mandatory_zone = zona_actual`).
  - **Daño Base (x1)**: Sufre el daño base de la subzona (multiplicado `x1.5` si es Duelo).
  - **Sin curación**: 0 HP curados.
- **Fracaso Crítico (❌❌)**:
  - **Zona Atrapada**: Queda atrapado (`mandatory_zone = zona_actual`).
  - **Daño Doble (x2)**: Sufre el doble del daño base `baseDamage * 2` (multiplicado `x1.5` si es Duelo).
  - **Sin curación**: 0 HP curados.
- **Atomicidad**: El daño final y la curación se aplican atómicamente a PostgreSQL mediante Supabase RPC tras la segunda pregunta.

---

## 5. Eliminación (KO) y Modo Espectador
- Los jugadores que llegan a 0 HP pasan al estado `ELIMINATED`.
- **Regla 5.1 (Modo Espectador Omnisciente)**: Al llegar a 0 HP, el jugador recibe un aviso modal con opción de **'Abandonar Partida'** o **'👁️ Observar Partida'**. Si elige Observar, su cliente se desvincula de las transiciones de combate/preguntas y queda anclado permanentemente en el Mapa Táctico con `isGodMode={true}`. El espectador ignora la 'Niebla de Guerra' y ve los movimientos de todos los jugadores vivos en tiempo real sin bloquear el avance de la partida.
- La pantalla `VICTORY` se activa cuando queda únicamente **1 jugador con HP > 0** en el mapa (o Muerte Súbita si todos caen a la vez).

---

## 6. La Tormenta y el Impacto Progresivo de Tormenta
- **Impacto de Tormenta en Zona Atrapada**: Si al iniciar una nueva ronda un jugador tiene una zona obligatoria (`mandatory_zone`) y esa subzona acaba de ser inhabilitada/destruida por la Tormenta, el jugador sufre un **Impacto de Tormenta**:
  - **Daño Progresivo Escalonado**: Se resta automáticamente vida mediante la función RPC `apply_damage` según el nivel de la zona destruida:
    - **Nivel 1 consumido** (Ronda 5): **-10 HP**
    - **Nivel 2 consumido** (Ronda 8): **-20 HP**
    - **Nivel 3 consumido** (Ronda 10): **-30 HP**
    - **Nivel 4 consumido** (Ronda 11+): **-50 HP**
  - **Ruptura de Bloqueo**: Se libera la trampa (`mandatory_zone = null`), permitiendo y obligando al jugador a huir y seleccionar una nueva subzona abierta en un nivel superior.
  - **Alerta de Emergencia Dinámica**: El jugador recibe un aviso visual de alta prioridad notificando la destrucción de su zona, el nivel destruido y la cantidad exacta de vida perdida.

---

## 7. Rondas y Matriz de Tormenta de 11 Rondas (Storm Shrinking)
La partida avanza a través de una matriz estricta de 11 rondas (`round_number`):
- **Rondas 1 - 2**: SOLO Nivel 1 abierto (4 subzonas). Niveles 2, 3, 4 y 5 bloqueados 🔒.
- **Rondas 3 - 4**: Nivel 2 se abre (3 subzonas). Niveles 1 y 2 abiertos. Niveles 3, 4 y 5 bloqueados 🔒.
- **Ronda 5**: Tormenta 🌩️ inhabilita Nivel 1. Nivel 2 abierto. Niveles 3, 4 y 5 bloqueados 🔒. (¡Impacto de Tormenta -10 HP a quienes estuvieran atrapados en N1!).
- **Rondas 6 - 7**: Nivel 3 se abre (2 subzonas). Niveles 2 y 3 abiertos. Niveles 4 y 5 bloqueados 🔒.
- **Rondas 8 - 9**: Tormenta 🌩️ inhabilita Nivel 2. Nivel 4 se abre (2 subzonas con 5 opciones). Niveles 3 y 4 abiertos. Nivel 5 bloqueado 🔒. (¡Impacto de Tormenta -20 HP en N2!).
- **Ronda 10**: Tormenta 🌩️ inhabilita Nivel 3. Nivel 4 abierto. Nivel 5 bloqueado 🔒. (¡Impacto de Tormenta -30 HP en N3!).
- **Rondas 11+**: Tormenta 🌩️ inhabilita Nivel 4. Nivel 5 (Desafío Definitivo de 5 opciones) se abre en la cúspide. (¡Impacto de Tormenta -50 HP en N4!).

---

## 8. Duelos (Zonas en Disputa)
Si tras la selección de zona, 2 o más jugadores comparten la misma subzona, se activa un **DUELO** ⚔️:
- **Sincronización Determinista de Pregunta**: Los duelistas reciben exactamente la misma pregunta (basada en el `round_number`).
- **Pausa Dramática de Revelado (2.0s)**: Las zonas en disputa vibran (`animate-shake`) con bordes en rojo neón parpadeante y el icono ⚔️ durante los 2s de pausa.
- **Cabecera Agresiva**: La interfaz de combate cambia a: `⚔️ ¡DUELO! Tú vs [Nombres]`.
- **Multiplicador de Daño x1.5**: Fallar en un duelo multiplica el daño base `x1.5` antes de enviarlo a Supabase.

---

## 9. Progresión y Restricción de Zonas (Matriz de Ráfaga)
- **Doble Acierto (Zona Conquistada ✅✅)**: El jugador conquista la subzona (`completed_zones`), se limpia `mandatory_zone` y no puede volver a seleccionarla en toda la partida (marcada con ✅). Debe elegir una nueva zona disponible en la siguiente ronda.
- **Fallo o Empate (Zona Atrapada / Obligatoria ⚠️)**: Si el jugador obtiene un Empate (✅❌ / ❌✅) o Fracaso Crítico (❌❌), queda atrapado (`mandatory_zone = zona_actual`). En la siguiente ronda, está obligado a seleccionar la misma zona (marcada con ⚠️).
- **Excepción de la Tormenta**: Si la zona en la que un jugador está atrapado es consumida por la Tormenta, sufre el **Impacto Progresivo de Tormenta (-10 a -50 HP)**, el bloqueo se rompe (`mandatory_zone = null`) y debe ascender a un nivel superior disponible.

---

## 10. Ascenso Irreversible (Sin Retorno)
El ascenso por la pirámide de 5 niveles es irreversible:
- **Regla de Progresión Vertical**: Si un jugador avanza y juega en un Nivel superior, no puede volver a seleccionar subzonas de niveles inferiores en rondas posteriores, incluso si estas continúan abiertas para otros jugadores.
- **Bloqueo Visual**: Las zonas de niveles inferiores quedan atenuadas (`opacity-40 grayscale pointer-events-none`) con la pastilla `🚫 Sin Retorno`.

---

## 11. Dificultad de 5 Opciones y Reloj de Cúspide
- **5 Opciones de Respuesta**: Las preguntas de **Nivel 4** y **Nivel 5** cuentan con **5 opciones de respuesta** en lugar de 4.
- **Reloj de Cúspide de Nivel 5**: El Nivel 5 fija el temporizador en **5 segundos fijos** por pregunta.
- **Daño Crítico de Cúspide**: El daño base por fallo en Nivel 5 es de **-75 HP** en modo Normal y **-100 HP** en modo Hardcore (pudiendo duplicarse a -150 HP / -200 HP en Fracaso Crítico).



