export interface SecurityContact {
  emergency: string;
  orgs: { name: string; url?: string }[];
}

/** Local emergency numbers and community security organisations, keyed by region slug. */
const DIRECTORY: Record<string, SecurityContact> = {
  "united-kingdom": { emergency: "999", orgs: [{ name: "CST — Community Security Trust", url: "https://cst.org.uk" }] },
  "united-states": { emergency: "911", orgs: [{ name: "SCN — Secure Community Network", url: "https://www.securecommunitynetwork.org" }] },
  france: { emergency: "17 / 112", orgs: [{ name: "SPCJ — Service de Protection de la Communauté Juive", url: "https://www.spcj.org" }] },
  australia: { emergency: "000", orgs: [{ name: "CSG — Community Security Group" }] },
  canada: { emergency: "911", orgs: [{ name: "CIJA — Centre for Israel and Jewish Affairs", url: "https://www.cija.ca" }] },
  germany: { emergency: "110 / 112", orgs: [{ name: "RIAS — Report antisemitism", url: "https://www.report-antisemitism.de" }] },
  netherlands: { emergency: "112", orgs: [{ name: "CIDI", url: "https://www.cidi.nl" }] },
  argentina: { emergency: "911", orgs: [{ name: "DAIA", url: "https://www.daia.org.ar" }] },
  "south-africa": { emergency: "10111", orgs: [{ name: "CSO — Community Security Organisation" }] },
  "new-zealand": { emergency: "111", orgs: [] },
  brazil: { emergency: "190", orgs: [] },
  mexico: { emergency: "911", orgs: [] },
};

const EU_112 = ["austria", "belgium", "denmark", "hungary", "ireland", "italy", "poland", "spain", "sweden", "switzerland"];

export function getSecurityContact(slug: string): SecurityContact | null {
  const key = slug.startsWith("us-") ? "united-states" : slug;
  if (DIRECTORY[key]) return DIRECTORY[key];
  if (EU_112.includes(key)) return { emergency: "112", orgs: [] };
  return null;
}
