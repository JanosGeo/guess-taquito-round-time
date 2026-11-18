// Correct pairs for the game. Edit this list.
// time uses minutes and seconds, like 1m23s or 12m05s.
// The same country can appear more than once.

export type RoundPair = {
  time: string;
  country: string;
};

export const pairs: RoundPair[] = [
  { time: "6m30s", country: "Panama" },
  { time: "6m45s", country: "Hungary" },
  { time: "5m16s", country: "USA" },
  { time: "27m29s", country: "Ecuador" },
  { time: "11m38s", country: "Hungary" },

  { time: "3m40s", country: "South Africa" },
  { time: "21m33s", country: "South Africa" },
  { time: "3m44s", country: "Netherlands" },
  { time: "17m8s", country: "Mongolia" },
  { time: "2m16s", country: "Russia" },

  { time: "11m10s", country: "Ireland" },
  { time: "9m28s", country: "Croatia" },
  { time: "15m46s", country: "India" },
  { time: "22m58s", country: "Mexico" },
  { time: "35m17s", country: "France" },

  { time: "4m47s", country: "Ireland" },
  { time: "18m56s", country: "Argentina" },
];
