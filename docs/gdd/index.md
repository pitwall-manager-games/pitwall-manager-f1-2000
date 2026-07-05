# GDD — Pitwall Manager: F1 2000

## 1. Visión General

- **Título Definitivo:** Pitwall Manager: F1 2000
- **Género:** Estrategia / Gestión Deportiva en Tiempo Real
- **Rol del Jugador:** Director de Equipo (Team Principal / Jefe de Estrategia)
- **Plataforma:** Navegadores Web (Escritorio)
- **Tecnologías:** HTML5, CSS3, JavaScript Vanilla (ES6 Modules)
- **Ambientación:** Todos los aspectos del juego (vehículos, pilotos, circuitos,
  normativa) están basados en la temporada 2000 de Fórmula 1.

## 2. Pilares de Diseño

- **Presión en el Muro de Boxes:** Decisiones estratégicas basadas en telemetría
  en tiempo real.
- **Gestión de Recursos Críticos:** Controlar el ritmo para equilibrar la velocidad
  con la degradación de neumáticos.
- **Estética de Ingeniería:** Interfaz de alto contraste y modo oscuro que emula
  las pantallas de datos reales de la Fórmula 1.

## 3. Estructura del Proyecto

```
pitwall-manager-f1-2000/
├── docs/gdd/             # Documentación de diseño
│   ├── index.md          # Este documento
│   ├── motor-v10.md      # Mapeo motor y características del V10
│   ├── combustible.md    # Sistema de combustible, peso y consumo
│   ├── neumaticos.md     # Compuestos, degradación y pit stop
│   ├── mecanicas.md      # Game loop y variables del piloto
│   ├── ia.md             # Inteligencia artificial rival
│   ├── clima.md          # Clima dinámico
│   ├── ui-ux.md          # Interfaz de usuario y wireframes
│   └── progresion.md     # Condiciones de victoria y progresión
├── src/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js        # Inicializador y bucle principal
│       ├── track.js      # Canvas 2D del circuito
│       └── physics.js    # Fórmulas de simulación
├── AGENTS.md
└── package.json
```

## 4. Documentación Relacionada

- [Visión general de la saga](../../../docs/GDD_Saga.md) — contexto de la franquicia.
