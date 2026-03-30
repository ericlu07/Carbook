// AU and NZ plate format detection
// NZ plates: ABC123 (3 letters + 3 numbers), or personalized (2-6 chars)
// AU plates vary by state but common formats:
//   - NSW: AB12CD (2L+2N+2L), ABC12D (3L+2N+1L)
//   - VIC: 1AB2CD (1N+2L+1N+2L), ABC123 (same as NZ)
//   - QLD: 123ABC (3N+3L)
//   - SA: S123ABC (S+3N+3L)
//   - WA: 1ABC234 (1N+3L+3N)
//   - TAS: AB1234 (2L+4N)
//   - NT: AB12CD (2L+2N+2L)
//   - ACT: YAB12C (Y+2L+2N+1L)

type PlateCountry = "NZ" | "AU" | "unknown";

interface PlateInfo {
  country: PlateCountry;
  formatted: string;
  flag: string;
  label: string;
}

const NZ_STANDARD = /^[A-Z]{3}\d{3}$/;
const NZ_NEWER = /^[A-Z]{3}\d{2}[A-Z]$/;
const NZ_PERSONALIZED = /^[A-Z0-9]{2,6}$/;

// Australian state patterns (more specific)
const AU_NSW_1 = /^[A-Z]{2}\d{2}[A-Z]{2}$/;       // AB12CD
const AU_NSW_2 = /^[A-Z]{3}\d{2}[A-Z]$/;           // ABC12D
const AU_QLD = /^\d{3}[A-Z]{3}$/;                   // 123ABC
const AU_SA = /^S\d{3}[A-Z]{3}$/;                   // S123ABC
const AU_WA = /^\d[A-Z]{3}\d{3}$/;                  // 1ABC234
const AU_TAS = /^[A-Z]{2}\d{4}$/;                   // AB1234
const AU_VIC = /^\d[A-Z]{2}\d[A-Z]{2}$/;            // 1AB2CD
const AU_ACT = /^Y[A-Z]{2}\d{2}[A-Z]$/;             // YAB12C

function isAustralianPlate(plate: string): boolean {
  return (
    AU_NSW_1.test(plate) ||
    AU_NSW_2.test(plate) ||
    AU_QLD.test(plate) ||
    AU_SA.test(plate) ||
    AU_WA.test(plate) ||
    AU_TAS.test(plate) ||
    AU_VIC.test(plate) ||
    AU_ACT.test(plate)
  );
}

function isNewZealandPlate(plate: string): boolean {
  return NZ_STANDARD.test(plate) || NZ_NEWER.test(plate);
}

export function detectPlate(plate: string): PlateInfo {
  const clean = plate.toUpperCase().replace(/[\s-]/g, "");

  if (isNewZealandPlate(clean)) {
    return { country: "NZ", formatted: clean, flag: "🇳🇿", label: "New Zealand" };
  }

  if (isAustralianPlate(clean)) {
    return { country: "AU", formatted: clean, flag: "🇦🇺", label: "Australia" };
  }

  // Ambiguous short plates — default to NZ for now since that's the primary market
  if (NZ_PERSONALIZED.test(clean) && clean.length <= 6) {
    return { country: "NZ", formatted: clean, flag: "🇳🇿", label: "New Zealand" };
  }

  return { country: "unknown", formatted: clean, flag: "", label: "" };
}
