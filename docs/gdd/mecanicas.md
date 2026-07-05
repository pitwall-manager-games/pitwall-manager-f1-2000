# Mecánicas de Juego

## El Motor de Simulación (Game Loop)

- El bucle se gestiona en `app.js` mediante un temporizador asíncrono
- Cada monoplaza posee un porcentaje de progreso de vuelta (0 % a 100 %)
- Al llegar al 100 %, completa una vuelta, se suma al contador global y se recalculan los tiempos del *Live Timing*

## Variables de los Pilotos del Jugador

El usuario gestiona dos monoplazas independientes con las siguientes métricas:

### Ritmo

| Valor | Comportamiento |
|-------|----------------|
| Ataque | Intentar adelantar siempre que sea posible |
| Normal | Conducción de carrera estándar |
| Defender | Defender la posición frente a ataques rivales |
| Conservar | Bajar el ritmo para reducir el estrés del piloto |

### Mapeo Motor

(Gestionado en `motor-v10.md`)

### Degradación de Neumáticos

(Gestionado en `neumaticos.md`)

### Combustible

(Gestionado en `combustible.md`)

### Estrés

- Aumenta cuando el piloto está atacando o defendiendo
- Disminuye cuando el ritmo es bajo (Conservar)
- Afecta al rendimiento del piloto
- Se recupera durante la carrera

### Cansancio

- Aumenta en las mismas situaciones que el estrés
- No se recupera durante la carrera
- Afecta al rendimiento del piloto
- Afecta al delay en la recepción de órdenes (a mayor cansancio, mayor delay)

## Sistema de Comunicaciones

Las órdenes del jugador se ejecutan con un delay variable que depende del nivel
de cansancio del piloto, simulando la latencia de comunicación e interpretación
de instrucciones por radio.

Posible mejora futura: delay también influenciado por la habilidad del piloto,
tipo de orden y zona del circuito (curva vs recta).
