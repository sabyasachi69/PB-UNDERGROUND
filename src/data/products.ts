export type FeaturedProduct = {
  slug: string;
  name: string;
  maker: string;
  priceInPaise: number;
  category: string;
  palette: string;
  sizes: readonly string[];
};

export const featuredProducts: readonly FeaturedProduct[] = [
  {
    slug: "gate-seven-hoodie",
    name: "Gate Seven Hoodie",
    maker: "[SAMPLE] Singh Cloth House",
    priceInPaise: 129_900,
    category: "Layers",
    palette: "charcoal",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    slug: "lecture-hall-overshirt",
    name: "Lecture Hall Overshirt",
    maker: "[SAMPLE] Bhatia Studio",
    priceInPaise: 99_900,
    category: "Shirts",
    palette: "clay",
    sizes: ["S", "M", "L"],
  },
  {
    slug: "two-am-cargo",
    name: "2AM Cargo",
    maker: "[SAMPLE] Gupta Garments",
    priceInPaise: 149_900,
    category: "Bottoms",
    palette: "moss",
    sizes: ["28", "30", "32", "34"],
  },
  {
    slug: "everyday-heavy-tee",
    name: "Everyday Heavy Tee",
    maker: "[SAMPLE] North Loom",
    priceInPaise: 59_900,
    category: "Essentials",
    palette: "paper",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
] as const;
