# Documento de Diseño de Juego (GDD) - Pitwall Manager: F1 2000

## 1. Visión General
* **Título Definitivo:** Pitwall Manager: F1 2000
* **Género:** Estrategia / Gestión Deportiva en Tiempo Real.
* **Rol del Jugador:** Director de Equipo (Team Principal / Jefe de Estrategia).
* **Plataforma:** Navegadores Web (Escritorio).
* **Tecnologías:** HTML5, CSS3, JavaScript Vanilla (ES6 Modules).
* **Ambientación:** Todos los aspectos del juego (vehículos, pilotos, circuitos, normativa) están basados en la temporada 2000 de Fórmula 1.

## 2. Pilares de Diseño
* **Presión en el Muro de Boxes:** Decisiones estratégicas basadas en telemetría en tiempo real.
* **Gestión de Recursos Críticos:** Controlar el ritmo para equilibrar la velocidad con la degradación de neumáticos.
* **Estética de Ingeniería:** Interfaz de alto contraste y modo oscuro que emula las pantallas de datos reales de la Fórmula 1.

---

## 3. Estructura y Arquitectura del Proyecto
El código se organiza de forma modular para garantizar la escalabilidad del juego:

*   `docs/GDD.md`: Este documento conceptual de diseño.
*   `src/index.html`: Estructura semántica de la pantalla de boxes y contenedores de datos.
*   `src/css/style.css`: Maquetación responsiva con CSS Grid, fuentes monoespaciadas y variables de color para banderas de carrera.
*   `src/js/app.js`: Inicializador del juego, gestión del estado global (`gameState`) y bucle principal.
*   `src/js/track.js`: Control del elemento HTML5 Canvas, dibujo del circuito en 2D y renderizado de la posición de los coches.
*   `src/js/physics.js`: Fórmulas matemáticas para el cálculo de tiempos por vuelta, desgaste de neumáticos y consumo.

---

## 4. Mecánicas y Lógica de Juego (Gameplay)

### 4.1. El Motor de Simulación (Game Loop)
* El bucle se gestiona en `app.js` mediante un temporizador asíncrono.
* Cada monoplaza posee un porcentaje de progreso de vuelta (0% a 100%).
* Al llegar al 100%, completa una vuelta, se suma al contador global y se recalculan los tiempos del *Live Timing*.

### 4.2. Variables de los Pilotos del Jugador
El usuario gestiona dos monoplazas independientes con las siguientes métricas:
* **Ritmo:**
  * `Ataque`: Intentar adelantar siempre que sea posible.
  * `Normal`: Conducción de carrera estándar.
  * `Defender`: Defender la posición frente a ataques rivales.
  * `Conservar`: Bajar el ritmo para reducir el estrés del piloto.
* **Modo Motor:**
  * `Alto rendimiento`: Máxima velocidad, máximo consumo de combustible.
  * `Normal`: Equilibrio entre velocidad y consumo.
  * `Ahorro`: Menor velocidad, menor consumo.
* **DRS/ERS:**
  * `Exprimir`: Gastar DRS en cada vuelta disponible.
  * `Normal`: Uso equilibrado del DRS.
  * `Reservar`: Mantener el DRS alto para momentos clave.
* **Degradación de Neumáticos (Tyre Wear):** Comienza en 100%. Al caer por debajo del 30%, el monoplaza pierde adherencia y sus tiempos por vuelta empeoran severamente.
* **Combustible:** Nivel de gasolina (0–100 kg). Mayor carga = más peso = vueltas más lentas. Menos combustible = coche más ligero. El consumo varía según el modo motor seleccionado.
* **Estrés:** Aumenta cuando el piloto está atacando o defendiendo una posición. Disminuye cuando el ritmo de carrera es bajo (Conservar). Afecta al rendimiento del piloto.
* **Cansancio:** Aumenta en las mismas situaciones que el estrés. No se recupera durante la carrera. Afecta al rendimiento del piloto y al delay en la recepción de órdenes (a mayor cansancio, mayor delay).

### 4.3. Ventana de Pit Stop
* El jugador puede activar el checkbox "Solicitar parada" en cualquier momento de la vuelta.
* La orden se ejecuta tras un delay que depende del nivel de cansancio del piloto. A mayor cansancio, mayor delay en la recepción y ejecución de instrucciones.
* El coche entrará al Pit Lane de forma automática al alcanzar el 100% de su progreso actual si la parada está solicitada.
* **Menú de Selección por piloto:**
  * Dropdown de compuesto para el siguiente relevo.
  * Range de gasolina (0–100 kg) con marcas de referencia en 22 kg, 30 kg y 100 kg.
  * Checkbox "Solicitar parada".

#### Compuestos disponibles

| Compuesto | Duración estimada | Comportamiento |
|-----------|-------------------|----------------|
| 🟥 Blando | 15–20 vueltas | Muy rápido, pero sufre degradación térmica veloz. Ideal para tandas cortas. |
| 🟨 Medio | 25–35 vueltas | El neumático estándar y más polivalente. Combina versatilidad y ritmo constante. |
| ⬜ Duro | 35–45 vueltas | Alta durabilidad sacrificando velocidad punta en curvas rápidas. |
| 🟢 Intermedio | Toda carrera si la pista está húmeda. 5–8 si se seca. | Para pista húmeda. |
| 🔵 Lluvia | Toda carrera si llueve. 3–4 si se seca. | Diseñado para evacuar charcos profundos. |

#### Tiempo de parada en boxes
```
tiempo_total = max(cambio_neumáticos, repostaje) + 2s_fijos

cambio_neumáticos = aleatorio entre 2.5s y 3.5s
repostaje = combustible_a_cargar / 9 kg/s
```

### 4.4. Inteligencia Artificial y Eventos
* **Rivales de la IA:** Hasta 18 pilotos compiten autónomamente. La IA gestiona las mismas variables que el jugador (ritmo, modo motor, combustible, neumáticos, paradas en boxes). Existen varias personalidades de IA con comportamientos distintos (agresiva, conservadora, equilibrada, etc.). La IA responde al ritmo global de la carrera, no directamente a las acciones del jugador.
* **Incidentes Aleatorios:** Posibilidad de banderas amarillas o despliegue del *Safety Car*, lo que ralentiza el ritmo global y abre ventanas estratégicas para detenerse en boxes.

### 4.5. Clima Dinámico
* El clima puede cambiar durante la carrera (seco → lluvia → variable).
* Las condiciones climáticas afectan al agarre y los tiempos por vuelta.
* Influye directamente en la elección de neumáticos (slicks en seco / intermedios / lluvia).
* Los cambios de clima abren ventanas estratégicas de pit stop.

### 4.6. Modo de juego

* Las órdenes del jugador se ejecutan con un delay variable que depende del nivel de cansancio del piloto, simulando la latencia de comunicación e interpretación de instrucciones.
* Posible mejora futura: delay también influenciado por la habilidad del piloto, tipo de orden y zona del circuito (curva vs recta).

---

## 5. Criterios de Victoria y Progresión

### 5.1. Condiciones de Fin de Carrera
* **Derrota:** Si ambos coches abandonan (Doble DNF), se muestra una pantalla de derrota.
* **Victoria:** Si al menos uno de los dos coches finaliza en 1ª posición, se muestra una pantalla de victoria.
* **Resultado intermedio:** En cualquier otra situación, se muestra una pantalla de resumen con el puesto final de cada piloto.

### 5.2. Progresión
* Actualmente el juego se compone de carreras individuales independientes.
* **Futura feature:** Campaña con múltiples circuitos, tabla de posiciones global y mejoras progresivas del equipo entre carreras.

## 6. Notas adicionales
* **Audio:** Pendiente para versión futura. Se implementará música de fondo y efectos de sonido para eventos especiales (golpes, accidentes, salidas de pista) y efectos climáticos (lluvia, tormentas).

---

## 7. Especificación de Interfaz de Usuario (UI/UX)

### 7.1. Pantalla de Título

```
┌─────────────────────────────────────┐
│         🏁 PITWALL MANAGER          │
│                                     │
│  ☀️ Clima actual: 24°C - Seco       │
│  🌧 Pronóstico: Lluvia en vta 25    │
│                                     │
│  Neumático inicio: [▼ Blando   ]    │
│  ⛽ Carga inicial: [══●══] 65 kg    │
│                                     │
│  Marcas referencia gasolina:        │
│   ─ 100 kg (0 paradas, 60 vtas)    │
│   ─ 30 kg  (2 paradas, 20 vtas c/u)│
│   ─ 22 kg  (3 paradas, 15 vtas c/u)│
│                                     │
│  [🏁 INICIAR CARRERA]               │
└─────────────────────────────────────┘
```

### 7.2. Layout de Carrera (Tríptico)

```
┌──────────────────────────────────────────────────────────────┐
│  ⏱ Hora │  ☀️ Clima actual │  🌧 Previsión cambio en X vtas │
├──────────────┬────────────────────────┬─────────────────────┤
│  📋 TIMING   │     🏁 CIRCUITO        │  📡 ÓRDENES         │
│  Vuelta N    │   [Canvas 2D con       │  ┌─ PILOTO 1 ────┐ │
│  ─────────   │    20 monoplazas       │  │ Ritmo [▼]     │ │
│  PILOTO 1    │    animados]           │  │ Motor [▼]     │ │
│  P3  +1.2s   │                        │  │ DRS/ERS [▼]   │ │
│  ⬛ S24(6)   │                        │  │ ── BOXES ──   │ │
│              │                        │  │ Neumático [▼] │ │
│  PILOTO 2    │                        │  │ Gasolina [══] │ │
│  P5  +3.8s   │                        │  │ ☐ Solicitar   │ │
│  ⬜ H18(10)  │                        │  └───────────────┘ │
│              │                        │  ┌─ PILOTO 2 ────┐ │
│  ─────────   │                        │  │ ...            │ │
│  V. Rápida   │                        │  └───────────────┘ │
│  VER(P4)     │                        ├─────────────────────┤
│  1:23.456    │                        │  🏎️ ESTADOS         │
│              │                        │  ┌─ PILOTO 1 ────┐ │
│              │                        │  │ [Diagrama      │ │
│              │                        │  │  coche vista   │ │
│              │                        │  │  superior]     │ │
│              │                        │  │ 😰 ████░░ 40%  │ │
│              │                        │  │ 😓 ██░░░░ 20%  │ │
│              │                        │  └───────────────┘ │
│              │                        │  ┌─ PILOTO 2 ────┐ │
│              │                        │  │ ...            │ │
│              │                        │  └───────────────┘ │
└──────────────┴────────────────────────┴─────────────────────┘
```

### 7.3. Panel de Órdenes (por piloto)
* **Fieldset "Órdenes":** Dropdowns de Ritmo, Motor y DRS/ERS.
* **Fieldset "Boxes":** Dropdown de neumático, range de gasolina (0–100 kg con marcas 22/30/100) y checkbox "Solicitar parada".

### 7.4. Panel de Estados (por piloto)
* **Diagrama del coche en vista superior** con partes coloreadas según estado:
  - 4 neumáticos (🟡 nuevo → 🟢 óptimo → 🟡 desgaste → 🔴 crítico)
  - Alerón delantero (izquierdo / derecho)
  - Alerón trasero (izquierdo / derecho)
  - Morro
  - Cuerpo principal
  - Motor
  - Colores: transparente (bien), amarillo (tocado), rojo (mal)
* **Barras de estado del piloto:**
  - 😰 Estrés (0–100%, recuperable)
  - 😓 Cansancio (0–100%, no recuperable en carrera)

### 7.5. Pantalla de Resultados
* Puesto final de cada piloto.
* Estadísticas: vueltas completadas, compuestos usados, paradas realizadas, ritmo medio.
* Botón "Volver al menú".
