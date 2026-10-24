/**
 * Code-level city catalogue. Cities are layered on top of the database zones
 * (which stay unchanged): each city hangs under an existing country/area slug,
 * gets its own map bubble and briefing page, and headlines/alerts whose title
 * names it are routed to it (and still roll up to the country).
 */

export interface CityDef {
  slug: string;
  name: string;
  /** Slug of the existing parent zone (country or area). */
  parent: string;
  lat: number;
  lng: number;
  aliases: RegExp;
}

/** Existing database area zones and the country they belong to. */
export const AREA_PARENT: Record<string, string> = {
  england: "united-kingdom", scotland: "united-kingdom", wales: "united-kingdom", "northern-ireland": "united-kingdom",
  "us-northeast": "united-states", "us-midwest": "united-states", "us-south": "united-states", "us-west": "united-states",
};

const c = (slug: string, name: string, parent: string, lat: number, lng: number, aliases: RegExp): CityDef => ({ slug, name, parent, lat, lng, aliases });

export const CITIES: CityDef[] = [
  // United States (several already exist in the database; aliases still apply)
  c("new-york-city", "New York City", "united-states", 40.71, -74.01, /\b(new york city|nyc|manhattan|brooklyn|queens|bronx|staten island|crown heights|williamsburg|borough park|diamond district|midtown|times square|nypd|columbia university)\b/i),
  c("long-island", "Long Island", "united-states", 40.79, -73.13, /\b(long island|west hempstead|five towns|great neck|nassau county)\b/i),
  c("rockland-county", "Rockland County", "united-states", 41.11, -74.07, /\b(monsey|spring valley|rockland county|kiryas joel)\b/i),
  c("new-jersey", "New Jersey", "united-states", 40.89, -74.01, /\b(new jersey|teaneck|lakewood|newark|jersey city|princeton)\b/i),
  c("los-angeles", "Los Angeles", "united-states", 34.05, -118.24, /\b(los angeles|beverly hills|west hollywood|ucla|pico-robertson|lapd)\b/i),
  c("miami", "Miami", "united-states", 25.76, -80.19, /\b(miami|boca raton|fort lauderdale|palm beach|surfside)\b/i),
  c("chicago", "Chicago", "united-states", 41.88, -87.63, /\b(chicago|skokie|evanston)\b/i),
  c("boston", "Boston", "united-states", 42.36, -71.06, /\b(boston|brookline|harvard)\b/i),
  c("philadelphia", "Philadelphia", "united-states", 39.95, -75.17, /\b(philadelphia|philly)\b/i),
  c("washington-dc", "Washington DC", "united-states", 38.91, -77.04, /\b(washington,? d\.?c\.?|capitol hill|white house)\b/i),
  c("san-francisco", "San Francisco", "united-states", 37.77, -122.42, /\b(san francisco|bay area|berkeley|oakland|stanford)\b/i),
  c("seattle", "Seattle", "united-states", 47.61, -122.33, /\bseattle\b/i),
  c("atlanta", "Atlanta", "united-states", 33.75, -84.39, /\batlanta\b/i),
  c("houston", "Houston", "united-states", 29.76, -95.37, /\bhouston\b/i),
  c("detroit", "Detroit", "united-states", 42.33, -83.05, /\b(detroit|west bloomfield|dearborn|ann arbor)\b/i),
  c("dallas", "Dallas", "united-states", 32.78, -96.8, /\b(dallas|fort worth|colleyville)\b/i),
  c("austin", "Austin", "united-states", 30.27, -97.74, /\baustin\b/i),
  c("phoenix", "Phoenix", "united-states", 33.45, -112.07, /\b(phoenix|scottsdale|arizona)\b/i),
  c("denver", "Denver", "united-states", 39.74, -104.99, /\b(denver|boulder|colorado)\b/i),
  c("san-diego", "San Diego", "united-states", 32.72, -117.16, /\b(san diego|poway)\b/i),
  c("baltimore", "Baltimore", "united-states", 39.29, -76.61, /\bbaltimore\b/i),
  c("cleveland", "Cleveland", "united-states", 41.5, -81.69, /\b(cleveland|solon|beachwood)\b/i),
  c("pittsburgh", "Pittsburgh", "united-states", 40.44, -79.99, /\b(pittsburgh|squirrel hill)\b/i),
  c("minneapolis", "Minneapolis", "united-states", 44.98, -93.27, /\b(minneapolis|st\.? paul|minnesota)\b/i),
  c("st-louis", "St. Louis", "united-states", 38.63, -90.2, /\bst\.? louis\b/i),
  c("las-vegas", "Las Vegas", "united-states", 36.17, -115.14, /\blas vegas\b/i),
  c("portland", "Portland", "united-states", 45.52, -122.68, /\bportland\b/i),
  c("cincinnati", "Cincinnati", "united-states", 39.1, -84.51, /\bcincinnati\b/i),
  c("nashville", "Nashville", "united-states", 36.16, -86.78, /\bnashville\b/i),
  c("salt-lake-city", "Salt Lake City", "united-states", 40.76, -111.89, /\b(salt lake|utah)\b/i),
  // United Kingdom
  c("london", "London", "england", 51.51, -0.13, /\b(london|golders green|stamford hill|hackney|hendon|barnet|camden|westminster|met police|stoke newington)\b/i),
  c("manchester", "Manchester", "england", 53.48, -2.24, /\b(manchester|salford|prestwich|heaton park|crumpsall)\b/i),
  c("leeds", "Leeds", "england", 53.8, -1.55, /\bleeds\b/i),
  c("birmingham", "Birmingham", "england", 52.49, -1.89, /\bbirmingham\b(?!,? alabama)/i),
  c("liverpool", "Liverpool", "england", 53.41, -2.98, /\bliverpool\b/i),
  c("brighton", "Brighton", "england", 50.82, -0.14, /\bbrighton\b/i),
  c("gateshead", "Gateshead", "england", 54.95, -1.6, /\b(gateshead|newcastle)\b/i),
  c("glasgow", "Glasgow", "scotland", 55.86, -4.25, /\bglasgow\b/i),
  c("edinburgh", "Edinburgh", "scotland", 55.95, -3.19, /\bedinburgh\b/i),
  c("cardiff", "Cardiff", "wales", 51.48, -3.18, /\bcardiff\b/i),
  c("belfast", "Belfast", "northern-ireland", 54.6, -5.93, /\bbelfast\b/i),
  // Europe
  c("paris", "Paris", "france", 48.86, 2.35, /\b(paris|sarcelles|cr[ée]teil|le marais|seine-saint-denis|neuilly)\b/i),
  c("marseille", "Marseille", "france", 43.3, 5.37, /\bmarseilles?\b/i),
  c("lyon", "Lyon", "france", 45.76, 4.84, /\blyons?\b/i),
  c("strasbourg", "Strasbourg", "france", 48.57, 7.75, /\bstrasbourg\b/i),
  c("toulouse", "Toulouse", "france", 43.6, 1.44, /\btoulouse\b/i),
  c("berlin", "Berlin", "germany", 52.52, 13.4, /\bberlin\b/i),
  c("munich", "Munich", "germany", 48.14, 11.58, /\b(munich|m[üu]nchen)\b/i),
  c("frankfurt", "Frankfurt", "germany", 50.11, 8.68, /\bfrankfurt\b/i),
  c("hamburg", "Hamburg", "germany", 53.55, 9.99, /\bhamburg\b/i),
  c("cologne", "Cologne", "germany", 50.94, 6.96, /\b(cologne|k[öo]ln)\b/i),
  c("dusseldorf", "Düsseldorf", "germany", 51.23, 6.77, /\bd[üu]sseldorf\b/i),
  c("halle", "Halle", "germany", 51.48, 11.97, /\bhalle\b/i),
  c("amsterdam", "Amsterdam", "netherlands", 52.37, 4.9, /\bamsterdam\b/i),
  c("rotterdam", "Rotterdam", "netherlands", 51.92, 4.48, /\brotterdam\b/i),
  c("the-hague", "The Hague", "netherlands", 52.08, 4.3, /\b(the hague|den haag)\b/i),
  c("brussels", "Brussels", "belgium", 50.85, 4.35, /\bbrussels\b/i),
  c("antwerp", "Antwerp", "belgium", 51.22, 4.4, /\bantwerp\b/i),
  c("vienna", "Vienna", "austria", 48.21, 16.37, /\b(vienna|wien)\b/i),
  c("zurich", "Zurich", "switzerland", 47.38, 8.54, /\bz[üu]rich\b/i),
  c("geneva", "Geneva", "switzerland", 46.2, 6.14, /\bgeneva\b/i),
  c("basel", "Basel", "switzerland", 47.56, 7.59, /\bbasel\b/i),
  c("rome", "Rome", "italy", 41.9, 12.5, /\brome\b/i),
  c("milan", "Milan", "italy", 45.46, 9.19, /\bmilan\b/i),
  c("madrid", "Madrid", "spain", 40.42, -3.7, /\bmadrid\b/i),
  c("barcelona", "Barcelona", "spain", 41.39, 2.17, /\bbarcelona\b/i),
  c("stockholm", "Stockholm", "sweden", 59.33, 18.07, /\bstockholm\b/i),
  c("malmo", "Malmö", "sweden", 55.6, 13.0, /\bmalm[öo]\b/i),
  c("gothenburg", "Gothenburg", "sweden", 57.71, 11.97, /\b(gothenburg|g[öo]teborg)\b/i),
  c("copenhagen", "Copenhagen", "denmark", 55.68, 12.57, /\bcopenhagen\b/i),
  c("oslo", "Oslo", "norway", 59.91, 10.75, /\boslo\b/i),
  c("helsinki", "Helsinki", "finland", 60.17, 24.94, /\bhelsinki\b/i),
  c("warsaw", "Warsaw", "poland", 52.23, 21.01, /\bwarsaw\b/i),
  c("krakow", "Kraków", "poland", 50.06, 19.94, /\bkrak[óo]w\b/i),
  c("budapest", "Budapest", "hungary", 47.5, 19.04, /\bbudapest\b/i),
  c("prague", "Prague", "czechia", 50.08, 14.44, /\bprague\b/i),
  c("bucharest", "Bucharest", "romania", 44.43, 26.1, /\bbucharest\b/i),
  c("athens", "Athens", "greece", 37.98, 23.73, /\bathens\b(?!,? (georgia|ohio))/i),
  c("thessaloniki", "Thessaloniki", "greece", 40.64, 22.94, /\bthessaloniki\b/i),
  c("dublin", "Dublin", "ireland", 53.35, -6.26, /\bdublin\b/i),
  c("lisbon", "Lisbon", "portugal", 38.72, -9.14, /\blisbon\b/i),
  c("istanbul", "Istanbul", "turkey", 41.01, 28.98, /\bistanbul\b/i),
  c("larnaca", "Larnaca", "cyprus", 34.92, 33.63, /\b(larnaca|limassol|nicosia)\b/i),
  c("tbilisi", "Tbilisi", "georgia", 41.72, 44.79, /\b(tbilisi|batumi)\b/i),
  // Americas
  c("toronto", "Toronto", "canada", 43.65, -79.38, /\b(toronto|thornhill|vaughan|north york|belleville)\b/i),
  c("montreal", "Montreal", "canada", 45.5, -73.57, /\bmontr[ée]al\b/i),
  c("vancouver", "Vancouver", "canada", 49.28, -123.12, /\bvancouver\b/i),
  c("ottawa", "Ottawa", "canada", 45.42, -75.7, /\bottawa\b/i),
  c("winnipeg", "Winnipeg", "canada", 49.9, -97.14, /\bwinnipeg\b/i),
  c("calgary", "Calgary", "canada", 51.05, -114.07, /\bcalgary\b/i),
  c("buenos-aires", "Buenos Aires", "argentina", -34.6, -58.38, /\bbuenos aires\b/i),
  c("sao-paulo", "São Paulo", "brazil", -23.55, -46.63, /\bs[ãa]o paulo\b/i),
  c("rio-de-janeiro", "Rio de Janeiro", "brazil", -22.91, -43.17, /\brio de janeiro\b/i),
  c("mexico-city", "Mexico City", "mexico", 19.43, -99.13, /\bmexico city\b/i),
  c("montevideo", "Montevideo", "uruguay", -34.9, -56.16, /\bmontevideo\b/i),
  c("santiago", "Santiago", "chile", -33.45, -70.67, /\bsantiago\b/i),
  c("bogota", "Bogotá", "colombia", 4.71, -74.07, /\bbogot[áa]\b/i),
  c("panama-city", "Panama City", "panama", 8.98, -79.52, /\bpanama city\b/i),
  // Africa, Asia, Oceania
  c("johannesburg", "Johannesburg", "south-africa", -26.2, 28.05, /\b(johannesburg|joburg)\b/i),
  c("cape-town", "Cape Town", "south-africa", -33.92, 18.42, /\bcape town\b/i),
  c("sydney", "Sydney", "australia", -33.87, 151.21, /\b(sydney|bondi|dover heights|rose bay|vaucluse|double bay)\b/i),
  c("melbourne", "Melbourne", "australia", -37.81, 144.96, /\b(melbourne|caulfield|st kilda|ripponlea|elsternwick|east st kilda|balaclava)\b/i),
  c("brisbane", "Brisbane", "australia", -27.47, 153.03, /\bbrisbane\b/i),
  c("perth", "Perth", "australia", -31.95, 115.86, /\bperth\b/i),
  c("adelaide", "Adelaide", "australia", -34.93, 138.6, /\badelaide\b/i),
  c("canberra", "Canberra", "australia", -35.28, 149.13, /\b(canberra|act policing|australian capital territory)\b/i),
  c("gold-coast", "Gold Coast", "australia", -28.02, 153.4, /\b(gold coast|surfers paradise)\b/i),
  c("hobart", "Hobart", "australia", -42.88, 147.33, /\bhobart\b/i),
  c("auckland", "Auckland", "new-zealand", -36.85, 174.76, /\bauckland\b/i),
  c("wellington", "Wellington", "new-zealand", -41.29, 174.78, /\bwellington\b/i),
  c("mumbai", "Mumbai", "india", 19.08, 72.88, /\bmumbai\b/i),
  c("kochi", "Kochi", "india", 9.93, 76.27, /\b(kochi|cochin)\b/i),
  c("bangkok", "Bangkok", "thailand", 13.76, 100.5, /\bbangkok\b/i),
  c("koh-phangan", "Koh Phangan", "thailand", 9.73, 100.01, /\b(koh phangan|ko pha ngan|koh samui)\b/i),
  c("marrakech", "Marrakech", "morocco", 31.63, -7.99, /\b(marrakesh|marrakech)\b/i),
  c("casablanca", "Casablanca", "morocco", 33.57, -7.59, /\bcasablanca\b/i),
  c("dubai", "Dubai", "united-arab-emirates", 25.2, 55.27, /\bdubai\b/i),
  c("abu-dhabi", "Abu Dhabi", "united-arab-emirates", 24.45, 54.38, /\babu dhabi\b/i),
  c("tokyo", "Tokyo", "japan", 35.68, 139.69, /\btokyo\b/i),
  c("cairo", "Cairo", "egypt", 30.04, 31.24, /\b(cairo|alexandria)\b/i),
];

export const CITY_BY_SLUG = new Map(CITIES.map((x) => [x.slug, x]));

/** Slugs a city sits under: its parent and the parent's country. */
function chainOf(city: CityDef): string[] {
  const out = [city.parent];
  const up = AREA_PARENT[city.parent];
  if (up) out.push(up);
  return out;
}

/** Most specific city named in the title whose family includes `slug` (or any city when slug is unknown/global). */
export function cityFor(slug: string | null, title: string): CityDef | null {
  const open = !slug || slug === "global";
  const family = slug ? new Set([slug, AREA_PARENT[slug]].filter(Boolean)) : new Set<string>();
  for (const city of CITIES) {
    if (!city.aliases.test(title)) continue;
    if (open) return city;
    const chain = chainOf(city);
    // Same country (headline tagged with the country, an area or a sibling area).
    if (chain.some((s) => family.has(s)) || family.has(AREA_PARENT[city.parent] ?? city.parent)) return city;
  }
  return null;
}

/** Add catalogue cities that are not database zones yet, attached to their parent zone. */
export function withCities<T extends { id: string; slug: string; name: string; parentId: string | null }>(
  zones: T[],
): (T | { id: string; slug: string; name: string; parentId: string; virtual: true; lat: number; lng: number })[] {
  const bySlug = new Map(zones.map((z) => [z.slug, z]));
  const out: (T | { id: string; slug: string; name: string; parentId: string; virtual: true; lat: number; lng: number })[] = [...zones];
  for (const city of CITIES) {
    if (bySlug.has(city.slug)) continue;
    const parent = bySlug.get(city.parent);
    if (!parent) continue;
    out.push({ id: `city:${city.slug}`, slug: city.slug, name: city.name, parentId: parent.id, virtual: true, lat: city.lat, lng: city.lng });
  }
  return out;
}

export const isVirtualZoneId = (id: string) => id.startsWith("city:");
