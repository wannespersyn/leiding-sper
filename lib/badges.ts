export type LifetimeStats = {
  beers: number;
  cocktails: number;
  presentDays: number;
};

export type BadgeDef = {
  key: string;
  label: string;
  unlocked: boolean;
};

export function computeBadges(stats: LifetimeStats): BadgeDef[] {
  return [
    { key: "first_beer", label: "Eerste pintje", unlocked: stats.beers >= 1 },
    {
      key: "first_cocktail",
      label: "Eerste cocktail",
      unlocked: stats.cocktails >= 1,
    },
    { key: "century", label: "100 pintjes", unlocked: stats.beers >= 100 },
    {
      key: "ten_days",
      label: "10 dagen aanwezig",
      unlocked: stats.presentDays >= 10,
    },
    {
      key: "cocktail_lover",
      label: "Cocktailliefhebber",
      unlocked: stats.cocktails >= 10,
    },
  ];
}
