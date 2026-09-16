import { Journey } from '@/lib/types';

/**
 * 足迹数据共享工具集
 * 收敛城市坐标后备表、IATA 代码表、大圆测距与航段编排逻辑，
 * 供地球舞台 (JourneyFlightApp) 与旅程志画卷 (JourneyArchiveSection) 共用，
 * 保证两幕视图始终基于同一份真实 journeys 数据演绎。
 */

export interface CityFootprint {
  id: number;
  city: string;
  country: string;
  lat: number;
  lon: number;
  title: string;
  description: string;
  cover?: string;
  slug: string;
  startDate?: string;
  createdAt?: string;
}

export interface FlightLeg {
  index: number;
  fromCity: CityFootprint;
  toCity: CityFootprint;
  fromIata: string;
  toIata: string;
  distanceKm: number;
  flightNumber: string;
}

export interface JourneyStats {
  citiesCount: number;
  countriesCount: number;
  totalKm: number;
  firstDeparture?: string;
}

// 常见城市 IATA 国际三字代码映射
const CITY_IATA_MAP: Record<string, string> = {
  北京: 'PEK',
  上海: 'SHA',
  广州: 'CAN',
  深圳: 'SZX',
  成都: 'CTU',
  重庆: 'CKG',
  杭州: 'HGH',
  西安: 'XIY',
  武汉: 'WUH',
  南京: 'NKG',
  厦门: 'XMN',
  青岛: 'TAO',
  香港: 'HKG',
  澳门: 'MFM',
  台北: 'TPE',
  东京: 'HND',
  京都: 'UKY',
  大阪: 'KIX',
  首尔: 'ICN',
  新加坡: 'SIN',
  曼谷: 'BKK',
  巴黎: 'CDG',
  伦敦: 'LHR',
  纽约: 'JFK',
  旧金山: 'SFO',
  洛杉矶: 'LAX',
  苏黎世: 'ZRH',
  迪拜: 'DXB',
};

export function getCityIataCode(cityName: string): string {
  if (!cityName) return 'HXD';
  for (const [k, v] of Object.entries(CITY_IATA_MAP)) {
    if (cityName.includes(k) || k.includes(cityName)) {
      return v;
    }
  }
  return cityName.slice(0, 3).toUpperCase();
}

// 常见城市经纬度后备字典
const CITY_COORDINATES_MAP: Record<string, [number, number]> = {
  北京: [39.9042, 116.4074],
  上海: [31.2304, 121.4737],
  广州: [23.1291, 113.2644],
  深圳: [22.5431, 114.0579],
  成都: [30.5728, 104.0668],
  重庆: [29.563, 106.5516],
  杭州: [30.2741, 120.1551],
  西安: [34.3416, 108.9398],
  武汉: [30.5928, 114.3056],
  南京: [32.0606, 118.7969],
  厦门: [24.4798, 118.0894],
  青岛: [36.0671, 120.3826],
  香港: [22.3193, 114.1694],
  澳门: [22.1987, 113.5439],
  台北: [25.033, 121.5654],
  东京: [35.6762, 139.6503],
  京都: [35.0116, 135.7681],
  大阪: [34.6937, 135.5023],
  首尔: [37.5665, 126.978],
  新加坡: [1.3521, 103.8198],
  曼谷: [13.7563, 100.5018],
  巴黎: [48.8566, 2.3522],
  伦敦: [51.5074, -0.1278],
  纽约: [40.7128, -74.006],
  旧金山: [37.7749, -122.4194],
  洛杉矶: [34.0522, -118.2437],
  苏黎世: [47.3769, 8.5417],
  迪拜: [25.2048, 55.2708],
};

function resolveCityCoords(cityName?: string, titleName?: string): { lat: number; lon: number } | null {
  const query = `${cityName || ''} ${titleName || ''}`;
  for (const [key, coords] of Object.entries(CITY_COORDINATES_MAP)) {
    if (query.includes(key)) {
      return { lat: coords[0], lon: coords[1] };
    }
  }
  return null;
}

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/** 判断是否国内目的地（依据国家字符串启发式推导） */
export function isDomesticCountry(country?: string): boolean {
  if (!country) return false;
  return (
    country.includes('中国') ||
    country.toLowerCase().includes('china') ||
    country.toLowerCase() === 'cn'
  );
}

/** 将真实 journeys 归一化为时序足迹点标（仅保留含有效坐标的记录） */
export function buildCityFootprints(journeys: Journey[]): CityFootprint[] {
  const list: CityFootprint[] = [];
  (journeys || []).forEach((j) => {
    let lat = j.latitude;
    let lon = j.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      const resolved = resolveCityCoords(j.city, j.title);
      if (resolved) {
        lat = resolved.lat;
        lon = resolved.lon;
      }
    }
    if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
      list.push({
        id: j.id,
        city: j.city || 'Voyage Point',
        country: j.country || 'Earth',
        lat,
        lon,
        title: j.title || `${j.city} Footprint`,
        description: j.description || '',
        cover: j.cover,
        slug: j.slug || String(j.id),
        startDate: j.startDate,
        createdAt: j.createdAt,
      });
    }
  });

  return list.sort((a, b) => {
    const tA = new Date(a.startDate || a.createdAt || '2020-01-01').getTime();
    const tB = new Date(b.startDate || b.createdAt || '2020-01-01').getTime();
    return tA - tB;
  });
}

/** 编排时序飞行航段与大圆累计里程 */
export function buildFlightLegs(cities: CityFootprint[]): { flightLegs: FlightLeg[]; totalKm: number } {
  if (cities.length < 2) {
    return { flightLegs: [], totalKm: 0 };
  }

  let cumKm = 0;
  const legs: FlightLeg[] = [];

  for (let i = 0; i < cities.length - 1; i++) {
    const from = cities[i];
    const to = cities[i + 1];
    const dist = calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon);
    cumKm += dist;

    legs.push({
      index: i,
      fromCity: from,
      toCity: to,
      fromIata: getCityIataCode(from.city),
      toIata: getCityIataCode(to.city),
      distanceKm: dist,
      flightNumber: `HX-${100 + i * 12}`,
    });
  }

  return { flightLegs: legs, totalKm: cumKm };
}

/** 汇总探索统计（城市数 / 国家数 / 累计里程 / 首航日期） */
export function computeJourneyStats(cities: CityFootprint[]): JourneyStats {
  const countries = new Set<string>();
  const cityNames = new Set<string>();
  let firstDeparture: string | undefined;

  cities.forEach((c) => {
    if (c.country) countries.add(c.country.trim());
    if (c.city) cityNames.add(c.city.trim());
    const d = c.startDate || c.createdAt;
    if (d && (!firstDeparture || d < firstDeparture)) {
      firstDeparture = d;
    }
  });

  const { totalKm } = buildFlightLegs(cities);

  return {
    citiesCount: cityNames.size,
    countriesCount: countries.size,
    totalKm,
    firstDeparture,
  };
}
