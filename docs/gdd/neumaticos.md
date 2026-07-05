# Neumáticos — Compuestos, Degradación y Pit Stop

## Compuestos Disponibles

| Compuesto | Duración estimada | Comportamiento |
|-----------|-------------------|----------------|
| 🟥 Blando | 15–20 vueltas | Muy rápido, pero sufre degradación térmica veloz. Ideal para tandas cortas. |
| 🟨 Medio | 25–35 vueltas | El neumático estándar y más polivalente. Combina versatilidad y ritmo constante. |
| ⬜ Duro | 35–45 vueltas | Alta durabilidad sacrificando velocidad punta en curvas rápidas. |
| 🟢 Intermedio | Toda carrera si la pista está húmeda. 5–8 si se seca. | Para pista húmeda. |
| 🔵 Lluvia | Toda carrera si llueve. 3–4 si se seca. | Diseñado para evacuar charcos profundos. |

## Degradación (Tyre Wear)

- Comienza en 100 %
- Al caer por debajo del 30 %, el monoplaza pierde adherencia
- Los tiempos por vuelta empeoran severamente por debajo del 30 %

## Ventana de Pit Stop

- El jugador activa "Solicitar parada" mediante checkbox en cualquier momento
- La orden se ejecuta tras un delay que depende del cansancio del piloto
- El coche entra al Pit Lane automáticamente al completar la vuelta si la parada está solicitada
- Menú de selección por piloto:
  - Dropdown de compuesto para el siguiente relevo
  - Range de gasolina (0–100 kg) con marcas 22/30/100
  - Checkbox "Solicitar parada"

## Tiempo de Parada

```
tiempo_total = max(cambio_neumáticos, repostaje) + 2s_fijos

cambio_neumáticos = aleatorio entre 2.5s y 3.5s
repostaje = combustible_a_cargar / 9 kg/s
```
