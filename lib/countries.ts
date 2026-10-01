export type Continent = "Avrupa" | "Asya" | "Afrika" | "Kuzey Amerika" | "Güney Amerika" | "Okyanusya" | "Antarktika";

export interface Country {
  name: string;
  code: string;   // ISO alpha-3
  code2: string;  // ISO alpha-2 (for flag CDN)
  flag: string;   // emoji fallback
  continent: Continent;
  isSmallIsland?: boolean; // true for small island nations that are hard to find on the map
}

export const countries: Country[] = [
  { name: "Afganistan", code: "AFG", code2: "af", flag: "🇦🇫", continent: "Asya" },
  { name: "Arnavutluk", code: "ALB", code2: "al", flag: "🇦🇱", continent: "Avrupa" },
  { name: "Cezayir", code: "DZA", code2: "dz", flag: "🇩🇿", continent: "Afrika" },
  { name: "Andorra", code: "AND", code2: "ad", flag: "🇦🇩", continent: "Avrupa" },
  { name: "Angola", code: "AGO", code2: "ao", flag: "🇦🇴", continent: "Afrika" },
  { name: "Antigua ve Barbuda", code: "ATG", code2: "ag", flag: "🇦🇬", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Arjantin", code: "ARG", code2: "ar", flag: "🇦🇷", continent: "Güney Amerika" },
  { name: "Ermenistan", code: "ARM", code2: "am", flag: "🇦🇲", continent: "Asya" },
  { name: "Avustralya", code: "AUS", code2: "au", flag: "🇦🇺", continent: "Okyanusya" },
  { name: "Avusturya", code: "AUT", code2: "at", flag: "🇦🇹", continent: "Avrupa" },
  { name: "Azerbaycan", code: "AZE", code2: "az", flag: "🇦🇿", continent: "Asya" },
  { name: "Bahamalar", code: "BHS", code2: "bs", flag: "🇧🇸", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Bahreyn", code: "BHR", code2: "bh", flag: "🇧🇭", continent: "Asya", isSmallIsland: true },
  { name: "Bangladeş", code: "BGD", code2: "bd", flag: "🇧🇩", continent: "Asya" },
  { name: "Barbados", code: "BRB", code2: "bb", flag: "🇧🇧", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Belarus", code: "BLR", code2: "by", flag: "🇧🇾", continent: "Avrupa" },
  { name: "Belçika", code: "BEL", code2: "be", flag: "🇧🇪", continent: "Avrupa" },
  { name: "Belize", code: "BLZ", code2: "bz", flag: "🇧🇿", continent: "Kuzey Amerika" },
  { name: "Benin", code: "BEN", code2: "bj", flag: "🇧🇯", continent: "Afrika" },
  { name: "Bhutan", code: "BTN", code2: "bt", flag: "🇧🇹", continent: "Asya" },
  { name: "Bolivya", code: "BOL", code2: "bo", flag: "🇧🇴", continent: "Güney Amerika" },
  { name: "Bosna Hersek", code: "BIH", code2: "ba", flag: "🇧🇦", continent: "Avrupa" },
  { name: "Botsvana", code: "BWA", code2: "bw", flag: "🇧🇼", continent: "Afrika" },
  { name: "Brezilya", code: "BRA", code2: "br", flag: "🇧🇷", continent: "Güney Amerika" },
  { name: "Brunei", code: "BRN", code2: "bn", flag: "🇧🇳", continent: "Asya", isSmallIsland: true },
  { name: "Bulgaristan", code: "BGR", code2: "bg", flag: "🇧🇬", continent: "Avrupa" },
  { name: "Burkina Faso", code: "BFA", code2: "bf", flag: "🇧🇫", continent: "Afrika" },
  { name: "Burundi", code: "BDI", code2: "bi", flag: "🇧🇮", continent: "Afrika" },
  { name: "Kamboçya", code: "KHM", code2: "kh", flag: "🇰🇭", continent: "Asya" },
  { name: "Kamerun", code: "CMR", code2: "cm", flag: "🇨🇲", continent: "Afrika" },
  { name: "Kanada", code: "CAN", code2: "ca", flag: "🇨🇦", continent: "Kuzey Amerika" },
  { name: "Cabo Verde", code: "CPV", code2: "cv", flag: "🇨🇻", continent: "Afrika", isSmallIsland: true },
  { name: "Orta Afrika Cumhuriyeti", code: "CAF", code2: "cf", flag: "🇨🇫", continent: "Afrika" },
  { name: "Çad", code: "TCD", code2: "td", flag: "🇹🇩", continent: "Afrika" },
  { name: "Şili", code: "CHL", code2: "cl", flag: "🇨🇱", continent: "Güney Amerika" },
  { name: "Çin", code: "CHN", code2: "cn", flag: "🇨🇳", continent: "Asya" },
  { name: "Kolombiya", code: "COL", code2: "co", flag: "🇨🇴", continent: "Güney Amerika" },
  { name: "Komorlar", code: "COM", code2: "km", flag: "🇰🇲", continent: "Afrika", isSmallIsland: true },
  { name: "Kongo Cumhuriyeti", code: "COG", code2: "cg", flag: "🇨🇬", continent: "Afrika" },
  { name: "Kongo Demokratik Cumhuriyeti", code: "COD", code2: "cd", flag: "🇨🇩", continent: "Afrika" },
  { name: "Kosta Rika", code: "CRI", code2: "cr", flag: "🇨🇷", continent: "Kuzey Amerika" },
  { name: "Hırvatistan", code: "HRV", code2: "hr", flag: "🇭🇷", continent: "Avrupa" },
  { name: "Küba", code: "CUB", code2: "cu", flag: "🇨🇺", continent: "Kuzey Amerika" },
  { name: "Kıbrıs", code: "CYP", code2: "cy", flag: "🇨🇾", continent: "Avrupa" },
  { name: "Çekya", code: "CZE", code2: "cz", flag: "🇨🇿", continent: "Avrupa" },
  { name: "Danimarka", code: "DNK", code2: "dk", flag: "🇩🇰", continent: "Avrupa" },
  { name: "Cibuti", code: "DJI", code2: "dj", flag: "🇩🇯", continent: "Afrika" },
  { name: "Dominika", code: "DMA", code2: "dm", flag: "🇩🇲", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Dominik Cumhuriyeti", code: "DOM", code2: "do", flag: "🇩🇴", continent: "Kuzey Amerika" },
  { name: "Ekvador", code: "ECU", code2: "ec", flag: "🇪🇨", continent: "Güney Amerika" },
  { name: "Mısır", code: "EGY", code2: "eg", flag: "🇪🇬", continent: "Afrika" },
  { name: "El Salvador", code: "SLV", code2: "sv", flag: "🇸🇻", continent: "Kuzey Amerika" },
  { name: "Ekvator Ginesi", code: "GNQ", code2: "gq", flag: "🇬🇶", continent: "Afrika" },
  { name: "Eritre", code: "ERI", code2: "er", flag: "🇪🇷", continent: "Afrika" },
  { name: "Estonya", code: "EST", code2: "ee", flag: "🇪🇪", continent: "Avrupa" },
  { name: "Esvatini", code: "SWZ", code2: "sz", flag: "🇸🇿", continent: "Afrika" },
  { name: "Etiyopya", code: "ETH", code2: "et", flag: "🇪🇹", continent: "Afrika" },
  { name: "Fiji", code: "FJI", code2: "fj", flag: "🇫🇯", continent: "Okyanusya", isSmallIsland: true },
  { name: "Finlandiya", code: "FIN", code2: "fi", flag: "🇫🇮", continent: "Avrupa" },
  { name: "Fransa", code: "FRA", code2: "fr", flag: "🇫🇷", continent: "Avrupa" },
  { name: "Gabon", code: "GAB", code2: "ga", flag: "🇬🇦", continent: "Afrika" },
  { name: "Gambiya", code: "GMB", code2: "gm", flag: "🇬🇲", continent: "Afrika" },
  { name: "Gürcistan", code: "GEO", code2: "ge", flag: "🇬🇪", continent: "Asya" },
  { name: "Almanya", code: "DEU", code2: "de", flag: "🇩🇪", continent: "Avrupa" },
  { name: "Gana", code: "GHA", code2: "gh", flag: "🇬🇭", continent: "Afrika" },
  { name: "Yunanistan", code: "GRC", code2: "gr", flag: "🇬🇷", continent: "Avrupa" },
  { name: "Grenada", code: "GRD", code2: "gd", flag: "🇬🇩", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Guatemala", code: "GTM", code2: "gt", flag: "🇬🇹", continent: "Kuzey Amerika" },
  { name: "Gine", code: "GIN", code2: "gn", flag: "🇬🇳", continent: "Afrika" },
  { name: "Gine-Bissau", code: "GNB", code2: "gw", flag: "🇬🇼", continent: "Afrika" },
  { name: "Guyana", code: "GUY", code2: "gy", flag: "🇬🇾", continent: "Güney Amerika" },
  { name: "Haiti", code: "HTI", code2: "ht", flag: "🇭🇹", continent: "Kuzey Amerika" },
  { name: "Honduras", code: "HND", code2: "hn", flag: "🇭🇳", continent: "Kuzey Amerika" },
  { name: "Macaristan", code: "HUN", code2: "hu", flag: "🇭🇺", continent: "Avrupa" },
  { name: "İzlanda", code: "ISL", code2: "is", flag: "🇮🇸", continent: "Avrupa" },
  { name: "Hindistan", code: "IND", code2: "in", flag: "🇮🇳", continent: "Asya" },
  { name: "Endonezya", code: "IDN", code2: "id", flag: "🇮🇩", continent: "Asya" },
  { name: "İran", code: "IRN", code2: "ir", flag: "🇮🇷", continent: "Asya" },
  { name: "Irak", code: "IRQ", code2: "iq", flag: "🇮🇶", continent: "Asya" },
  { name: "İrlanda", code: "IRL", code2: "ie", flag: "🇮🇪", continent: "Avrupa" },
  { name: "İsrail", code: "ISR", code2: "il", flag: "🇮🇱", continent: "Asya" },
  { name: "İtalya", code: "ITA", code2: "it", flag: "🇮🇹", continent: "Avrupa" },
  { name: "Fildişi Sahili", code: "CIV", code2: "ci", flag: "🇨🇮", continent: "Afrika" },
  { name: "Jamaika", code: "JAM", code2: "jm", flag: "🇯🇲", continent: "Kuzey Amerika" },
  { name: "Japonya", code: "JPN", code2: "jp", flag: "🇯🇵", continent: "Asya" },
  { name: "Ürdün", code: "JOR", code2: "jo", flag: "🇯🇴", continent: "Asya" },
  { name: "Kazakistan", code: "KAZ", code2: "kz", flag: "🇰🇿", continent: "Asya" },
  { name: "Kenya", code: "KEN", code2: "ke", flag: "🇰🇪", continent: "Afrika" },
  { name: "Kiribati", code: "KIR", code2: "ki", flag: "🇰🇮", continent: "Okyanusya", isSmallIsland: true },
  { name: "Kuzey Kore", code: "PRK", code2: "kp", flag: "🇰🇵", continent: "Asya" },
  { name: "Güney Kore", code: "KOR", code2: "kr", flag: "🇰🇷", continent: "Asya" },
  { name: "Kosova", code: "XKX", code2: "xk", flag: "🇽🇰", continent: "Avrupa" },
  { name: "Kuveyt", code: "KWT", code2: "kw", flag: "🇰🇼", continent: "Asya" },
  { name: "Kırgızistan", code: "KGZ", code2: "kg", flag: "🇰🇬", continent: "Asya" },
  { name: "Laos", code: "LAO", code2: "la", flag: "🇱🇦", continent: "Asya" },
  { name: "Letonya", code: "LVA", code2: "lv", flag: "🇱🇻", continent: "Avrupa" },
  { name: "Lübnan", code: "LBN", code2: "lb", flag: "🇱🇧", continent: "Asya" },
  { name: "Lesotho", code: "LSO", code2: "ls", flag: "🇱🇸", continent: "Afrika" },
  { name: "Liberya", code: "LBR", code2: "lr", flag: "🇱🇷", continent: "Afrika" },
  { name: "Libya", code: "LBY", code2: "ly", flag: "🇱🇾", continent: "Afrika" },
  { name: "Lihtenştayn", code: "LIE", code2: "li", flag: "🇱🇮", continent: "Avrupa" },
  { name: "Litvanya", code: "LTU", code2: "lt", flag: "🇱🇹", continent: "Avrupa" },
  { name: "Lüksemburg", code: "LUX", code2: "lu", flag: "🇱🇺", continent: "Avrupa" },
  { name: "Kuzey Makedonya", code: "MKD", code2: "mk", flag: "🇲🇰", continent: "Avrupa" },
  { name: "Madagaskar", code: "MDG", code2: "mg", flag: "🇲🇬", continent: "Afrika" },
  { name: "Malavi", code: "MWI", code2: "mw", flag: "🇲🇼", continent: "Afrika" },
  { name: "Malezya", code: "MYS", code2: "my", flag: "🇲🇾", continent: "Asya" },
  { name: "Maldivler", code: "MDV", code2: "mv", flag: "🇲🇻", continent: "Asya", isSmallIsland: true },
  { name: "Mali", code: "MLI", code2: "ml", flag: "🇲🇱", continent: "Afrika" },
  { name: "Malta", code: "MLT", code2: "mt", flag: "🇲🇹", continent: "Avrupa", isSmallIsland: true },
  { name: "Marshall Adaları", code: "MHL", code2: "mh", flag: "🇲🇭", continent: "Okyanusya", isSmallIsland: true },
  { name: "Moritanya", code: "MRT", code2: "mr", flag: "🇲🇷", continent: "Afrika" },
  { name: "Mauritius", code: "MUS", code2: "mu", flag: "🇲🇺", continent: "Afrika", isSmallIsland: true },
  { name: "Meksika", code: "MEX", code2: "mx", flag: "🇲🇽", continent: "Kuzey Amerika" },
  { name: "Mikronezya", code: "FSM", code2: "fm", flag: "🇫🇲", continent: "Okyanusya", isSmallIsland: true },
  { name: "Moldova", code: "MDA", code2: "md", flag: "🇲🇩", continent: "Avrupa" },
  { name: "Monako", code: "MCO", code2: "mc", flag: "🇲🇨", continent: "Avrupa" },
  { name: "Moğolistan", code: "MNG", code2: "mn", flag: "🇲🇳", continent: "Asya" },
  { name: "Karadağ", code: "MNE", code2: "me", flag: "🇲🇪", continent: "Avrupa" },
  { name: "Fas", code: "MAR", code2: "ma", flag: "🇲🇦", continent: "Afrika" },
  { name: "Mozambik", code: "MOZ", code2: "mz", flag: "🇲🇿", continent: "Afrika" },
  { name: "Myanmar", code: "MMR", code2: "mm", flag: "🇲🇲", continent: "Asya" },
  { name: "Namibya", code: "NAM", code2: "na", flag: "🇳🇦", continent: "Afrika" },
  { name: "Nauru", code: "NRU", code2: "nr", flag: "🇳🇷", continent: "Okyanusya", isSmallIsland: true },
  { name: "Nepal", code: "NPL", code2: "np", flag: "🇳🇵", continent: "Asya" },
  { name: "Hollanda", code: "NLD", code2: "nl", flag: "🇳🇱", continent: "Avrupa" },
  { name: "Yeni Zelanda", code: "NZL", code2: "nz", flag: "🇳🇿", continent: "Okyanusya" },
  { name: "Nikaragua", code: "NIC", code2: "ni", flag: "🇳🇮", continent: "Kuzey Amerika" },
  { name: "Nijer", code: "NER", code2: "ne", flag: "🇳🇪", continent: "Afrika" },
  { name: "Nijerya", code: "NGA", code2: "ng", flag: "🇳🇬", continent: "Afrika" },
  { name: "Norveç", code: "NOR", code2: "no", flag: "🇳🇴", continent: "Avrupa" },
  { name: "Umman", code: "OMN", code2: "om", flag: "🇴🇲", continent: "Asya" },
  { name: "Pakistan", code: "PAK", code2: "pk", flag: "🇵🇰", continent: "Asya" },
  { name: "Palau", code: "PLW", code2: "pw", flag: "🇵🇼", continent: "Okyanusya", isSmallIsland: true },
  { name: "Filistin", code: "PSE", code2: "ps", flag: "🇵🇸", continent: "Asya" },
  { name: "Panama", code: "PAN", code2: "pa", flag: "🇵🇦", continent: "Kuzey Amerika" },
  { name: "Papua Yeni Gine", code: "PNG", code2: "pg", flag: "🇵🇬", continent: "Okyanusya" },
  { name: "Paraguay", code: "PRY", code2: "py", flag: "🇵🇾", continent: "Güney Amerika" },
  { name: "Peru", code: "PER", code2: "pe", flag: "🇵🇪", continent: "Güney Amerika" },
  { name: "Filipinler", code: "PHL", code2: "ph", flag: "🇵🇭", continent: "Asya" },
  { name: "Polonya", code: "POL", code2: "pl", flag: "🇵🇱", continent: "Avrupa" },
  { name: "Portekiz", code: "PRT", code2: "pt", flag: "🇵🇹", continent: "Avrupa" },
  { name: "Katar", code: "QAT", code2: "qa", flag: "🇶🇦", continent: "Asya" },
  { name: "Romanya", code: "ROU", code2: "ro", flag: "🇷🇴", continent: "Avrupa" },
  { name: "Rusya", code: "RUS", code2: "ru", flag: "🇷🇺", continent: "Avrupa" },
  { name: "Ruanda", code: "RWA", code2: "rw", flag: "🇷🇼", continent: "Afrika" },
  { name: "Saint Kitts ve Nevis", code: "KNA", code2: "kn", flag: "🇰🇳", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Saint Lucia", code: "LCA", code2: "lc", flag: "🇱🇨", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Saint Vincent ve Grenadinler", code: "VCT", code2: "vc", flag: "🇻🇨", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Samoa", code: "WSM", code2: "ws", flag: "🇼🇸", continent: "Okyanusya", isSmallIsland: true },
  { name: "San Marino", code: "SMR", code2: "sm", flag: "🇸🇲", continent: "Avrupa" },
  { name: "São Tomé ve Príncipe", code: "STP", code2: "st", flag: "🇸🇹", continent: "Afrika", isSmallIsland: true },
  { name: "Suudi Arabistan", code: "SAU", code2: "sa", flag: "🇸🇦", continent: "Asya" },
  { name: "Senegal", code: "SEN", code2: "sn", flag: "🇸🇳", continent: "Afrika" },
  { name: "Sırbistan", code: "SRB", code2: "rs", flag: "🇷🇸", continent: "Avrupa" },
  { name: "Seyşeller", code: "SYC", code2: "sc", flag: "🇸🇨", continent: "Afrika", isSmallIsland: true },
  { name: "Sierra Leone", code: "SLE", code2: "sl", flag: "🇸🇱", continent: "Afrika" },
  { name: "Singapur", code: "SGP", code2: "sg", flag: "🇸🇬", continent: "Asya", isSmallIsland: true },
  { name: "Slovakya", code: "SVK", code2: "sk", flag: "🇸🇰", continent: "Avrupa" },
  { name: "Slovenya", code: "SVN", code2: "si", flag: "🇸🇮", continent: "Avrupa" },
  { name: "Solomon Adaları", code: "SLB", code2: "sb", flag: "🇸🇧", continent: "Okyanusya", isSmallIsland: true },
  { name: "Somali", code: "SOM", code2: "so", flag: "🇸🇴", continent: "Afrika" },
  { name: "Güney Afrika", code: "ZAF", code2: "za", flag: "🇿🇦", continent: "Afrika" },
  { name: "Güney Sudan", code: "SSD", code2: "ss", flag: "🇸🇸", continent: "Afrika" },
  { name: "İspanya", code: "ESP", code2: "es", flag: "🇪🇸", continent: "Avrupa" },
  { name: "Sri Lanka", code: "LKA", code2: "lk", flag: "🇱🇰", continent: "Asya" },
  { name: "Sudan", code: "SDN", code2: "sd", flag: "🇸🇩", continent: "Afrika" },
  { name: "Surinam", code: "SUR", code2: "sr", flag: "🇸🇷", continent: "Güney Amerika" },
  { name: "İsveç", code: "SWE", code2: "se", flag: "🇸🇪", continent: "Avrupa" },
  { name: "İsviçre", code: "CHE", code2: "ch", flag: "🇨🇭", continent: "Avrupa" },
  { name: "Suriye", code: "SYR", code2: "sy", flag: "🇸🇾", continent: "Asya" },
  { name: "Tayvan", code: "TWN", code2: "tw", flag: "🇹🇼", continent: "Asya" },
  { name: "Tacikistan", code: "TJK", code2: "tj", flag: "🇹🇯", continent: "Asya" },
  { name: "Tanzanya", code: "TZA", code2: "tz", flag: "🇹🇿", continent: "Afrika" },
  { name: "Tayland", code: "THA", code2: "th", flag: "🇹🇭", continent: "Asya" },
  { name: "Doğu Timor", code: "TLS", code2: "tl", flag: "🇹🇱", continent: "Asya" },
  { name: "Togo", code: "TGO", code2: "tg", flag: "🇹🇬", continent: "Afrika" },
  { name: "Tonga", code: "TON", code2: "to", flag: "🇹🇴", continent: "Okyanusya", isSmallIsland: true },
  { name: "Trinidad ve Tobago", code: "TTO", code2: "tt", flag: "🇹🇹", continent: "Kuzey Amerika", isSmallIsland: true },
  { name: "Tunus", code: "TUN", code2: "tn", flag: "🇹🇳", continent: "Afrika" },
  { name: "Türkiye", code: "TUR", code2: "tr", flag: "🇹🇷", continent: "Avrupa" },
  { name: "Türkmenistan", code: "TKM", code2: "tm", flag: "🇹🇲", continent: "Asya" },
  { name: "Tuvalu", code: "TUV", code2: "tv", flag: "🇹🇻", continent: "Okyanusya", isSmallIsland: true },
  { name: "Uganda", code: "UGA", code2: "ug", flag: "🇺🇬", continent: "Afrika" },
  { name: "Ukrayna", code: "UKR", code2: "ua", flag: "🇺🇦", continent: "Avrupa" },
  { name: "Birleşik Arap Emirlikleri", code: "ARE", code2: "ae", flag: "🇦🇪", continent: "Asya" },
  { name: "Birleşik Krallık", code: "GBR", code2: "gb", flag: "🇬🇧", continent: "Avrupa" },
  { name: "Amerika Birleşik Devletleri", code: "USA", code2: "us", flag: "🇺🇸", continent: "Kuzey Amerika" },
  { name: "Uruguay", code: "URY", code2: "uy", flag: "🇺🇾", continent: "Güney Amerika" },
  { name: "Özbekistan", code: "UZB", code2: "uz", flag: "🇺🇿", continent: "Asya" },
  { name: "Vanuatu", code: "VUT", code2: "vu", flag: "🇻🇺", continent: "Okyanusya", isSmallIsland: true },
  { name: "Vatikan", code: "VAT", code2: "va", flag: "🇻🇦", continent: "Avrupa" },
  { name: "Venezuela", code: "VEN", code2: "ve", flag: "🇻🇪", continent: "Güney Amerika" },
  { name: "Vietnam", code: "VNM", code2: "vn", flag: "🇻🇳", continent: "Asya" },
  { name: "Yemen", code: "YEM", code2: "ye", flag: "🇾🇪", continent: "Asya" },
  { name: "Zambiya", code: "ZMB", code2: "zm", flag: "🇿🇲", continent: "Afrika" },
  { name: "Zimbabve", code: "ZWE", code2: "zw", flag: "🇿🇼", continent: "Afrika" },
  { name: "Batı Sahra", code: "ESH", code2: "eh", flag: "🇪🇭", continent: "Afrika" },
  { name: "Grönland", code: "GRL", code2: "gl", flag: "🇬🇱", continent: "Kuzey Amerika" },
  { name: "Porto Riko", code: "PRI", code2: "pr", flag: "🇵🇷", continent: "Kuzey Amerika" },
  { name: "Fransız Guyanası", code: "GUF", code2: "gf", flag: "🇬🇫", continent: "Güney Amerika" },
  { name: "Falkland Adaları", code: "FLK", code2: "fk", flag: "🇫🇰", continent: "Güney Amerika" },
  { name: "Antarktika", code: "ATA", code2: "aq", flag: "🇦🇶", continent: "Antarktika" },
  { name: "Yeni Kaledonya", code: "NCL", code2: "nc", flag: "🇳🇨", continent: "Okyanusya" },
];

// Map ISO codes to country data for quick lookup
export const countryCodeMap = new Map<string, Country>(
  countries.map(country => [country.code, country])
);

// Shuffle an array (Fisher-Yates)
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Get random country
export function getRandomCountry(excludeCodes: string[] = [], includeSmallIslands: boolean = true): Country {
  const availableCountries = countries.filter(c => {
    if (excludeCodes.includes(c.code)) return false;
    if (!includeSmallIslands && c.isSmallIsland) return false;
    return true;
  });
  if (availableCountries.length === 0) return countries[0];
  return availableCountries[Math.floor(Math.random() * availableCountries.length)];
}

// Get filtered countries based on settings
export function getFilteredCountries(includeSmallIslands: boolean): Country[] {
  if (includeSmallIslands) return countries;
  return countries.filter(c => !c.isSmallIsland);
}

// Get all country codes in a continent
export function getCountriesByContinent(continent: Continent): string[] {
  return countries.filter(c => c.continent === continent).map(c => c.code);
}

// Continent to numeric code mapping for highlighting
export const continentCountryCodes: Record<Continent, string[]> = {
  "Avrupa": ["008", "020", "040", "056", "070", "100", "112", "191", "196", "203", "208", "233", "246", "250", "276", "300", "348", "352", "372", "380", "428", "438", "440", "442", "470", "492", "499", "528", "578", "616", "620", "642", "643", "674", "688", "703", "705", "724", "752", "756", "804", "807", "826", "336", "498", "-99"],
  "Asya": ["004", "051", "031", "048", "050", "064", "096", "116", "156", "268", "356", "360", "364", "368", "376", "392", "400", "398", "408", "410", "414", "417", "418", "422", "458", "462", "496", "104", "524", "512", "586", "275", "608", "634", "682", "702", "144", "760", "158", "762", "764", "626", "795", "784", "860", "704", "887"],
  "Afrika": ["012", "024", "204", "072", "854", "108", "120", "132", "140", "148", "174", "178", "180", "262", "818", "226", "232", "748", "231", "266", "270", "288", "324", "624", "384", "404", "426", "430", "434", "450", "454", "466", "478", "480", "504", "508", "516", "562", "566", "646", "678", "686", "690", "694", "706", "710", "728", "729", "834", "768", "788", "800", "894", "716", "732"],
  "Kuzey Amerika": ["028", "044", "052", "084", "124", "188", "192", "212", "214", "222", "308", "320", "332", "340", "388", "484", "558", "591", "659", "662", "670", "780", "840", "630", "304"],
  "Güney Amerika": ["032", "068", "076", "152", "170", "218", "328", "600", "604", "740", "858", "862", "238", "254"],
  "Okyanusya": ["036", "242", "296", "584", "583", "520", "554", "585", "598", "882", "090", "548", "776", "798", "540"],
  "Antarktika": ["010"]
};
