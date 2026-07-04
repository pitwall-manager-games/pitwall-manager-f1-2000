export const TYRE_CONFIG = {
  soft: { label: 'Blando', color: '#ff3344', durability: { min: 15, max: 20 }, speed: 1.05 },
  medium: { label: 'Medio', color: '#ffcc00', durability: { min: 25, max: 35 }, speed: 1.00 },
  hard: { label: 'Duro', color: '#ffffff', durability: { min: 35, max: 45 }, speed: 0.96 },
  inter: { label: 'Intermedio', color: '#33ff77', durability: { min: 5, max: 8 }, speed: 0.92 },
  wet: { label: 'Lluvia', color: '#4488ff', durability: { min: 3, max: 4 }, speed: 0.88 },
};

export const FUEL_CAPACITY = 100;

export const FUEL_REFERENCES = [
  { kg: 100, label: '0 paradas (60 vtas)' },
  { kg: 30, label: '2 paradas (20 vtas c/u)' },
  { kg: 22, label: '3 paradas (15 vtas c/u)' },
];

export const FUEL_BURN_RATE = {
  high: 3.5,
  normal: 2.5,
  low: 1.5,
};

export const PIT_STOP = {
  tyreChangeMin: 2.5,
  tyreChangeMax: 3.5,
  fuelRate: 9,
  fixedDelay: 2,
};

export function calcPitStopTime(fuelKg) {
  const tyreTime = PIT_STOP.tyreChangeMin + Math.random() * (PIT_STOP.tyreChangeMax - PIT_STOP.tyreChangeMin);
  const fuelTime = fuelKg / PIT_STOP.fuelRate;
  return Math.max(tyreTime, fuelTime) + PIT_STOP.fixedDelay;
}

export function calcTyreWear(pace, lapsOnTyre, isWet) {
  const baseWear = {
    attack: 12,
    normal: 8,
    defend: 10,
    conserve: 5,
  };

  let wear = baseWear[pace] || 8;
  if (isWet) wear *= 1.3;
  return wear * lapsOnTyre;
}

export function calcFuelConsumption(engineMode, laps) {
  return (FUEL_BURN_RATE[engineMode] || 2.5) * laps;
}
