// Correct pairs for the game. Edit this list.
// time uses minutes and seconds, like 1m23s or 12m05s.
// The same country can appear more than once.
// Set easy: true to include a pair in the easier quiz. List order is kept.

export type RoundPair = {
  time: string;
  country: string;
  easy: boolean;
};

export const pairs: RoundPair[] = [
  { time: "6m30s", country: "Panama", easy: false },
  { time: "6m45s", country: "Hungary", easy: true },
  { time: "5m16s", country: "USA", easy: true },
  { time: "27m29s", country: "Ecuador", easy: false },
  { time: "11m38s", country: "Hungary", easy: false },

  { time: "3m40s", country: "South Africa", easy: false },
  { time: "21m33s", country: "South Africa", easy: false },
  { time: "3m44s", country: "Netherlands", easy: false },
  { time: "17m8s", country: "Mongolia", easy: true },
  { time: "2m16s", country: "Russia", easy: true },

  { time: "11m10s", country: "Ireland", easy: false },
  { time: "9m28s", country: "Croatia", easy: false },
  { time: "15m46s", country: "India", easy: false },
  { time: "22m58s", country: "Mexico", easy: false },
  { time: "35m17s", country: "France", easy: true },

  { time: "4m47s", country: "Ireland", easy: false },
  { time: "18m56s", country: "Argentina", easy: false },
  { time: "11m4s", country: "Paraguay", easy: false },
];

export function easyPairs(source: readonly RoundPair[] = pairs): RoundPair[] {
  return source.filter((pair) => pair.easy);
}
