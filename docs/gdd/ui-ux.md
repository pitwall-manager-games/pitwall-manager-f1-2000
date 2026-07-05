# Especificación de Interfaz de Usuario (UI/UX)

## Pantalla de Título

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

## Layout de Carrera (Tríptico)

```
┌──────────────────────────────────────────────────────────────┐
│  ⏱ Hora │  ☀️ Clima actual │  🌧 Previsión cambio en X vtas │
├──────────────┬────────────────────────┬─────────────────────┤
│  📋 TIMING   │     🏁 CIRCUITO        │  📡 ÓRDENES         │
│  Vuelta N    │   [Canvas 2D con       │  ┌─ PILOTO 1 ────┐ │
│  ─────────   │    20 monoplazas       │  │ Ritmo [▼]      │ │
│  PILOTO 1    │    animados]           │  │ Mapeo Motor [▼]│ │
│  P3  +1.2s   │                        │  │ ── BOXES ──   │ │
│  ⬛ S24(6)   │                        │  │ Neumático [▼] │ │
│              │                        │  │ Gasolina [══] │ │
│  PILOTO 2    │                        │  │ ☐ Solicitar   │ │
│  P5  +3.8s   │                        │  └───────────────┘ │
│  ⬜ H18(10)  │                        │  ┌─ PILOTO 2 ────┐ │
│              │                        │  │ ...            │ │
│  ─────────   │                        │  └───────────────┘ │
│  V. Rápida   │                        ├─────────────────────┤
│  ROJ(P4)     │                        │  🏎️ ESTADOS         │
│  1:23.456    │                        │  ┌─ PILOTO 1 ────┐ │
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

## Panel de Órdenes (por piloto)

- **Fieldset "Órdenes":** Dropdowns de Ritmo y Mapeo Motor
- **Fieldset "Boxes":** Dropdown de neumático, range de gasolina (0–100 kg
  con marcas 22/30/100) y checkbox "Solicitar parada"

## Panel de Estados (por piloto)

- **Diagrama del coche en vista superior** con partes coloreadas según estado:
  - 4 neumáticos (🟡 nuevo → 🟢 óptimo → 🟡 desgaste → 🔴 crítico)
  - Alerón delantero (izquierdo / derecho)
  - Alerón trasero (izquierdo / derecho)
  - Morro, Cuerpo principal, Motor
  - Colores: transparente (bien), amarillo (tocado), rojo (mal)
- **Barras de estado del piloto:**
  - 😰 Estrés (0–100 %, recuperable)
  - 😓 Cansancio (0–100 %, no recuperable en carrera)

## Pantalla de Resultados

- Puesto final de cada piloto
- Estadísticas: vueltas completadas, compuestos usados, paradas realizadas, ritmo medio
- Botón "Volver al menú"
