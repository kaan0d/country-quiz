import { countries, type Continent } from "./countries";

// ISO numeric → alpha-3
export const numericToAlpha3: Record<string, string> = {
  "004": "AFG", "008": "ALB", "012": "DZA", "020": "AND", "024": "AGO",
  "028": "ATG", "032": "ARG", "051": "ARM", "036": "AUS", "040": "AUT",
  "031": "AZE", "044": "BHS", "048": "BHR", "050": "BGD", "052": "BRB",
  "112": "BLR", "056": "BEL", "084": "BLZ", "204": "BEN", "064": "BTN",
  "068": "BOL", "070": "BIH", "072": "BWA", "076": "BRA", "096": "BRN",
  "100": "BGR", "854": "BFA", "108": "BDI", "116": "KHM", "120": "CMR",
  "124": "CAN", "132": "CPV", "140": "CAF", "148": "TCD", "152": "CHL",
  "156": "CHN", "170": "COL", "174": "COM", "178": "COG", "180": "COD",
  "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE",
  "208": "DNK", "262": "DJI", "212": "DMA", "214": "DOM", "218": "ECU",
  "818": "EGY", "222": "SLV", "226": "GNQ", "232": "ERI", "233": "EST",
  "748": "SWZ", "231": "ETH", "242": "FJI", "246": "FIN", "250": "FRA",
  "266": "GAB", "270": "GMB", "268": "GEO", "276": "DEU", "288": "GHA",
  "300": "GRC", "308": "GRD", "320": "GTM", "324": "GIN", "624": "GNB",
  "328": "GUY", "332": "HTI", "340": "HND", "348": "HUN", "352": "ISL",
  "356": "IND", "360": "IDN", "364": "IRN", "368": "IRQ", "372": "IRL",
  "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN",
  "400": "JOR", "398": "KAZ", "404": "KEN", "296": "KIR", "408": "PRK",
  "410": "KOR", "414": "KWT", "417": "KGZ", "418": "LAO", "428": "LVA",
  "422": "LBN", "426": "LSO", "430": "LBR", "434": "LBY", "438": "LIE",
  "440": "LTU", "442": "LUX", "807": "MKD", "450": "MDG", "454": "MWI",
  "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT", "584": "MHL",
  "478": "MRT", "480": "MUS", "484": "MEX", "583": "FSM", "498": "MDA",
  "492": "MCO", "496": "MNG", "499": "MNE", "504": "MAR", "508": "MOZ",
  "104": "MMR", "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD",
  "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "578": "NOR",
  "512": "OMN", "586": "PAK", "585": "PLW", "275": "PSE", "591": "PAN",
  "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "616": "POL",
  "620": "PRT", "634": "QAT", "642": "ROU", "643": "RUS", "646": "RWA",
  "659": "KNA", "662": "LCA", "670": "VCT", "882": "WSM", "674": "SMR",
  "678": "STP", "682": "SAU", "686": "SEN", "688": "SRB", "690": "SYC",
  "694": "SLE", "702": "SGP", "703": "SVK", "705": "SVN", "090": "SLB",
  "706": "SOM", "710": "ZAF", "728": "SSD", "724": "ESP", "144": "LKA",
  "729": "SDN", "740": "SUR", "752": "SWE", "756": "CHE", "760": "SYR",
  "158": "TWN", "762": "TJK", "834": "TZA", "764": "THA", "626": "TLS",
  "768": "TGO", "776": "TON", "780": "TTO", "788": "TUN", "792": "TUR",
  "795": "TKM", "800": "UGA", "804": "UKR", "784": "ARE",
  "826": "GBR", "840": "USA", "858": "URY", "860": "UZB", "548": "VUT",
  "336": "VAT", "862": "VEN", "704": "VNM", "887": "YEM", "894": "ZMB",
  "716": "ZWE", "732": "ESH", "304": "GRL", "630": "PRI",
  "238": "FLK", "010": "ATA", "540": "NCL",
};

export const continentBounds: Record<Continent, [number, number, number, number]> = {
  "Avrupa": [-25, 35, 45, 72],
  "Asya": [25, -10, 145, 75],
  "Afrika": [-20, -35, 55, 38],
  "Kuzey Amerika": [-170, 5, -50, 85],
  "Güney Amerika": [-82, -56, -34, 13],
  "Okyanusya": [110, -50, 180, -10],
  "Antarktika": [-180, -90, 180, -60],
};

export function buildHintCircle(
  continent: Continent,
  countryCenter: [number, number]
): { center: [number, number]; radius: number } {
  const [minLng, minLat, maxLng, maxLat] = continentBounds[continent];
  const bboxW = maxLng - minLng;
  const bboxH = maxLat - minLat;
  // Base radius from continent size
  const baseRadius = Math.max(bboxW, bboxH) * 0.45;

  // Random offset for circle center (so country isn't always in the middle)
  const maxOffset = baseRadius * 0.3;
  const offsetLng = (Math.random() - 0.5) * 2 * maxOffset;
  const offsetLat = (Math.random() - 0.5) * 2 * maxOffset;

  // Circle center with offset
  const centerLng = Math.max(-170, Math.min(170, countryCenter[0] + offsetLng));
  const centerLat = Math.max(-85, Math.min(85, countryCenter[1] + offsetLat));

  // Calculate actual distance from country to circle center
  const distLng = countryCenter[0] - centerLng;
  const distLat = countryCenter[1] - centerLat;
  const distFromCenter = Math.sqrt(distLng * distLng + distLat * distLat);

  // Ensure radius is always bigger than distance to country (with padding)
  const radius = Math.max(baseRadius, distFromCenter + 15);

  return { center: [centerLng, centerLat], radius };
}

export const countryCenters: Partial<Record<string, [number, number]>> = {
  AFG: [67, 33], ALB: [20, 41], DZA: [3, 28], AND: [1.6, 42.5], AGO: [18, -11],
  ARG: [-64, -34], ARM: [45, 40], AUS: [134, -25], AUT: [15, 47], AZE: [47, 40],
  BHS: [-77, 25], BHR: [50.5, 26], BGD: [90, 24], BRB: [-59.5, 13], BLR: [28, 53],
  BEL: [4.5, 50.5], BLZ: [-88.5, 17], BEN: [2.3, 9.3], BTN: [90.5, 27.5], BOL: [-64, -17],
  BIH: [17.5, 44], BWA: [24, -22], BRA: [-51, -10], BRN: [114.7, 4.5], BGR: [25, 43],
  BFA: [-2, 13], BDI: [29.9, -3.4], KHM: [105, 12], CMR: [12.3, 5.7], CAN: [-96, 56],
  CPV: [-24, 16], CAF: [20.5, 6.6], TCD: [18.7, 15.5], CHL: [-70, -30], CHN: [104, 35],
  COL: [-74, 4], COM: [44, -12], COG: [15.2, -0.2], COD: [23.7, -2.9], CRI: [-84, 10],
  HRV: [16.5, 45.2], CUB: [-79.5, 22], CYP: [33, 35], CZE: [15.5, 50], DNK: [10, 56],
  DJI: [43, 11.5], DMA: [-61.4, 15.4], DOM: [-70.2, 19], ECU: [-78, -2], EGY: [30, 27],
  SLV: [-88.8, 13.8], GNQ: [10, 1.6], ERI: [38, 15], EST: [25, 59], SWZ: [31.5, -26.5],
  ETH: [40, 8], FJI: [178, -18], FIN: [25, 64], FRA: [2.2, 46.2], GAB: [11.7, -0.8],
  GMB: [-15.3, 13.5], GEO: [43.5, 42], DEU: [10, 51], GHA: [-1.1, 8], GRC: [22, 39],
  GRD: [-61.7, 12.1], GTM: [-90.4, 15.8], GIN: [-11.8, 11], GNB: [-15, 12], GUY: [-59, 5],
  HTI: [-73, 19], HND: [-87, 15], HUN: [19, 47], ISL: [-19, 65], IND: [79, 20],
  IDN: [118, -2], IRN: [53, 32], IRQ: [44, 33], IRL: [-8, 53], ISR: [35, 31.5],
  ITA: [12, 42], CIV: [-5.6, 7.5], JAM: [-77.3, 18], JPN: [138, 36], JOR: [37.1, 31],
  KAZ: [67, 48], KEN: [37, 1], KIR: [173, 1.5], PRK: [127, 40], KOR: [128, 36],
  XKX: [21, 42.6], KWT: [47.5, 29.3], KGZ: [75, 41.2], LAO: [103, 18], LVA: [25, 57],
  LBN: [35.8, 33.9], LSO: [28.3, -29.5], LBR: [-9.4, 6.4], LBY: [17, 27], LIE: [9.5, 47.1],
  LTU: [24, 55.9], LUX: [6.1, 49.8], MKD: [21.7, 41.6], MDG: [47, -20], MWI: [34, -13.5],
  MYS: [112, 2.5], MDV: [73.5, 3.2], MLI: [-2.5, 17], MLT: [14.4, 35.9], MHL: [168, 7],
  MRT: [-11.8, 20.2], MUS: [57.5, -20.2], MEX: [-102, 24], FSM: [158, 6.9], MDA: [28.5, 47],
  MCO: [7.4, 43.7], MNG: [105, 46], MNE: [19.4, 42.7], MAR: [-5.8, 32], MOZ: [35, -18],
  MMR: [96, 17], NAM: [18.5, -22], NRU: [166.9, -0.5], NPL: [84, 28], NLD: [5.3, 52.3],
  NZL: [172, -41], NIC: [-85, 13], NER: [8.1, 17.6], NGA: [8.7, 9.1], NOR: [10, 64],
  OMN: [57.5, 21], PAK: [70, 30], PLW: [134.6, 7.5], PSE: [35.2, 31.9], PAN: [-80, 9],
  PNG: [145, -6], PRY: [-58, -23], PER: [-76, -10], PHL: [122, 12.9], POL: [20, 52],
  PRT: [-8, 39.5], QAT: [51.2, 25.4], ROU: [25, 46], RUS: [100, 60], RWA: [29.9, -1.9],
  KNA: [-62.7, 17.3], LCA: [-61, 13.9], VCT: [-61.2, 13.2], WSM: [-172, -13.8], SMR: [12.5, 43.9],
  STP: [6.6, 0.2], SAU: [45, 24], SEN: [-14.5, 14.5], SRB: [21, 44], SYC: [55.5, -4.6],
  SLE: [-11.8, 8.6], SGP: [103.8, 1.3], SVK: [19.5, 48.7], SVN: [15, 46.1], SLB: [160, -9],
  SOM: [46, 6], ZAF: [25, -29], SSD: [31, 7], ESP: [-3.5, 40], LKA: [81, 7.7],
  SDN: [30, 15], SUR: [-56, 4], SWE: [18, 62], CHE: [8.2, 46.8], SYR: [38, 35],
  TWN: [121, 24], TJK: [71, 39], TZA: [34.9, -6.4], THA: [101, 15], TLS: [125.7, -8.9],
  TGO: [1.2, 8.6], TON: [-175, -20], TTO: [-61, 10.7], TUN: [9.5, 34], TUR: [35, 39],
  TKM: [59, 40], UGA: [32.4, 1.3], UKR: [32, 49], ARE: [54, 24],
  GBR: [-2, 54], USA: [-98, 39], URY: [-56, -33], UZB: [63.8, 41.4], VUT: [167.7, -16],
  VAT: [12.5, 41.9], VEN: [-66.6, 7.1], VNM: [108, 14], YEM: [47.8, 15.6], ZMB: [27.8, -13.1],
  ZWE: [30, -20], ESH: [-13.2, 24.5], GRL: [-42, 72], PRI: [-66.5, 18.2],
  FLK: [-59, -52], ATA: [0, -80], NCL: [165.6, -21.3],
};

// Too small to click as a shape at normal zoom; the map draws a dot on top of them
export const tinyCountries = new Set([
  ...countries.filter((c) => c.isSmallIsland).map((c) => c.code),
  "VAT", "MCO", "SMR", "LIE", "AND", "LUX",
]);
