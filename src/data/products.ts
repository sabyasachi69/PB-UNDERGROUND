export type ProductColour = {
  name: string;
  hex: string;
};

export type ProductVariant = {
  id: string;
  size: string;
  colour: ProductColour;
  priceInPaise: number;
  stockQty: number;
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  body: string;
  verified: boolean;
};

export type Product = {
  slug: string;
  name: string;
  supplierSlug: string;
  supplierName: string;
  category: string;
  categorySlug: string;
  description: string;
  fabric: string;
  care: string;
  priceInPaise: number;
  compareAtPaise?: number;
  gstBps: number;
  palette: string;
  sizes: readonly string[];
  colours: readonly ProductColour[];
  variants: readonly ProductVariant[];
  imageAlts: readonly string[];
  isFeatured: boolean;
  popularity: number;
  releasedAt: string;
  reviews: readonly ProductReview[];
};

export type ProductCategory = {
  slug: string;
  name: string;
  description: string;
  note: string;
};

type ColourStock = ProductColour & {
  stock: readonly number[];
  priceOffsetInPaise?: number;
};

function makeVariants(
  slug: string,
  sizes: readonly string[],
  colours: readonly ColourStock[],
  basePriceInPaise: number,
): ProductVariant[] {
  return colours.flatMap((colour) =>
    sizes.map((size, index) => ({
      id: `${slug}-${colour.name.toLowerCase().replaceAll(" ", "-")}-${size.toLowerCase().replaceAll(" ", "-")}`,
      size,
      colour: { name: colour.name, hex: colour.hex },
      priceInPaise: basePriceInPaise + (colour.priceOffsetInPaise ?? 0),
      stockQty: colour.stock[index] ?? 0,
    })),
  );
}

const verifiedReview = (slug: string, body: string): readonly ProductReview[] => [
  { id: `${slug}-review-1`, author: "Aarav K.", rating: 5, body, verified: true },
];

const SIZE_ALPHA = ["XS", "S", "M", "L", "XL"] as const;
const SIZE_NUMERIC = ["28", "30", "32", "34", "36"] as const;

export const categories: readonly ProductCategory[] = [
  {
    slug: "layers",
    name: "Layers",
    description: "Outer pieces for early classes, late walks and the rooms between.",
    note: "Built to move over everything else.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    description: "Relaxed structure, useful pockets and cloth that gets better with wear.",
    note: "For attendance and everything after it.",
  },
  {
    slug: "bottoms",
    name: "Bottoms",
    description: "Room to move, honest fabric and silhouettes made for long campus days.",
    note: "Sit, sprint, repeat.",
  },
  {
    slug: "essentials",
    name: "Essentials",
    description: "The dependable pieces that earn the front of the wardrobe.",
    note: "Fewer decisions. Better daily wear.",
  },
] as const;

const productSeeds = [
  {
    slug: "gate-seven-hoodie",
    name: "Gate Seven Hoodie",
    supplierSlug: "singh-cloth-house",
    supplierName: "[SAMPLE] Singh Cloth House",
    category: "Layers",
    categorySlug: "layers",
    description: "A dense loopback hoodie with a clean shoulder and a generous hood for colder walks past Gate Seven.",
    fabric: "420 GSM cotton-rich loopback fleece",
    care: "Cold wash inside out. Dry flat. Do not bleach.",
    priceInPaise: 129_900,
    compareAtPaise: 149_900,
    gstBps: 500,
    palette: "charcoal",
    sizes: SIZE_ALPHA,
    colourStocks: [
      { name: "Coal", hex: "#292a27", stock: [2, 4, 5, 2, 0] },
      { name: "Brick", hex: "#8f4634", stock: [0, 2, 3, 1, 0], priceOffsetInPaise: 5_000 },
    ],
    imageAlts: ["Sample front view of the Gate Seven Hoodie", "Sample detail view of the hoodie fabric and hood"],
    isFeatured: true,
    popularity: 96,
    releasedAt: "2026-10-18",
    reviews: verifiedReview("gate-seven-hoodie", "Heavy without feeling stiff. The hood sits properly and delivery reached my hostel the same evening."),
  },
  {
    slug: "lecture-hall-overshirt",
    name: "Lecture Hall Overshirt",
    supplierSlug: "bhatia-studio",
    supplierName: "[SAMPLE] Bhatia Studio",
    category: "Shirts",
    categorySlug: "shirts",
    description: "A straight-cut overshirt with two working pockets and enough room for a tee underneath.",
    fabric: "Mid-weight cotton twill",
    care: "Machine wash cold with similar colours. Warm iron.",
    priceInPaise: 99_900,
    gstBps: 500,
    palette: "clay",
    sizes: ["S", "M", "L", "XL"],
    colourStocks: [
      { name: "Clay", hex: "#a65f45", stock: [3, 5, 4, 2] },
      { name: "Ink", hex: "#283137", stock: [1, 3, 2, 0] },
    ],
    imageAlts: ["Sample front view of the Lecture Hall Overshirt", "Sample close-up of the overshirt pocket and buttons"],
    isFeatured: true,
    popularity: 91,
    releasedAt: "2026-10-12",
    reviews: verifiedReview("lecture-hall-overshirt", "The pockets are actually useful and the fit works as a shirt or a light layer."),
  },
  {
    slug: "two-am-cargo",
    name: "2AM Cargo",
    supplierSlug: "gupta-garments",
    supplierName: "[SAMPLE] Gupta Garments",
    category: "Bottoms",
    categorySlug: "bottoms",
    description: "Relaxed cargo trousers with a clean hem, deep pockets and an adjustable internal waist tab.",
    fabric: "Cotton ripstop with enzyme wash",
    care: "Cold wash. Line dry. Steam or cool iron.",
    priceInPaise: 149_900,
    gstBps: 500,
    palette: "moss",
    sizes: SIZE_NUMERIC,
    colourStocks: [
      { name: "Moss", hex: "#566451", stock: [2, 5, 5, 3, 1] },
      { name: "Black", hex: "#1c1d1b", stock: [0, 2, 4, 2, 0] },
    ],
    imageAlts: ["Sample front view of the 2AM Cargo trousers", "Sample detail view of a cargo pocket"],
    isFeatured: true,
    popularity: 98,
    releasedAt: "2026-10-15",
    reviews: verifiedReview("two-am-cargo", "The waist adjuster saved me from needing a belt. Good pocket depth too."),
  },
  {
    slug: "everyday-heavy-tee",
    name: "Everyday Heavy Tee",
    supplierSlug: "north-loom",
    supplierName: "[SAMPLE] North Loom",
    category: "Essentials",
    categorySlug: "essentials",
    description: "A compact cotton tee with a firm collar and a boxy cut that holds its shape through repeat wear.",
    fabric: "240 GSM combed cotton jersey",
    care: "Cold wash inside out. Do not tumble dry.",
    priceInPaise: 59_900,
    gstBps: 500,
    palette: "paper",
    sizes: SIZE_ALPHA,
    colourStocks: [
      { name: "Bone", hex: "#e6dfd1", stock: [3, 6, 8, 6, 2] },
      { name: "Night", hex: "#232421", stock: [2, 4, 5, 3, 1] },
    ],
    imageAlts: ["Sample front view of the Everyday Heavy Tee", "Sample close-up of the tee collar and jersey texture"],
    isFeatured: true,
    popularity: 89,
    releasedAt: "2026-10-09",
    reviews: verifiedReview("everyday-heavy-tee", "The collar has not gone loose after washing, which is exactly what I wanted."),
  },
  {
    slug: "studio-knit-polo",
    name: "Studio Knit Polo",
    supplierSlug: "bhatia-studio",
    supplierName: "[SAMPLE] Bhatia Studio",
    category: "Shirts",
    categorySlug: "shirts",
    description: "An open-collar knit polo with a soft hand and a shape that reads polished without feeling formal.",
    fabric: "Cotton-viscose fine gauge knit",
    care: "Hand wash cool. Reshape and dry flat.",
    priceInPaise: 119_900,
    compareAtPaise: 134_900,
    gstBps: 500,
    palette: "blue",
    sizes: ["S", "M", "L", "XL"],
    colourStocks: [
      { name: "Petrol", hex: "#31525b", stock: [2, 4, 3, 1] },
      { name: "Sand", hex: "#bda98a", stock: [1, 2, 2, 0] },
    ],
    imageAlts: ["Sample front view of the Studio Knit Polo", "Sample detail view of the polo collar knit"],
    isFeatured: false,
    popularity: 82,
    releasedAt: "2026-10-05",
    reviews: verifiedReview("studio-knit-polo", "Looks sharp for presentations but is still comfortable enough for a full day."),
  },
  {
    slug: "platform-chore-jacket",
    name: "Platform Chore Jacket",
    supplierSlug: "singh-cloth-house",
    supplierName: "[SAMPLE] Singh Cloth House",
    category: "Layers",
    categorySlug: "layers",
    description: "A three-pocket chore layer cut from sturdy twill, finished with low-profile metal buttons.",
    fabric: "Cotton canvas twill",
    care: "Machine wash cold. Line dry. Expect natural fading.",
    priceInPaise: 169_900,
    gstBps: 500,
    palette: "indigo",
    sizes: ["S", "M", "L", "XL"],
    colourStocks: [
      { name: "Indigo", hex: "#34424c", stock: [1, 3, 3, 1] },
      { name: "Tobacco", hex: "#8b5a3d", stock: [0, 2, 1, 0] },
    ],
    imageAlts: ["Sample front view of the Platform Chore Jacket", "Sample detail view of the chore jacket pocket"],
    isFeatured: false,
    popularity: 86,
    releasedAt: "2026-09-28",
    reviews: verifiedReview("platform-chore-jacket", "Solid cloth and neat stitching. It feels like something I will keep for years."),
  },
  {
    slug: "north-gate-denim",
    name: "North Gate Denim",
    supplierSlug: "gupta-garments",
    supplierName: "[SAMPLE] Gupta Garments",
    category: "Bottoms",
    categorySlug: "bottoms",
    description: "A straight five-pocket jean with a gentle taper and enough rise for long seated hours.",
    fabric: "12 oz non-stretch cotton denim",
    care: "Wash sparingly, cold and inside out. Line dry.",
    priceInPaise: 139_900,
    gstBps: 500,
    palette: "denim",
    sizes: SIZE_NUMERIC,
    colourStocks: [
      { name: "Rinse", hex: "#263d56", stock: [1, 4, 5, 4, 2] },
      { name: "Washed", hex: "#61768a", stock: [0, 2, 3, 2, 1] },
    ],
    imageAlts: ["Sample front view of the North Gate Denim jeans", "Sample close-up of the denim weave and pocket"],
    isFeatured: false,
    popularity: 93,
    releasedAt: "2026-09-22",
    reviews: verifiedReview("north-gate-denim", "The rise is comfortable in class and the leg is straight without being too wide."),
  },
  {
    slug: "corridor-rugby-shirt",
    name: "Corridor Rugby Shirt",
    supplierSlug: "north-loom",
    supplierName: "[SAMPLE] North Loom",
    category: "Shirts",
    categorySlug: "shirts",
    description: "A substantial striped jersey with a woven collar and an easy, slightly cropped proportion.",
    fabric: "300 GSM cotton rugby jersey",
    care: "Cold wash. Reshape while damp. Warm iron collar only.",
    priceInPaise: 109_900,
    gstBps: 500,
    palette: "wine",
    sizes: ["S", "M", "L", "XL"],
    colourStocks: [
      { name: "Wine", hex: "#6d3439", stock: [2, 3, 2, 1] },
      { name: "Forest", hex: "#33483a", stock: [1, 3, 3, 0] },
    ],
    imageAlts: ["Sample front view of the Corridor Rugby Shirt", "Sample close-up of the woven rugby collar"],
    isFeatured: false,
    popularity: 79,
    releasedAt: "2026-09-18",
    reviews: verifiedReview("corridor-rugby-shirt", "The fabric feels substantial and the shorter length works well with cargos."),
  },
  {
    slug: "library-quarter-zip",
    name: "Library Quarter Zip",
    supplierSlug: "singh-cloth-house",
    supplierName: "[SAMPLE] Singh Cloth House",
    category: "Layers",
    categorySlug: "layers",
    description: "A high-neck quarter zip with quiet hardware and a brushed interior for over-cooled rooms.",
    fabric: "360 GSM brushed cotton fleece",
    care: "Cold gentle wash. Zip before washing. Dry flat.",
    priceInPaise: 139_900,
    gstBps: 500,
    palette: "stone",
    sizes: SIZE_ALPHA,
    colourStocks: [
      { name: "Stone", hex: "#9b9589", stock: [0, 3, 5, 2, 1] },
      { name: "Coal", hex: "#292a27", stock: [0, 2, 4, 2, 0] },
    ],
    imageAlts: ["Sample front view of the Library Quarter Zip", "Sample detail view of the quarter zip collar"],
    isFeatured: false,
    popularity: 88,
    releasedAt: "2026-10-20",
    reviews: verifiedReview("library-quarter-zip", "Warm enough for the library AC and the zip does not scratch my neck."),
  },
  {
    slug: "common-room-jogger",
    name: "Common Room Jogger",
    supplierSlug: "gupta-garments",
    supplierName: "[SAMPLE] Gupta Garments",
    category: "Bottoms",
    categorySlug: "bottoms",
    description: "A clean jogger with a relaxed thigh, hidden zip pocket and a cuff that keeps its shape.",
    fabric: "330 GSM cotton-poly interlock",
    care: "Machine wash cold. Tumble dry low or line dry.",
    priceInPaise: 89_900,
    gstBps: 500,
    palette: "graphite",
    sizes: SIZE_ALPHA,
    colourStocks: [
      { name: "Graphite", hex: "#4a4b48", stock: [2, 5, 6, 4, 2] },
      { name: "Navy", hex: "#293343", stock: [1, 2, 4, 2, 0] },
    ],
    imageAlts: ["Sample front view of the Common Room Jogger", "Sample detail view of the hidden zip pocket"],
    isFeatured: false,
    popularity: 84,
    releasedAt: "2026-09-14",
    reviews: verifiedReview("common-room-jogger", "Comfortable but still clean enough to wear outside the hostel."),
  },
  {
    slug: "workshop-tote",
    name: "Workshop Tote",
    supplierSlug: "north-loom",
    supplierName: "[SAMPLE] North Loom",
    category: "Essentials",
    categorySlug: "essentials",
    description: "A reinforced carry-all sized for a laptop, notebook, bottle and the extra thing you pick up on the way.",
    fabric: "14 oz cotton canvas",
    care: "Spot clean. Hand wash only when needed. Air dry.",
    priceInPaise: 49_900,
    gstBps: 500,
    palette: "ochre",
    sizes: ["One size"],
    colourStocks: [
      { name: "Ochre", hex: "#b47a32", stock: [8] },
      { name: "Ink", hex: "#283137", stock: [6] },
    ],
    imageAlts: ["Sample front view of the Workshop Tote", "Sample detail view of the reinforced tote handle"],
    isFeatured: false,
    popularity: 76,
    releasedAt: "2026-09-08",
    reviews: verifiedReview("workshop-tote", "My 15-inch laptop fits with space left, and the handle stitching feels secure."),
  },
  {
    slug: "canteen-cap",
    name: "Canteen Cap",
    supplierSlug: "bhatia-studio",
    supplierName: "[SAMPLE] Bhatia Studio",
    category: "Essentials",
    categorySlug: "essentials",
    description: "A low-profile six-panel cap with a soft brim and an adjustable metal clasp.",
    fabric: "Washed cotton twill",
    care: "Spot clean. Do not machine wash.",
    priceInPaise: 39_900,
    gstBps: 500,
    palette: "signal",
    sizes: ["One size"],
    colourStocks: [
      { name: "Signal", hex: "#c8431e", stock: [0] },
      { name: "Black", hex: "#1c1d1b", stock: [0] },
    ],
    imageAlts: ["Sample front view of the Canteen Cap", "Sample detail view of the cap clasp"],
    isFeatured: false,
    popularity: 73,
    releasedAt: "2026-09-01",
    reviews: [],
  },
] as const;

export const products: readonly Product[] = productSeeds.map((product) => ({
  ...product,
  colours: product.colourStocks.map(({ name, hex }) => ({ name, hex })),
  variants: makeVariants(product.slug, product.sizes, product.colourStocks, product.priceInPaise),
}));

export const featuredProducts = products.filter((product) => product.isFeatured);
export const productSizes = [...new Set(products.flatMap((product) => product.sizes))];
export const productColours = [
  ...new Map(products.flatMap((product) => product.colours).map((colour) => [colour.name, colour])).values(),
];
export const productSuppliers = [
  ...new Map(products.map((product) => [product.supplierSlug, { slug: product.supplierSlug, name: product.supplierName }])).values(),
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function isProductInStock(product: Product) {
  return product.variants.some((variant) => variant.stockQty > 0);
}
