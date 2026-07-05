# Combustible — Carga, Peso y Consumo

## Sistema de Combustible

- Rango: 0–100 kg
- Mayor carga de combustible = mayor peso = vueltas más lentas
- Menos combustible = coche más ligero = mejor tiempo por vuelta
- El consumo varía según el modo motor seleccionado (ver `motor-v10.md`)

## Referencias de Carga

| Carga | Paradas estimadas | Vueltas por tanda |
|-------|-------------------|-------------------|
| 100 kg | 0 paradas | ~60 vueltas |
| 30 kg | 2 paradas | ~20 vueltas cada una |
| 22 kg | 3 paradas | ~15 vueltas cada una |

Estas marcas aparecen en el range de gasolina del menú de configuración previo a la carrera.

## Estrategia de Repostaje

En la ventana de pit stop, el jugador especifica la carga de combustible para el
siguiente relevo. El tiempo de repostaje se calcula como:

```
repostaje = combustible_a_cargar / 9 kg/s
```

El tiempo total de parada es:

```
tiempo_total = max(cambio_neumáticos, repostaje) + 2s_fijos

cambio_neumáticos = aleatorio entre 2.5s y 3.5s
```

## Dinámica Peso-Velocidad

A medida que el combustible se consume, el coche se aligera y los tiempos por vuelta
mejoran progresivamente. El efecto es más notable en circuitos con muchas curvas
y zonas de frenada.
