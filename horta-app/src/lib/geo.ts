// horta-app/src/lib/geo.ts
import powerCache from './data/power_cache.json';
import soilGrid from './data/soil_grid.json';

export interface ClimateSoil {
  lat: number;
  lon: number;
  tempC: number;
  rainMm: number;
  driestMonthMm: number;
  elevationM: number;
  soilPh: number;
  drainage: 'well_drained' | 'wet';
}

export interface ParaPreset {
  name: string;
  region: string;
  lat: number;
  lon: number;
}

// Key Pará locations (Horta da Terra + major agroforestry hubs)
export const PARA_PRESETS: ParaPreset[] = [
  { name: 'Santo Antônio do Tauá (HdT)', region: 'Northeast PA', lat: -1.15, lon: -48.13 },
  { name: 'Belém / Ananindeua', region: 'Metro', lat: -1.45, lon: -48.50 },
  { name: 'Castanhal', region: 'Northeast PA', lat: -1.29, lon: -47.92 },
  { name: 'Paragominas', region: 'Southeast PA', lat: -2.99, lon: -47.35 },
  { name: 'Breves (Marajó)', region: 'Floodplain / Várzea', lat: -1.68, lon: -50.48 },
  { name: 'Santarém', region: 'Lower Amazon', lat: -2.44, lon: -54.70 },
  { name: 'Altamira', region: 'Xingu', lat: -3.20, lon: -52.21 },
  { name: 'Tucuruí', region: 'Tocantins', lat: -3.77, lon: -49.67 },
  { name: 'Marabá', region: 'Southeast PA', lat: -5.37, lon: -49.12 },
  { name: 'Redenção', region: 'South PA', lat: -8.03, lon: -50.03 },
];

type PowerEntry = {
  temp_annual_mean: number;
  rain_annual: number;
  rain_driest_month: number;
  elevation: number;
};

const powerPoints = Object.entries(powerCache as Record<string, PowerEntry>).map(([key, val]) => {
  const [lat, lon] = key.split(',').map(Number);
  return { lat, lon, ...val };
});

const soilPoints = (soilGrid as { points: [number, number, number][] }).points;

export function lookupLocation(lat: number, lon: number): ClimateSoil {
  // 1. Nearest climate point from power_cache.json
  let bestClimate = powerPoints[0];
  let minCDist = Infinity;
  for (const p of powerPoints) {
    const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
    if (d < minCDist) {
      minCDist = d;
      bestClimate = p;
    }
  }

  // 2. Nearest soil pH point from soil_grid.json
  let bestPh = 5.2;
  let minSDist = Infinity;
  for (let i = 0; i < soilPoints.length; i++) {
    const [slat, slon, sph] = soilPoints[i];
    const d = (slat - lat) ** 2 + (slon - lon) ** 2;
    if (d < minSDist) {
      minSDist = d;
      bestPh = sph;
    }
  }

  // Low elevation + high rain suggests várzea / wet soil
  const drainage: 'well_drained' | 'wet' =
    bestClimate.elevation < 20 && bestClimate.rain_annual > 2200 ? 'wet' : 'well_drained';

  return {
    lat: Number(lat.toFixed(2)),
    lon: Number(lon.toFixed(2)),
    tempC: Number(bestClimate.temp_annual_mean.toFixed(1)),
    rainMm: Math.round(bestClimate.rain_annual),
    driestMonthMm: Math.round(bestClimate.rain_driest_month),
    elevationM: Math.round(bestClimate.elevation),
    soilPh: Number(bestPh.toFixed(1)),
    drainage,
  };
}