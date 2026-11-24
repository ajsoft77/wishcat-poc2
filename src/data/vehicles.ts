// 차종 마스터 예시 데이터 (제조사 > 모델 > 세부 트림). 시연용이며 실제 제원과 다를 수 있다.

export type Fuel = '가솔린' | '디젤' | '하이브리드' | 'LPG';

export type Trim = {
  id: string;
  name: string;
  fuel: Fuel;
  cc: number;
  engine: string; // 엔진형식
  from: number;
  to: number;
};
export type Model = { id: string; name: string; code: string; trims: Trim[] };
export type Maker = { id: string; name: string; models: Model[] };

export const THIS_YEAR = 2026;

type T = [key: string, name: string, fuel: Fuel, cc: number, engine: string, from: number, to: number];

function model(id: string, name: string, code: string, trims: T[]): Model {
  return {
    id,
    name,
    code,
    trims: trims.map(([key, tname, fuel, cc, engine, from, to]) => ({
      id: `${id}-${key}`,
      name: tname,
      fuel,
      cc,
      engine,
      from,
      to,
    })),
  };
}

export function seedMakers(): Maker[] {
  return [
    {
      id: 'hyundai',
      name: '현대',
      models: [
        model('avante', '아반떼', 'CN7', [
          ['16g', '1.6 가솔린', '가솔린', 1598, 'G4FM', 2020, 2026],
          ['16hev', '1.6 하이브리드', '하이브리드', 1580, 'G4LE', 2020, 2026],
          ['16lpi', '1.6 LPi', 'LPG', 1591, 'L4FA', 2020, 2026],
        ]),
        model('sonata', '쏘나타', 'DN8', [
          ['20g', '2.0 가솔린', '가솔린', 1999, 'G4NM', 2019, 2026],
          ['16t', '1.6 터보', '가솔린', 1598, 'G4FP', 2019, 2026],
          ['20hev', '2.0 하이브리드', '하이브리드', 1999, 'G4NR', 2019, 2026],
          ['20lpi', '2.0 LPi', 'LPG', 1999, 'L4NB', 2019, 2026],
        ]),
        model('grandeur', '그랜저', 'IG', [
          ['24g', '2.4 가솔린', '가솔린', 2359, 'G4KJ', 2016, 2019],
          ['25g', '2.5 가솔린', '가솔린', 2497, 'G4KN', 2019, 2022],
          ['33g', '3.3 가솔린', '가솔린', 3342, 'G6DM', 2017, 2022],
          ['24hev', '2.4 하이브리드', '하이브리드', 2359, 'G4KK', 2017, 2022],
        ]),
        model('santafe', '싼타페', 'TM', [
          ['22d', '2.2 디젤', '디젤', 2151, 'D4HE', 2018, 2023],
          ['25t', '2.5 터보 가솔린', '가솔린', 2497, 'G4KP', 2020, 2023],
          ['16hev', '1.6 터보 하이브리드', '하이브리드', 1598, 'G4FT', 2021, 2023],
        ]),
        model('tucson', '투싼', 'NX4', [
          ['16t', '1.6 터보 가솔린', '가솔린', 1598, 'G4FP', 2020, 2026],
          ['20d', '2.0 디젤', '디젤', 1998, 'D4HD', 2020, 2026],
          ['16hev', '1.6 터보 하이브리드', '하이브리드', 1598, 'G4FT', 2020, 2026],
        ]),
      ],
    },
    {
      id: 'kia',
      name: '기아',
      models: [
        model('k5', 'K5', 'DL3', [
          ['20g', '2.0 가솔린', '가솔린', 1999, 'G4NM', 2019, 2026],
          ['16t', '1.6 터보', '가솔린', 1598, 'G4FP', 2019, 2026],
          ['20hev', '2.0 하이브리드', '하이브리드', 1999, 'G4NR', 2019, 2026],
          ['20lpi', '2.0 LPi', 'LPG', 1999, 'L4NB', 2019, 2026],
        ]),
        model('sorento', '쏘렌토', 'MQ4', [
          ['22d', '2.2 디젤', '디젤', 2151, 'D4HE', 2020, 2026],
          ['25t', '2.5 터보 가솔린', '가솔린', 2497, 'G4KP', 2020, 2026],
          ['16hev', '1.6 터보 하이브리드', '하이브리드', 1598, 'G4FT', 2020, 2026],
        ]),
        model('sportage', '스포티지', 'NQ5', [
          ['16t', '1.6 터보 가솔린', '가솔린', 1598, 'G4FP', 2021, 2026],
          ['20d', '2.0 디젤', '디젤', 1998, 'D4HD', 2021, 2026],
          ['16hev', '1.6 터보 하이브리드', '하이브리드', 1598, 'G4FT', 2021, 2026],
        ]),
        model('morning', '모닝', 'JA', [['10g', '1.0 가솔린', '가솔린', 998, 'G3LD', 2017, 2026]]),
        model('carnival', '카니발', 'KA4', [
          ['22d', '2.2 디젤', '디젤', 2151, 'D4HE', 2020, 2026],
          ['35g', '3.5 가솔린', '가솔린', 3470, 'G6DU', 2020, 2026],
        ]),
      ],
    },
    {
      id: 'genesis',
      name: '제네시스',
      models: [
        model('g80', 'G80', 'RG3', [
          ['25t', '2.5 터보', '가솔린', 2497, 'G4KR', 2020, 2026],
          ['35t', '3.5 터보', '가솔린', 3470, 'G6DS', 2020, 2026],
          ['22d', '2.2 디젤', '디젤', 2151, 'D4HF', 2020, 2022],
        ]),
        model('gv70', 'GV70', 'JK1', [
          ['25t', '2.5 터보', '가솔린', 2497, 'G4KR', 2020, 2026],
          ['35t', '3.5 터보', '가솔린', 3470, 'G6DS', 2020, 2026],
          ['22d', '2.2 디젤', '디젤', 2151, 'D4HF', 2020, 2023],
        ]),
      ],
    },
    {
      id: 'chevrolet',
      name: '쉐보레',
      models: [
        model('spark', '스파크', 'M400', [['10g', '1.0 가솔린', '가솔린', 999, 'B10D1', 2015, 2022]]),
        model('malibu', '말리부', 'E2XX', [
          ['15t', '1.5 터보', '가솔린', 1490, 'LFV', 2016, 2018],
          ['135t', '1.35 터보', '가솔린', 1341, 'L3T', 2018, 2022],
          ['20t', '2.0 터보', '가솔린', 1998, 'LTG', 2016, 2022],
        ]),
        model('trailblazer', '트레일블레이저', '9BYC', [
          ['12t', '1.2 터보', '가솔린', 1199, 'LIH', 2020, 2026],
          ['135t', '1.35 터보', '가솔린', 1341, 'L3T', 2020, 2026],
        ]),
      ],
    },
    {
      id: 'renault',
      name: '르노코리아',
      models: [
        model('qm6', 'QM6', 'HZG', [
          ['20g', '2.0 가솔린', '가솔린', 1997, 'M5R', 2017, 2026],
          ['20lpe', '2.0 LPe', 'LPG', 1998, 'M4R', 2019, 2026],
        ]),
        model('sm6', 'SM6', 'LFD', [
          ['20g', '2.0 가솔린', '가솔린', 1997, 'M5R', 2016, 2020],
          ['13t', '1.3 터보', '가솔린', 1332, 'H5H', 2020, 2025],
        ]),
      ],
    },
    {
      id: 'kgm',
      name: 'KG모빌리티',
      models: [
        model('tivoli', '티볼리', 'X100', [
          ['15t', '1.5 터보 가솔린', '가솔린', 1497, 'e-XGDi150T', 2019, 2026],
          ['16d', '1.6 디젤', '디젤', 1597, 'e-XDi160', 2015, 2021],
        ]),
        model('torres', '토레스', 'J100', [['15t', '1.5 터보 가솔린', '가솔린', 1497, 'e-XGDi150T', 2022, 2026]]),
      ],
    },
  ];
}

// ───────── 조회 도우미 (순수 함수) ─────────

export type TrimRef = { maker: Maker; model: Model; trim: Trim };

export function findTrim(makers: Maker[], trimId: string): TrimRef | null {
  for (const maker of makers)
    for (const m of maker.models) {
      const trim = m.trims.find((t) => t.id === trimId);
      if (trim) return { maker, model: m, trim };
    }
  return null;
}

export function allTrims(makers: Maker[]): TrimRef[] {
  return makers.flatMap((maker) => maker.models.flatMap((m) => m.trims.map((trim) => ({ maker, model: m, trim }))));
}

export function modelYears(m: Model): number[] {
  if (m.trims.length === 0) return [];
  const from = Math.min(...m.trims.map((t) => t.from));
  const to = Math.max(...m.trims.map((t) => t.to));
  const out: number[] = [];
  for (let y = to; y >= from; y--) out.push(y);
  return out;
}

export function trimsOfYear(m: Model, year: number): Trim[] {
  return m.trims.filter((t) => t.from <= year && year <= t.to);
}

export function yearText(t: Trim): string {
  return t.to >= THIS_YEAR ? `${t.from}~현재` : `${t.from}~${t.to}`;
}
