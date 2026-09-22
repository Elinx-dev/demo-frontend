// ─── Country Data ─────────────────────────────────────────────────────────────
// Flag emoji uses Unicode regional indicator symbols - no image assets needed.
// format: mask uses 9 for digit placeholder

export interface Country {
    name: string;   // Display name
    iso2: string;   // ISO 3166-1 alpha-2 code
    dialCode: string;   // e.g. "+1"
    flag: string;   // Unicode flag emoji
    mask?: string;   // Optional phone mask (9 = digit)
    priority?: number;  // Higher = show first in list
}

export const COUNTRIES: Country[] = [
    // ── Priority (top of list) ──────────────────────────────────────────────
    { name: "United States", iso2: "US", dialCode: "+1", flag: "🇺🇸", mask: "(999) 999-9999", priority: 10 },
    { name: "United Kingdom", iso2: "GB", dialCode: "+44", flag: "🇬🇧", mask: "9999 999999", priority: 9 },
    { name: "India", iso2: "IN", dialCode: "+91", flag: "🇮🇳", mask: "99999 99999", priority: 9 },
    { name: "Canada", iso2: "CA", dialCode: "+1", flag: "🇨🇦", mask: "(999) 999-9999", priority: 8 },
    { name: "Australia", iso2: "AU", dialCode: "+61", flag: "🇦🇺", mask: "999 999 999", priority: 8 },
    { name: "Germany", iso2: "DE", dialCode: "+49", flag: "🇩🇪", mask: "9999 9999999", priority: 7 },
    { name: "France", iso2: "FR", dialCode: "+33", flag: "🇫🇷", mask: "99 99 99 99 99", priority: 7 },
    { name: "China", iso2: "CN", dialCode: "+86", flag: "🇨🇳", mask: "999 9999 9999", priority: 7 },
    { name: "Japan", iso2: "JP", dialCode: "+81", flag: "🇯🇵", mask: "99-9999-9999", priority: 6 },
    { name: "Brazil", iso2: "BR", dialCode: "+55", flag: "🇧🇷", mask: "(99) 99999-9999", priority: 6 },

    // ── Asia ────────────────────────────────────────────────────────────────
    { name: "Afghanistan", iso2: "AF", dialCode: "+93", flag: "🇦🇫", mask: "999 999 9999" },
    { name: "Bangladesh", iso2: "BD", dialCode: "+880", flag: "🇧🇩", mask: "99999-999999" },
    { name: "Bhutan", iso2: "BT", dialCode: "+975", flag: "🇧🇹", mask: "99 99 9999" },
    { name: "Cambodia", iso2: "KH", dialCode: "+855", flag: "🇰🇭", mask: "99 999 999" },
    { name: "Hong Kong", iso2: "HK", dialCode: "+852", flag: "🇭🇰", mask: "9999 9999" },
    { name: "Indonesia", iso2: "ID", dialCode: "+62", flag: "🇮🇩", mask: "9999-999-9999" },
    { name: "Iran", iso2: "IR", dialCode: "+98", flag: "🇮🇷", mask: "9999 999 9999" },
    { name: "Iraq", iso2: "IQ", dialCode: "+964", flag: "🇮🇶", mask: "9999 999 9999" },
    { name: "Israel", iso2: "IL", dialCode: "+972", flag: "🇮🇱", mask: "999-999-9999" },
    { name: "Jordan", iso2: "JO", dialCode: "+962", flag: "🇯🇴", mask: "9 9999 9999" },
    { name: "Kazakhstan", iso2: "KZ", dialCode: "+7", flag: "🇰🇿", mask: "999 999-99-99" },
    { name: "Kuwait", iso2: "KW", dialCode: "+965", flag: "🇰🇼", mask: "9999 9999" },
    { name: "Kyrgyzstan", iso2: "KG", dialCode: "+996", flag: "🇰🇬", mask: "9999 999 999" },
    { name: "Laos", iso2: "LA", dialCode: "+856", flag: "🇱🇦", mask: "99 99 999 999" },
    { name: "Lebanon", iso2: "LB", dialCode: "+961", flag: "🇱🇧", mask: "99 999 999" },
    { name: "Malaysia", iso2: "MY", dialCode: "+60", flag: "🇲🇾", mask: "99-9999 9999" },
    { name: "Maldives", iso2: "MV", dialCode: "+960", flag: "🇲🇻", mask: "999-9999" },
    { name: "Mongolia", iso2: "MN", dialCode: "+976", flag: "🇲🇳", mask: "9999 9999" },
    { name: "Myanmar", iso2: "MM", dialCode: "+95", flag: "🇲🇲", mask: "99 999 9999" },
    { name: "Nepal", iso2: "NP", dialCode: "+977", flag: "🇳🇵", mask: "99-9999999" },
    { name: "North Korea", iso2: "KP", dialCode: "+850", flag: "🇰🇵" },
    { name: "Oman", iso2: "OM", dialCode: "+968", flag: "🇴🇲", mask: "9999 9999" },
    { name: "Pakistan", iso2: "PK", dialCode: "+92", flag: "🇵🇰", mask: "9999 9999999" },
    { name: "Palestine", iso2: "PS", dialCode: "+970", flag: "🇵🇸", mask: "99 999 9999" },
    { name: "Philippines", iso2: "PH", dialCode: "+63", flag: "🇵🇭", mask: "9999 999 9999" },
    { name: "Qatar", iso2: "QA", dialCode: "+974", flag: "🇶🇦", mask: "9999 9999" },
    { name: "Saudi Arabia", iso2: "SA", dialCode: "+966", flag: "🇸🇦", mask: "999 999 9999" },
    { name: "Singapore", iso2: "SG", dialCode: "+65", flag: "🇸🇬", mask: "9999 9999" },
    { name: "South Korea", iso2: "KR", dialCode: "+82", flag: "🇰🇷", mask: "999-9999-9999" },
    { name: "Sri Lanka", iso2: "LK", dialCode: "+94", flag: "🇱🇰", mask: "999 999 9999" },
    { name: "Syria", iso2: "SY", dialCode: "+963", flag: "🇸🇾", mask: "9999 999 999" },
    { name: "Taiwan", iso2: "TW", dialCode: "+886", flag: "🇹🇼", mask: "9999 999 999" },
    { name: "Tajikistan", iso2: "TJ", dialCode: "+992", flag: "🇹🇯", mask: "999 99 9999" },
    { name: "Thailand", iso2: "TH", dialCode: "+66", flag: "🇹🇭", mask: "99 999 9999" },
    { name: "Turkmenistan", iso2: "TM", dialCode: "+993", flag: "🇹🇲", mask: "9 99 999999" },
    { name: "UAE", iso2: "AE", dialCode: "+971", flag: "🇦🇪", mask: "999 999 9999" },
    { name: "Uzbekistan", iso2: "UZ", dialCode: "+998", flag: "🇺🇿", mask: "99 999 99 99" },
    { name: "Vietnam", iso2: "VN", dialCode: "+84", flag: "🇻🇳", mask: "999 9999 999" },
    { name: "Yemen", iso2: "YE", dialCode: "+967", flag: "🇾🇪", mask: "999 999 999" },

    // ── Europe ──────────────────────────────────────────────────────────────
    { name: "Albania", iso2: "AL", dialCode: "+355", flag: "🇦🇱", mask: "999 999 999" },
    { name: "Andorra", iso2: "AD", dialCode: "+376", flag: "🇦🇩", mask: "999 999" },
    { name: "Austria", iso2: "AT", dialCode: "+43", flag: "🇦🇹", mask: "999 9999999" },
    { name: "Belarus", iso2: "BY", dialCode: "+375", flag: "🇧🇾", mask: "99 999-99-99" },
    { name: "Belgium", iso2: "BE", dialCode: "+32", flag: "🇧🇪", mask: "9999 99 99 99" },
    { name: "Bosnia Herzegovina", iso2: "BA", dialCode: "+387", flag: "🇧🇦", mask: "999 999 999" },
    { name: "Bulgaria", iso2: "BG", dialCode: "+359", flag: "🇧🇬", mask: "999 999 999" },
    { name: "Croatia", iso2: "HR", dialCode: "+385", flag: "🇭🇷", mask: "99 999 9999" },
    { name: "Cyprus", iso2: "CY", dialCode: "+357", flag: "🇨🇾", mask: "99 999999" },
    { name: "Czech Republic", iso2: "CZ", dialCode: "+420", flag: "🇨🇿", mask: "999 999 999" },
    { name: "Denmark", iso2: "DK", dialCode: "+45", flag: "🇩🇰", mask: "99 99 99 99" },
    { name: "Estonia", iso2: "EE", dialCode: "+372", flag: "🇪🇪", mask: "9999 9999" },
    { name: "Finland", iso2: "FI", dialCode: "+358", flag: "🇫🇮", mask: "999 9999999" },
    { name: "Greece", iso2: "GR", dialCode: "+30", flag: "🇬🇷", mask: "999 999 9999" },
    { name: "Hungary", iso2: "HU", dialCode: "+36", flag: "🇭🇺", mask: "99 999 9999" },
    { name: "Iceland", iso2: "IS", dialCode: "+354", flag: "🇮🇸", mask: "999 9999" },
    { name: "Ireland", iso2: "IE", dialCode: "+353", flag: "🇮🇪", mask: "99 999 9999" },
    { name: "Italy", iso2: "IT", dialCode: "+39", flag: "🇮🇹", mask: "999 999 9999" },
    { name: "Kosovo", iso2: "XK", dialCode: "+383", flag: "🇽🇰", mask: "999 999 999" },
    { name: "Latvia", iso2: "LV", dialCode: "+371", flag: "🇱🇻", mask: "9999 9999" },
    { name: "Liechtenstein", iso2: "LI", dialCode: "+423", flag: "🇱🇮", mask: "999 999 999" },
    { name: "Lithuania", iso2: "LT", dialCode: "+370", flag: "🇱🇹", mask: "999 99999" },
    { name: "Luxembourg", iso2: "LU", dialCode: "+352", flag: "🇱🇺", mask: "999 999 999" },
    { name: "Malta", iso2: "MT", dialCode: "+356", flag: "🇲🇹", mask: "9999 9999" },
    { name: "Moldova", iso2: "MD", dialCode: "+373", flag: "🇲🇩", mask: "999 99 999" },
    { name: "Monaco", iso2: "MC", dialCode: "+377", flag: "🇲🇨", mask: "9999 9999" },
    { name: "Montenegro", iso2: "ME", dialCode: "+382", flag: "🇲🇪", mask: "999 999 999" },
    { name: "Netherlands", iso2: "NL", dialCode: "+31", flag: "🇳🇱", mask: "99 9999 9999" },
    { name: "North Macedonia", iso2: "MK", dialCode: "+389", flag: "🇲🇰", mask: "999 999 999" },
    { name: "Norway", iso2: "NO", dialCode: "+47", flag: "🇳🇴", mask: "999 99 999" },
    { name: "Poland", iso2: "PL", dialCode: "+48", flag: "🇵🇱", mask: "999 999 999" },
    { name: "Portugal", iso2: "PT", dialCode: "+351", flag: "🇵🇹", mask: "999 999 999" },
    { name: "Romania", iso2: "RO", dialCode: "+40", flag: "🇷🇴", mask: "9999 999 999" },
    { name: "Russia", iso2: "RU", dialCode: "+7", flag: "🇷🇺", mask: "999 999-99-99" },
    { name: "San Marino", iso2: "SM", dialCode: "+378", flag: "🇸🇲", mask: "999 999 9999" },
    { name: "Serbia", iso2: "RS", dialCode: "+381", flag: "🇷🇸", mask: "999 9999999" },
    { name: "Slovakia", iso2: "SK", dialCode: "+421", flag: "🇸🇰", mask: "9999 999 999" },
    { name: "Slovenia", iso2: "SI", dialCode: "+386", flag: "🇸🇮", mask: "99 999 999" },
    { name: "Spain", iso2: "ES", dialCode: "+34", flag: "🇪🇸", mask: "999 99 99 99" },
    { name: "Sweden", iso2: "SE", dialCode: "+46", flag: "🇸🇪", mask: "99-999 99 99" },
    { name: "Switzerland", iso2: "CH", dialCode: "+41", flag: "🇨🇭", mask: "999 999 99 99" },
    { name: "Turkey", iso2: "TR", dialCode: "+90", flag: "🇹🇷", mask: "9999 999 9999" },
    { name: "Ukraine", iso2: "UA", dialCode: "+380", flag: "🇺🇦", mask: "999 999 9999" },
    { name: "Vatican City", iso2: "VA", dialCode: "+39", flag: "🇻🇦" },

    // ── Americas ────────────────────────────────────────────────────────────
    { name: "Argentina", iso2: "AR", dialCode: "+54", flag: "🇦🇷", mask: "999 99-9999-9999" },
    { name: "Bahamas", iso2: "BS", dialCode: "+1", flag: "🇧🇸", mask: "(999) 999-9999" },
    { name: "Barbados", iso2: "BB", dialCode: "+1", flag: "🇧🇧", mask: "(999) 999-9999" },
    { name: "Belize", iso2: "BZ", dialCode: "+501", flag: "🇧🇿", mask: "999-9999" },
    { name: "Bolivia", iso2: "BO", dialCode: "+591", flag: "🇧🇴", mask: "99999999" },
    { name: "Chile", iso2: "CL", dialCode: "+56", flag: "🇨🇱", mask: "9 9999 9999" },
    { name: "Colombia", iso2: "CO", dialCode: "+57", flag: "🇨🇴", mask: "999 9999999" },
    { name: "Costa Rica", iso2: "CR", dialCode: "+506", flag: "🇨🇷", mask: "9999-9999" },
    { name: "Cuba", iso2: "CU", dialCode: "+53", flag: "🇨🇺", mask: "99 999999" },
    { name: "Dominican Republic", iso2: "DO", dialCode: "+1", flag: "🇩🇴", mask: "(999) 999-9999" },
    { name: "Ecuador", iso2: "EC", dialCode: "+593", flag: "🇪🇨", mask: "999 999 9999" },
    { name: "El Salvador", iso2: "SV", dialCode: "+503", flag: "🇸🇻", mask: "9999-9999" },
    { name: "Guatemala", iso2: "GT", dialCode: "+502", flag: "🇬🇹", mask: "9999-9999" },
    { name: "Haiti", iso2: "HT", dialCode: "+509", flag: "🇭🇹", mask: "99 99 9999" },
    { name: "Honduras", iso2: "HN", dialCode: "+504", flag: "🇭🇳", mask: "9999-9999" },
    { name: "Jamaica", iso2: "JM", dialCode: "+1", flag: "🇯🇲", mask: "(999) 999-9999" },
    { name: "Mexico", iso2: "MX", dialCode: "+52", flag: "🇲🇽", mask: "999 999 9999" },
    { name: "Nicaragua", iso2: "NI", dialCode: "+505", flag: "🇳🇮", mask: "9999-9999" },
    { name: "Panama", iso2: "PA", dialCode: "+507", flag: "🇵🇦", mask: "9999-9999" },
    { name: "Paraguay", iso2: "PY", dialCode: "+595", flag: "🇵🇾", mask: "999 999999" },
    { name: "Peru", iso2: "PE", dialCode: "+51", flag: "🇵🇪", mask: "999 999 999" },
    { name: "Puerto Rico", iso2: "PR", dialCode: "+1", flag: "🇵🇷", mask: "(999) 999-9999" },
    { name: "Trinidad & Tobago", iso2: "TT", dialCode: "+1", flag: "🇹🇹", mask: "(999) 999-9999" },
    { name: "Uruguay", iso2: "UY", dialCode: "+598", flag: "🇺🇾", mask: "9999 999 999" },
    { name: "Venezuela", iso2: "VE", dialCode: "+58", flag: "🇻🇪", mask: "9999-9999999" },

    // ── Africa ──────────────────────────────────────────────────────────────
    { name: "Algeria", iso2: "DZ", dialCode: "+213", flag: "🇩🇿", mask: "9999 99 99 99" },
    { name: "Angola", iso2: "AO", dialCode: "+244", flag: "🇦🇴", mask: "999 999 999" },
    { name: "Cameroon", iso2: "CM", dialCode: "+237", flag: "🇨🇲", mask: "9999 999 999" },
    { name: "DR Congo", iso2: "CD", dialCode: "+243", flag: "🇨🇩", mask: "999 999 999" },
    { name: "Egypt", iso2: "EG", dialCode: "+20", flag: "🇪🇬", mask: "9999 999 9999" },
    { name: "Ethiopia", iso2: "ET", dialCode: "+251", flag: "🇪🇹", mask: "999 999 9999" },
    { name: "Ghana", iso2: "GH", dialCode: "+233", flag: "🇬🇭", mask: "999 999 9999" },
    { name: "Kenya", iso2: "KE", dialCode: "+254", flag: "🇰🇪", mask: "9999 999999" },
    { name: "Libya", iso2: "LY", dialCode: "+218", flag: "🇱🇾", mask: "999-9999999" },
    { name: "Madagascar", iso2: "MG", dialCode: "+261", flag: "🇲🇬", mask: "999 99 999 99" },
    { name: "Morocco", iso2: "MA", dialCode: "+212", flag: "🇲🇦", mask: "9999-999999" },
    { name: "Mozambique", iso2: "MZ", dialCode: "+258", flag: "🇲🇿", mask: "99 999 9999" },
    { name: "Nigeria", iso2: "NG", dialCode: "+234", flag: "🇳🇬", mask: "9999 999 9999" },
    { name: "Rwanda", iso2: "RW", dialCode: "+250", flag: "🇷🇼", mask: "9999 999 999" },
    { name: "Senegal", iso2: "SN", dialCode: "+221", flag: "🇸🇳", mask: "99 999 99 99" },
    { name: "Somalia", iso2: "SO", dialCode: "+252", flag: "🇸🇴", mask: "999 999 999" },
    { name: "South Africa", iso2: "ZA", dialCode: "+27", flag: "🇿🇦", mask: "999 999 9999" },
    { name: "Sudan", iso2: "SD", dialCode: "+249", flag: "🇸🇩", mask: "999 999 9999" },
    { name: "Tanzania", iso2: "TZ", dialCode: "+255", flag: "🇹🇿", mask: "9999 999 999" },
    { name: "Tunisia", iso2: "TN", dialCode: "+216", flag: "🇹🇳", mask: "99 999 999" },
    { name: "Uganda", iso2: "UG", dialCode: "+256", flag: "🇺🇬", mask: "9999 999999" },
    { name: "Zimbabwe", iso2: "ZW", dialCode: "+263", flag: "🇿🇼", mask: "999 999 999" },

    // ── Oceania ─────────────────────────────────────────────────────────────
    { name: "Fiji", iso2: "FJ", dialCode: "+679", flag: "🇫🇯", mask: "999 9999" },
    { name: "New Zealand", iso2: "NZ", dialCode: "+64", flag: "🇳🇿", mask: "999 999 9999" },
    { name: "Papua New Guinea", iso2: "PG", dialCode: "+675", flag: "🇵🇬", mask: "9999 9999" },
    { name: "Samoa", iso2: "WS", dialCode: "+685", flag: "🇼🇸", mask: "99 99999" },
    { name: "Tonga", iso2: "TO", dialCode: "+676", flag: "🇹🇴", mask: "999 9999" },
    { name: "Vanuatu", iso2: "VU", dialCode: "+678", flag: "🇻🇺", mask: "999 9999" },
];

// Pre-sorted: priority desc → name asc
export const SORTED_COUNTRIES: Country[] = [...COUNTRIES].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return a.name.localeCompare(b.name);
});

export function findCountryByIso2(iso2: string): Country | undefined {
    return COUNTRIES.find((c) => c.iso2.toUpperCase() === iso2.toUpperCase());
}

export function findCountryByDialCode(dialCode: string): Country | undefined {
    return SORTED_COUNTRIES.find((c) => c.dialCode === dialCode);
}