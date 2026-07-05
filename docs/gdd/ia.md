# Inteligencia Artificial

## Rivales de la IA

- **10 pilotos** de IA (5 equipos de 2 pilotos) compiten autónomamente
- Cada equipo tiene un color distintivo: rojo, amarillo, verde, azul, naranja
- Sus pilotos se identifican como `{color}-1` y `{color}-2`

## Comportamiento

- La IA gestiona las mismas variables que el jugador:
  - Ritmo (ataque, normal, defender, conservar)
  - Mapeo motor (alto rendimiento, normal, ahorro)
  - Combustible y neumáticos
  - Paradas en boxes

### Personalidades

Existen varias personalidades de IA con comportamientos distintos:

- **Agresiva:** Tiende a usar ritmo de ataque y alto rendimiento, pero desgasta
  más neumáticos y combustible
- **Conservadora:** Prioriza la gestión de recursos sobre la velocidad pura
- **Equilibrada:** Alterna entre modos según el contexto de carrera

## Reglas Generales

- La IA responde al ritmo global de la carrera, no directamente a las acciones
  del jugador
- Cada piloto IA tiene su propia estrategia de paradas predefinida pero
  sensible al contexto (clima, safety car)
