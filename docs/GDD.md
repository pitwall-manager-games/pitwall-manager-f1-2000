# GDD — Pitwall Manager: F1 2000

## 1. Visión General

- **Título Definitivo:** Pitwall Manager: F1 2000
- **Género:** Estrategia / Gestión Deportiva en Tiempo Real (inspirado en el estilo asíncrono de Hattrick)
- **Rol del Jugador:** Director de Equipo (Team Principal / Jefe de Estrategia)
- **Plataforma:** Navegadores Web (Escritorio)
- **Tecnologías:** HTML5, CSS3, JavaScript Vanilla (ES6 Modules)
- **Ambientación:** Todos los aspectos del juego (vehículos, pilotos, circuitos, normativa) están basados en la temporada 2000 de Fórmula 1.

## 2. Filosofía de Diseño

- **Presión en el Muro de Boxes:** Decisiones estratégicas basadas en telemetría en tiempo real (asíncrono por ticks).
- **Gestión de Recursos Críticos:** Controlar el ritmo para equilibrar la velocidad con la degradación de neumáticos y el consumo de combustible.
- **Estética de Ingeniería:** Interfaz de alto contraste y modo oscuro que emula las pantallas de datos reales de la Fórmula 1.
- **Estilo Hattrick:** Motor de juego tick-based donde el jugador da órdenes y espera ticks para ver resultados. La carrera avanza por fracciones de vuelta procesándose eventos de forma asíncrona. El énfasis está en la planificación estratégica, no en los reflejos.
- **Circuito Modular (Slot Car):** El trazado se diseña como un circuito de slot car dividido en secciones (rectas, curvas, chicanes, horquillas). Cada sección tiene una longitud y una capacidad máxima de coches. Esto permite calcular densidades de tráfico, distancias y tiempos sector por sector.

## 3. Estructura del Proyecto

```
pitwall-manager-f1-2000/
├── docs/
│   └── GDD.md              # Este documento (Game Design Document unificado)
├── src/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js                  # Inicializador y bucle principal
│       ├── track.js                # Render SVG del circuito
│       ├── circuits.js             # Datos estáticos de circuitos (generados)
│       ├── circuit-generator.js    # Generador procedural de circuitos
│       └── physics.js              # Fórmulas de simulación
├── AGENTS.md
└── package.json
```

## 4. Documentación Relacionada

- [Visión general de la saga](../../docs/GDD_Saga.md) — contexto de la franquicia.

---

## 5. Circuito y Pista

### 5.1. Diseño Modular (Estilo Slot Car)

El circuito se divide en **secciones modulares** que representan los segmentos típicos de un trazado de carreras. Cada sección es una pieza independiente con sus propias propiedades:

**Tipos de Pieza**

Cada pieza mide 20 m × 10 m. Las coordenadas (x, y) y ángulo de cada pieza se calculan proceduralmente encadenando las piezas en secuencia.

| Pieza | Descripción | Dir | Efecto en velocidad |
|-------|-------------|-----|---------------------|
| `recta` | Recta genérica | — | 100 % |
| `recta_salida` | Recta de meta/salida | — | 100 % |
| `recta_parrilla` | Recta con posiciones de parrilla (×3) | — | 100 % |
| `R4` | Curva de radio 45 m (rápida) | left / right | ~90 % |
| `R3` | Curva de radio 35 m | left / right | ~77 % |
| `R2` | Curva de radio 25 m | left / right | ~63 % |
| `R1` | Curva de radio 15 m (cerrada) | left / right | ~50 % |
| `Y_entrada` | Entrada a calle de boxes | — | 25 % si pit |
| `recta_boxes` | Calle de boxes (×3) | — | 25 % si pit |
| `recta_aceleracion` | Salida de boxes | — | 25 % si pit |
| `Y_salida` | Reincorporación desde boxes | — | 100 % |

**Generación de trazados**

Se definen 5 perfiles de circuito con secuencias de curvas específicas. El generador procedural (`circuit-generator.js`) intercala rectas entre las curvas para alcanzar la longitud objetivo del circuito, luego posiciona cada pieza secuencialmente mediante trigonometría (segmentos rectos L, arcos A con radio y sweep flag). Los datos generados se exportan a `circuits.js` como JSON estático.

| Circuito | Longitud | Piezas | Tipo | Config. fábrica |
|----------|----------|--------|------|-----------------|
| Alpe d'Azur | 4820 m | 241 | Mixto | Media / Medio / Media |
| Bosque de la Plata | 4620 m | 231 | Lento | Alta / Corto / Baja |
| Puerto Coronado | 5220 m | 261 | Velocidad | Baja / Largo / Baja |
| Lago Esmeralda | 4620 m | 231 | Técnico | Alta / Corto / Media |
| Valle del Trueno | 4520 m | 226 | Revoltoso | Media / Medio / Alta |

### 5.2. Capacidad y Densidad de Tráfico

Cada sección tiene una **capacidad máxima** de coches que pueden ocuparla simultáneamente. Si una sección está llena, los coches detrás no pueden entrar hasta que se libere espacio. Esto crea restricciones naturales de tráfico que afectan a la estrategia de adelantamiento y paradas en boxes.

### 5.3. Estado por Sección

Cada pieza tiene un campo `condition` (dry / wet) que determina el agarre. El clima global (dry / rain) actualiza el estado de todas las piezas, con transición progresiva de dry → húmedo → rain.

### 5.4. Representación Visual (SVG)

El circuito se dibuja como un **SVG minimalista** usando paths:
- **Trazo principal:** Path que une los centros de cada pieza secuencialmente, con ancho de 10 px simulando la pista.
- **Curvas:** Usan arcos SVG (`A`) con el radio y dirección de cada curva.
- **Calle de boxes:** Path independiente con trazo discontinuo superpuesto sobre las piezas recta_boxes / recta_aceleracion.
- **Línea de meta:** Línea perpendicular al trazado en la recta_salida.
- **Coches:** Representados como **círculos** de 4 px de radio con el color del equipo, posicionados mediante `getCarPosition(pieceIndex, pieceMeters)` que interpola en rectas (lineal) y curvas (arco). El piloto del jugador se resalta con un círculo concéntrico adicional.

---

## 6. Sistema de Carrera (Tick-Based)

### 6.1. Motor de Simulación

El juego avanza mediante **ticks** (fracciones de vuelta procesadas de forma asíncrona). En cada tick:

1. Se recalcula la **posición** de todos los coches (qué sección ocupan y su progreso dentro de ella).
2. Se procesan las **órdenes del jugador** cuyo delay haya expirado.
3. Se actualizan las variables de estado (combustible, degradación, estrés, fatiga).
4. Se evalúan los **eventos** (adelantamientos, cambios de clima, incidentes).
5. Se actualiza la **interfaz** (Live Timing, posiciones, estado de la pista).

### 6.2. Progreso por Pieza (Meters)

Cada monoplaza tiene una posición definida por `pieceIndex` (índice de pieza en el circuito) y `pieceMeters` (metros dentro de la pieza actual, 0–20 m). Al superar 20 m, avanza a la siguiente pieza. Al superar el índice de la última pieza, completa una vuelta.

El progreso en metros por tick se calcula como:

```
metros/tick = (longitud_circuito / 250) × factor_ritmo × factor_motor × factor_neumático × adherencia × factor_combustible × factor_estrés × factor_fatiga × factor_clima × factor_pieza
```

El **factor_pieza** se reduce en curvas según el radio (R1: ~0.5, R4: ~0.9) y en calle de boxes cuando se solicita parada (0.25×).

### 6.3. Adelantamientos

Los adelantamientos se resuelven mediante lógica basada en:

- **Posición en pista:** Distancia entre coches (misma sección o secciones contiguas).
- **Habilidad del piloto:** (futuro) Estadísticas de pilotaje.
- **Atributos del coche:** Velocidad punta, tracción, carga aerodinámica.
- **Ritmo seleccionado:** Ataque facilita adelantar; Defender dificulta ser adelantado.
- **Estado de la pista:** Mojado reduce probabilidad de adelantamiento exitoso.

---

## 7. Vehículo

Cada equipo tiene **un coche** compartido por sus dos pilotos. El coche se compone de dos grandes partidas presupuestarias (motor+transmisión, chasis+aerodinámica), cada una con 5 niveles de calidad que se adquieren en la pantalla económica.

### 7.1. Motor V10

El jugador puede seleccionar entre tres modos de mapeo motor para cada piloto:

| Modo | Velocidad | Consumo | Uso típico |
|------|-----------|---------|------------|
| Alto rendimiento | Máxima | Máximo (+25 % respecto a Normal) | Adelantamientos, vueltas rápidas |
| Normal | Equilibrada | Equilibrado | Ritmo de carrera estándar |
| Ahorro | Reducida | Reducido (-20 % respecto a Normal) | Conservar combustible, tandas largas |

**Relación con el V10:** El motor V10 de la temporada 2000 se caracteriza por altas revoluciones (hasta ~19,000 RPM), respuesta lineal y predecible, y consumo proporcional al régimen de giro. El modo motor no afecta directamente al desgaste de neumáticos ni al estrés del piloto.

### 7.2. Combustible

- **Rango:** 0–100 kg.
- **Peso y velocidad:** Mayor carga de combustible = mayor peso = vueltas más lentas. A medida que el combustible se consume, el coche se aligera y los tiempos por vuelta mejoran progresivamente (efecto más notable en circuitos con muchas curvas).

**Referencias de Carga**

| Carga | Paradas estimadas | Vueltas por tanda |
|-------|-------------------|-------------------|
| 100 kg | 0 paradas | ~60 vueltas |
| 30 kg | 2 paradas | ~20 vueltas cada una |
| 22 kg | 3 paradas | ~15 vueltas cada una |

Estas marcas aparecen en el range de gasolina del menú de preparación previo a la carrera.

### 7.3. Componentes mecánicos

El rendimiento del coche se determina por 4 componentes agrupados en 2 partidas presupuestarias:

| Partida | Componente 1 | Componente 2 | Afecta a |
|---------|--------------|--------------|----------|
| **Motor** | Motor | Caja de cambios | Potencia, velocidad punta, consumo, aceleración, tracción |
| **Chasis y aerodinámica** | Suspensión | Aerodinámica | Agarre en curva, bordillos, degradación de neumáticos, carga en mojado |

Cada partida tiene un nivel (1–5) que determina la calidad base de ambos componentes. El **slider de balance** dentro de cada partida permite distribuir esa calidad entre los dos componentes (ver sección 12).

### 7.4. Fiabilidad y desgaste

Cada componente tiene un **% de vida** (100 % → 0 %) que se desgasta durante la carrera:

- El desgaste se acelera con ritmo Ataque, bordillos y pista mojada.
- Cuando un componente llega a 0 % → **rotura** que provoca abandono o pérdida severa de rendimiento.
- Componentes de nivel alto se desgastan más lentamente.
- El desgaste se calcula por vuelta según ritmo, tipo de sección y estado de la pista.

### 7.5. Evolución y mejoras

*Pendiente para versión futura con campaña/temporada. Actualmente el vehículo se configura desde cero en cada carrera.*

### 7.6. Configuración por circuito (Setup)

Cada piloto puede tener su propia configuración. Al seleccionar un circuito, se carga una **configuración de fábrica** óptima para un piloto intermedio (N3). El jugador puede modificarla en la pantalla de preparación mediante tandas de prueba.

| Parámetro | Rango | Efecto |
|-----------|-------|--------|
| **Carga alar** | Baja / Media / Alta | Baja = más velocidad punta, menos agarre. Alta = más agarre, menos punta. |
| **Ratio de cambio** | Corto / Medio / Largo | Corto = mejor aceleración, menor punta. Largo = lo inverso. |
| **Altura** | Baja / Media / Alta | Baja = mejor aerodinámica, peor en bordillos. Alta = mejor en baches, menos carga. |

---

## 8. Neumáticos

### 8.1. Compuestos Disponibles

| Compuesto | Duración estimada | Comportamiento |
|-----------|-------------------|----------------|
| Blando | 15–20 vueltas | Muy rápido, pero sufre degradación térmica veloz. Ideal para tandas cortas. |
| Medio | 25–35 vueltas | El neumático estándar y más polivalente. Combina versatilidad y ritmo constante. |
| Duro | 35–45 vueltas | Alta durabilidad sacrificando velocidad punta en curvas rápidas. |
| Intermedio | Toda carrera si la pista está húmeda. 5–8 si se seca. | Para pista húmeda. |
| Lluvia | Toda carrera si llueve. 3–4 si se seca. | Diseñado para evacuar charcos profundos. |

### 8.2. Degradación

- Comienza en 100 %.
- Al caer por debajo del 30 %, el monoplaza pierde adherencia.
- Los tiempos por vuelta empeoran severamente por debajo del 30 %.
- La degradación se acelera en curvas, especialmente con ritmo Ataque o en pista mojada con compuesto inadecuado.

---

## 9. Paradas en Boxes

### 9.1. Flujo de Parada

1. El jugador activa **"Solicitar parada"** mediante checkbox en cualquier momento.
2. La orden se ejecuta tras un **delay que depende del cansancio del piloto** (simula latencia de radio).
3. El coche entra al Pit Lane automáticamente al completar la vuelta si la parada está solicitada.
4. Menú de selección por piloto:
   - Dropdown de **compuesto** para el siguiente relevo.
   - Range de **gasolina** (0–100 kg) con marcas 22/30/100.
   - Checkbox **"Solicitar parada"**.

### 9.2. Tiempo de Parada

```
tiempo_total = max(cambio_neumáticos, repostaje) + 2s_fijos

cambio_neumáticos = aleatorio entre 2.5s y 3.5s
repostaje = combustible_a_cargar / 9 kg/s
```

El tiempo total de parada se descuenta del progreso del coche en el siguiente tick.

---

## 10. Clima

### 10.1. Sistema Climático

- El clima puede cambiar durante la carrera (seco → lluvia → variable).
- La **previsión** se muestra en la pantalla de título y durante la carrera (indica en cuántas vueltas se espera un cambio significativo).

### 10.2. Efectos en Juego

- Las condiciones climáticas afectan al agarre y los tiempos por vuelta.
- Influye directamente en la elección de neumáticos (slicks en seco / intermedios / lluvia).
- Los cambios de clima abren ventanas estratégicas de pit stop.

### 10.3. Transiciones

- La transición de seco a lluvia es **progresiva** (pasando por estados húmedo).
- La pista puede estar **húmeda sin llover activamente**.
- El pronóstico indica con antelación (en número de vueltas) cuándo se espera un cambio significativo.
- El estado de humedad se aplica **por sección**: la lluvia puede afectar más a unas zonas que a otras.

---

## 11. Pilotos

Cada piloto tiene un conjunto de atributos base, rasgos de personalidad y un estado físico que afectan a su rendimiento en carrera. Los atributos se definen al comprar el piloto según su nivel de coste y no varían durante la carrera (excepto la confianza, que es dinámica).

### 11.1. Atributos base

| Atributo | Rango | Efecto en carrera |
|---|---|---|
| **Habilidad** | 0–99 | Rendimiento base en condiciones normales. Afecta directamente al tiempo por vuelta. |
| **Experiencia** | 0–99 | Reduce la probabilidad de errores (salidas de pista, trompos). Mejora la lectura de carrera. |
| **Rendimiento en mojado** | 0–99 | Rendimiento cuando la pista está húmeda o mojada. Un piloto con baja puntuación pierde más tiempo bajo lluvia. |
| **Consistencia** | 0–99 | Variabilidad entre vueltas. Alta = tiempos repetibles. Baja = vueltas erráticas (una rápida, la siguiente lenta). |
| **Reflejos** | 0–99 | Capacidad de reacción en salidas, evitar incidentes y ejecutar adelantamientos/defensas en el momento preciso. |

**Rangos por nivel de piloto**

| Nivel | Coste | Habilidad | Experiencia | Rend. mojado | Consistencia | Reflejos |
|-------|-------|-----------|-------------|-------------|--------------|----------|
| 5 (Estrella) | 2.500.000 | 80–95 | 70–90 | 60–90 | 75–90 | 70–90 |
| 4 | 2.000.000 | 65–80 | 55–75 | 50–75 | 60–80 | 55–75 |
| 3 (Medio) | 1.500.000 | 50–65 | 40–60 | 40–60 | 45–65 | 40–60 |
| 2 | 1.000.000 | 35–50 | 25–45 | 30–50 | 30–50 | 25–45 |
| 1 (Novato) | 500.000 | 20–35 | 10–25 | 20–40 | 15–30 | 15–30 |

Cada piloto tiene valores concretos dentro de estos rangos, con ligera dispersión para que no haya dos pilotos idénticos.

### 11.2. Personalidad

| Rasgo | Rango | Tipo | Comportamiento |
|---|---|---|---|
| **Agresividad** | 1–10 | Fijo | Predisposición a usar ritmo Ataque/Defender. Alta = ralentiza menos con rivales cerca. Baja = tiende a Conservar si está presionado. |
| **Lealtad** | 1–10 | Fijo | Probabilidad de aceptar órdenes de equipo (dejar pasar al compañero, cubrir estrategia). Alta = acepta sin discusión. Baja = puede ignorar órdenes. |
| **Confianza** | 0–100 | Dinámico (intra-carrera) | Sube al completar vueltas limpias, adelantar o defender con éxito. Baja al cometer errores, ser adelantado o sufrir un incidente. Se resetea cada carrera. Afecta a todos los atributos hasta ±5 puntos. |

### 11.3. Estado físico

| Variable | Comportamiento |
|---|---|
| **Fatiga / Cansancio** | Se acumula durante la carrera (ver sección 14.2). Afecta al rendimiento y al delay de recepción de órdenes. No se recupera durante la carrera. |
| **Lesiones** | Pendiente para versión futura. |

### 11.4. Progresión

*Pendiente. Al no haber persistencia entre carreras (todo se resetea al terminar), la progresión de atributos entre carreras no aplica. Para una versión futura con campaña/temporada.*

---

## 12. Presupuesto y selección

Cada carrera, el jugador dispone de un presupuesto de **5.000.000 €** para invertir en pilotos y componentes del coche. La IA también gestiona su presupuesto según su personalidad.

### 12.1. Presupuesto

- **Presupuesto por carrera:** 5.000.000 € (se renueva cada GP).
- El gasto total no puede superar el presupuesto disponible.
- El crédito no gastado se pierde al iniciar la carrera.

### 12.2. Coste de pilotos

5 niveles de calidad, cada uno con un coste fijo:

| Nivel | Coste | Perfil |
|-------|-------|--------|
| 5 (Estrella) | 2.500.000 € | Atributos sobresalientes |
| 4 | 2.000.000 € | Muy bueno |
| 3 (Medio) | 1.500.000 € | Competitivo |
| 2 | 1.000.000 € | Aceptable |
| 1 (Novato) | 500.000 € | En desarrollo |

### 12.3. Coste motor + caja de cambios

| Nivel | Coste | Prestaciones |
|-------|-------|-------------|
| 5 | 1.500.000 € | Potencia máxima + fiabilidad |
| 4 | 1.300.000 € | Alto rendimiento |
| 3 | 1.100.000 € | Equilibrado |
| 2 | 950.000 € | Modesto |
| 1 | 800.000 € | Económico |

**Slider de balance:** Dentro de esta partida, un slider permite distribuir la calidad entre motor y caja de cambios. El coste total no varía, solo el reparto interno (ver 7.3).

### 12.4. Coste chasis + aerodinámica

| Nivel | Coste | Prestaciones |
|-------|-------|-------------|
| 5 | 1.000.000 € | Carga máxima + eficiencia |
| 4 | 875.000 € | Buen comportamiento |
| 3 | 750.000 € | Estándar |
| 2 | 625.000 € | Básico |
| 1 | 500.000 € | Obsoleto |

**Slider de balance:** Similar al del motor, distribuye calidad entre suspensión y aerodinámica.

### 12.5. Circuitos

5 circuitos ficticios disponibles en la pantalla de preparación:

| Circuito | Tipo de trazado | Config. fábrica (alar/ratio/altura) |
|----------|----------------|-------------------------------------|
| Alpe d'Azur | Mixto | Media / Medio / Media |
| Bosque de la Plata | Curvas lentas | Alta / Corto / Baja |
| Puerto Coronado | Velocidad | Baja / Largo / Baja |
| Lago Esmeralda | Técnico | Alta / Corto / Media |
| Valle del Trueno | Revoltoso | Media / Medio / Alta |

### 12.6. Presupuesto de la IA

Cada equipo IA recibe el mismo presupuesto de 5.000.000 € y lo distribuye según su personalidad:

| Personalidad | Comportamiento presupuestario |
|---|---|
| **Agresiva** | Invierte más en motor y pilotos estrella, descuida chasis |
| **Conservadora** | Reparto equilibrado, prioriza fiabilidad |
| **Equilibrada** | Distribución sensata sin extremos |

---

## 13. IA Rival

### 13.1. Rivales

- **10 pilotos** de IA (5 equipos de 2 pilotos) compiten autónomamente.
- Cada equipo tiene un color distintivo: rojo, amarillo, verde, azul, naranja.
- Sus pilotos se identifican como `{color}-1` y `{color}-2`.

| Equipo | Piloto 1 | Piloto 2 | Color |
|--------|----------|----------|-------|
| **ROJ** | ROJ-1 | ROJ-2 | Rojo |
| **AMA** | AMA-1 | AMA-2 | Amarillo |
| **VER** | VER-1 | VER-2 | Verde |
| **AZU** | AZU-1 | AZU-2 | Azul |
| **NAR** | NAR-1 | NAR-2 | Naranja |

Los atributos y el coche de los pilotos IA se rigen por las mismas secciones 11 (Pilotos) y 7 (Vehículo).

### 13.2. Comportamiento

La IA gestiona las mismas variables que el jugador:
- Ritmo (ataque, normal, defender, conservar)
- Mapeo motor (alto rendimiento, normal, ahorro)
- Combustible y neumáticos
- Paradas en boxes

### 13.3. Personalidades

| Personalidad | Comportamiento |
|--------------|----------------|
| **Agresiva** | Tiende a usar ritmo de ataque y alto rendimiento, pero desgasta más neumáticos y combustible |
| **Conservadora** | Prioriza la gestión de recursos sobre la velocidad pura |
| **Equilibrada** | Alterna entre modos según el contexto de carrera |

### 13.4. Reglas Generales

- La IA responde al **ritmo global de la carrera**, no directamente a las acciones del jugador.
- Cada piloto IA tiene su propia estrategia de paradas predefinida pero sensible al contexto (clima).

---

## 14. Órdenes y Comunicaciones

### 14.1. Ritmo

| Valor | Comportamiento |
|-------|----------------|
| Ataque | Intentar adelantar siempre que sea posible |
| Normal | Conducción de carrera estándar |
| Defender | Defender la posición frente a ataques rivales |
| Conservar | Bajar el ritmo para reducir el estrés del piloto |

### 14.2. Variables del Piloto

**Estrés**
- Aumenta cuando el piloto está atacando o defendiendo.
- Disminuye cuando el ritmo es bajo (Conservar).
- Afecta al rendimiento del piloto.
- Se recupera durante la carrera.

**Cansancio (Fatiga)**
- Aumenta en las mismas situaciones que el estrés.
- **No se recupera durante la carrera**.
- Afecta al rendimiento del piloto.
- Afecta al **delay en la recepción de órdenes** (a mayor cansancio, mayor delay).

### 14.3. Sistema de Comunicaciones

Las órdenes del jugador se ejecutan con un **delay variable** que depende del nivel de cansancio del piloto, simulando la latencia de comunicación e interpretación de instrucciones por radio. Durante este delay, el coche mantiene su comportamiento anterior.

Posible mejora futura: delay también influenciado por la habilidad del piloto, tipo de orden y sección del circuito (curva vs recta).

---

## 15. Interfaz de Usuario (UI/UX)

El juego tiene 3 pantallas principales (más la pantalla de resultados).

### 15.1. Pantalla Económica

Gestión de presupuesto: selección de nivel de pilotos y componentes del coche.

```
┌──────────────────────────────────────────────────┐
│     PITWALL MANAGER — ECONÓMICA                   │
│                                                    │
│  PRESUPUESTO: 5.000.000 €                         │
│                                                    │
│  ── COCHE ──                                      │
│  Motor + Caja cambios                             │
│    Nivel: [▼ N3 · 1.100.000 € ]                  │
│    Balance:  Motor [══●══════] Caja              │
│                                                    │
│  Chasis + Aerodinámica                            │
│    Nivel: [▼ N3 · 750.000 € ]                    │
│    Balance:  Susp  [══════●══] Aero              │
│                                                    │
│  ── PILOTOS ──                                    │
│  Piloto 1 (JUG-1): [▼ N3 · 1.500.000 €]         │
│  Piloto 2 (JUG-2): [▼ N2 · 1.000.000 €]         │
│                                                    │
│  ─────────────────────────────────────             │
│  GASTO TOTAL:              4.350.000 €            │
│  CRÉDITO RESTANTE:          650.000 €             │
│                                                    │
│  [ CONTINUAR A PREPARACIÓN ]                       │
└──────────────────────────────────────────────────┘
```

### 15.2. Pantalla de Preparación

Selección de circuito, configuración de setup por piloto y zona de pruebas.

```
┌──────────────────────────────────────────────────────────┐
│     PITWALL MANAGER — PREPARACIÓN                         │
│                                                           │
│  CIRCUITO                                                 │
│  [▼ Alpe d'Azur                     ]                    │
│                                                           │
│  ── CONFIGURACIÓN COCHE ──                               │
│                                                           │
│  JUG-1 (Piloto N3)          Tandas restantes: 5          │
│    Carga alar:  [▼ Alta       ]   Defecto: Alta          │
│    Ratio cambio: [▼ Corto      ]   Defecto: Corto         │
│    Altura:       [▼ Baja       ]   Defecto: Baja          │
│                                                           │
│  JUG-2 (Piloto N2)          Tandas restantes: 5          │
│    Carga alar:  [▼ Media      ]   Defecto: Media         │
│    Ratio cambio: [▼ Medio      ]   Defecto: Medio         │
│    Altura:       [▼ Media      ]   Defecto: Media         │
│                                                           │
│  ── PRUEBAS ──                                           │
│  JUG-1 · Tanda 0/5 · 0/5 vueltas                        │
│  [▶ INICIAR TANDA (5 vtas)]                             │
│  Resultados: (pendiente)                                 │
│  Feedback: (pendiente)                                   │
│                                                           │
│  JUG-2 · Tanda 0/5 · 0/5 vueltas                        │
│  [▶ INICIAR TANDA (5 vtas)]                             │
│  Resultados: (pendiente)                                 │
│  Feedback: (pendiente)                                   │
│                                                           │
│  ─────────────────────────────────────────────            │
│  Neumático inicio: [▼ Blando   ]                         │
│  Carga inicial:    [══●══] 65 kg                         │
│  Marcas ref: 22 / 30 / 100 kg                            │
│  ☀️ 24°C · 🌧 Lluvia en vta 25                          │
│                                                           │
│  [ INICIAR CARRERA ]                                      │
└──────────────────────────────────────────────────────────┘
```

**Sistema de tandas de prueba**

Al seleccionar un circuito, cada piloto carga la configuración de fábrica. El jugador puede modificarla y lanzar tandas de 5 vueltas (máx. 5 tandas por piloto) para obtener feedback:

| Tras cada tanda se muestra |
|---|
| Tiempos: mejores 3 vueltas, media, consistencia |
| Feedback textual del piloto (ver abajo) |
| Sugerencia de ajuste (según nivel del piloto) |

**Feedback del piloto por parámetro**

| Condición | Texto |
|---|---|
| Carga alar demasiado alta | "Perdemos mucha velocidad en recta, el alerón está muy agresivo" |
| Carga alar demasiado baja | "El coche no tracciona en curva, necesito más carga" |
| Carga alar correcta | "La carga alar está bien para este trazado" |
| Ratio demasiado corto | "Las marchas se acaban muy rápido en las rectas largas" |
| Ratio demasiado largo | "La aceleración es muy lenta al salir de curva" |
| Ratio correcto | "El escalado de marchas es adecuado" |
| Altura demasiado baja | "Los bordillos me castigan, el coche rebota mucho" |
| Altura demasiado alta | "El coche balancea demasiado en las curvas rápidas" |
| Altura correcta | "La altura de conducción es buena" |
| Subviraje | "El tren delantero no gira, me voy largo en las curvas lentas" |
| Sobreviraje | "La trasera se escapa en curvas rápidas, necesito más agarre atrás" |
| Equilibrio bueno | "El coche responde bien, tiene buen equilibrio" |

**Precisión del feedback según nivel del piloto**

| Nivel | Feedback | Sugerencia |
|---|---|---|
| 5 (Estrella) | Identifica problemas con precisión + dirección de ajuste concreta | "Prueba alar Media y sube la altura" |
| 4 | Identifica problemas con precisión | "Necesito más carga alar y menos altura" |
| 3 (Medio) | Identifica problemas generales | "Falta agarre y sufro en recta" |
| 2 | Sensaciones vagas | "El coche no me gusta en las curvas" |
| 1 (Novato) | Feedback muy básico o contradictorio | "No sé, algo no va bien" |

### 15.3. Layout de Carrera (Tríptico)

```
┌──────────────────────────────────────────────────────────────┐
│  Hora │  Clima actual │  Previsión cambio en X vtas         │
│        │  [Estado por sección en mapa pequeño]              │
├──────────────┬────────────────────────┬─────────────────────┤
│  TIMING      │     CIRCUITO           │  ÓRDENES            │
│  Vuelta N    │   [SVG con path del    │  ┌─ JUG-1 ───────┐ │
│  ─────────   │    trazado minimalista │  │ Ritmo [▼]      │ │
│  JUG-1  P3   │    + círculos de       │  │ Motor [▼]      │ │
│  +1.2s       │    coches por pieza]   │  │ ── BOXES ──   │ │
│  S24(6)      │                        │  │ Neumático [▼] │ │
│              │                        │  │ Gasolina [══] │ │
│  JUG-2  P5   │                        │  │ ☐ Solicitar   │ │
│  +3.8s       │                        │  └───────────────┘ │
│  H18(10)     │                        │  ┌─ JUG-2 ───────┐ │
│              │                        │  │ ...            │ │
│  ─────────   │                        │  └───────────────┘ │
│  V. Rápida   │                        ├─────────────────────┤
│  ROJ-1(P4)   │                        │  ESTADOS            │
│  1:23.456    │                        │  ┌─ JUG-1 ────────┐ │
│              │                        │  │ Coche: Mtr N3   │ │
│              │                        │  │        Chs N3   │ │
│              │                        │  │ [Diagrama       │ │
│              │                        │  │  vista superior]│ │
│              │                        │  │ 😰 Estrés 40%  │ │
│              │                        │  │ 😓 Fatiga 20%  │ │
│              │                        │  └────────────────┘ │
│              │                        │  ┌─ JUG-2 ────────┐ │
│              │                        │  │ ...            │ │
│              │                        │  └────────────────┘ │
└──────────────┴────────────────────────┴─────────────────────┘
```

**Panel de Órdenes (por piloto)**
- **Fieldset "Órdenes":** Dropdowns de Ritmo y Mapeo Motor.
- **Fieldset "Boxes":** Dropdown de neumático, range de gasolina (0–100 kg con marcas 22/30/100) y checkbox "Solicitar parada".

**Panel de Estados (por piloto)**
- Nivel de componentes del coche (Motor N3, Chasis N3).
- **Diagrama del coche en vista superior** con partes coloreadas según estado:
  - 4 neumáticos (nuevo → óptimo → desgaste → crítico)
  - Alerón delantero (izquierdo / derecho)
  - Alerón trasero (izquierdo / derecho)
  - Morro, Cuerpo principal, Motor
  - Colores: transparente (bien), amarillo (tocado), rojo (mal)
- **Barras de estado del piloto:**
  - Estrés (0–100 %, recuperable)
  - Fatiga (0–100 %, no recuperable en carrera)

**Representación del Circuito en Carrera**
- El panel central muestra el circuito como **SVG** con un path continuo que une los centros de cada pieza.
- Los **coches** se dibujan como **círculos** de 4 px de radio con el color del equipo, posicionados mediante `getCarPosition(pieceIndex, pieceMeters)`.
- Las curvas usan arcos SVG con interpolación angular para posicionar coches correctamente dentro de la curva.
- La calle de boxes se muestra con un path discontinuo superpuesto.
- El piloto del jugador se resalta con un círculo concéntrico adicional.
- La línea de meta se marca con una línea perpendicular en la recta_salida.

### 15.4. Pantalla de Resultados

- Puesto final de cada piloto.
- Estadísticas: vueltas completadas, compuesto usado.
- Botón "Volver al menú".

---

## 16. Progresión y Condiciones de Fin de Carrera

### 16.1. Condiciones de Fin de Carrera

| Resultado | Condición | Pantalla |
|-----------|-----------|----------|
| Victoria | Al menos un coche finaliza en 1ª posición | Pantalla de victoria |
| Derrota | Ambos coches abandonan (Doble DNF) | Pantalla de derrota |
| Intermedio | Cualquier otro resultado | Pantalla de resumen con puesto final |

### 16.2. Progresión

- Actualmente el juego se compone de **carreras individuales independientes**.
- **Futura feature:** Campaña con múltiples circuitos, tabla de posiciones global y mejoras progresivas del equipo entre carreras.

### 16.3. Audio (Futuro)

- Pendiente para versión futura.
- Música de fondo.
- Efectos de sonido para eventos especiales (golpes, accidentes, salidas de pista).
- Efectos climáticos (lluvia, tormentas).

---

## 17. Features Futuras (Roadmap)

- **Safety Car:** Activado por clima extremo o incidentes, agrupa el pelotón.
- **Sistema de daños por accidente:** Choques afectan alerones, morro, suspensiones con tiempos de reparación variables.
- **Penalizaciones:** Excesos de velocidad en pits, límites de pista, salidas falsas.
- **Estrategia predictiva:** Simulador "what if" para planificar paradas anticipadas.
- **Campaña/Temporada:** Múltiples carreras con puntuación global y evolución del equipo.
- **Sistema de radio:** Comunicaciones contextuales del ingeniero con alertas.
- **Reporte textual de carrera:** Comentarios estilo Hattrick narrando eventos relevantes ("Frentzen pushes hard into turn 3, gains 0.3s on Häkkinen").
- **Lesiones de piloto:** Posibilidad de lesiones en accidentes graves que afecten a disponibilidad.
- **Persistencia entre carreras:** Progresión de pilotos, evolución del vehículo y estadísticas históricas.
