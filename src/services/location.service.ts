// Location Service using official Indian Postal & Administrative Data from 'india-pincode-lookup'
// Provides States, Districts, Taluks, Villages, and Pincode auto-lookup

interface PincodeRecord {
  officeName: string;
  pincode: number;
  taluk: string;
  districtName: string;
  stateName: string;
}

// Lazy load data in memory to avoid cold start delays
let pincodeData: PincodeRecord[] | null = null;

function getData(): PincodeRecord[] {
  if (!pincodeData) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      pincodeData = require('india-pincode-lookup/pincodes.json');
    } catch {
      pincodeData = [];
    }
  }
  return pincodeData || [];
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

export function cleanVillageName(officeName: string): string {
  if (!officeName) return '';
  // Remove suffix like ' B.O', ' S.O (District)', ' H.O'
  const cleaned = officeName.replace(/ (B\.O|S\.O|H\.O).*/i, '').trim();
  return toTitleCase(cleaned || officeName);
}

export class LocationService {
  /**
   * Get all distinct Indian States
   */
  static getStates(): string[] {
    const data = getData();
    const stateSet = new Set<string>();

    for (const item of data) {
      if (item.stateName) {
        stateSet.add(toTitleCase(item.stateName));
      }
    }

    const states = Array.from(stateSet).sort((a, b) => a.localeCompare(b));
    // Prioritize Tamil Nadu at top if present, then alphabetical
    const tnIndex = states.indexOf('Tamil Nadu');
    if (tnIndex > -1) {
      states.splice(tnIndex, 1);
      states.unshift('Tamil Nadu');
    }
    return states;
  }

  /**
   * Get all districts for a given State
   */
  static getDistricts(state: string): string[] {
    if (!state) return [];
    const data = getData();
    const normalizedState = state.toLowerCase().trim();
    const districtSet = new Set<string>();

    for (const item of data) {
      if (item.stateName && item.stateName.toLowerCase().trim() === normalizedState) {
        if (item.districtName) {
          districtSet.add(toTitleCase(item.districtName));
        }
      }
    }

    return Array.from(districtSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get all Taluks for a State and District
   */
  static getTaluks(state: string, district: string): string[] {
    if (!district) return [];
    const data = getData();
    const normalizedDistrict = district.toLowerCase().trim();
    const normalizedState = state ? state.toLowerCase().trim() : '';

    const talukSet = new Set<string>();

    for (const item of data) {
      const matchDistrict = item.districtName && item.districtName.toLowerCase().trim() === normalizedDistrict;
      const matchState = !normalizedState || (item.stateName && item.stateName.toLowerCase().trim() === normalizedState);

      if (matchDistrict && matchState && item.taluk) {
        const cleanTaluk = toTitleCase(item.taluk.trim());
        if (cleanTaluk && cleanTaluk !== 'Na' && cleanTaluk !== '-') {
          talukSet.add(cleanTaluk);
        }
      }
    }

    return Array.from(talukSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get all Villages / Post Offices for a District and optional Taluk
   */
  static getVillages(district: string, taluk?: string): { name: string; pincode: number; taluk: string }[] {
    if (!district) return [];
    const data = getData();
    const normalizedDistrict = district.toLowerCase().trim();
    const normalizedTaluk = taluk ? taluk.toLowerCase().trim() : '';

    const villageMap = new Map<string, { name: string; pincode: number; taluk: string }>();

    for (const item of data) {
      if (item.districtName && item.districtName.toLowerCase().trim() === normalizedDistrict) {
        if (!normalizedTaluk || (item.taluk && item.taluk.toLowerCase().trim() === normalizedTaluk)) {
          const villageName = cleanVillageName(item.officeName);
          if (villageName && !villageMap.has(villageName.toLowerCase())) {
            villageMap.set(villageName.toLowerCase(), {
              name: villageName,
              pincode: item.pincode,
              taluk: toTitleCase(item.taluk || ''),
            });
          }
        }
      }
    }

    return Array.from(villageMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Instant Lookup by 6-digit Pincode
   */
  static lookupByPincode(pincode: string | number): {
    pincode: number;
    state: string;
    district: string;
    taluk: string;
    villages: string[];
    records: { officeName: string; taluk: string; village: string }[];
  } | null {
    const num = Number(pincode);
    if (!num || isNaN(num)) return null;

    const data = getData();
    const matches = data.filter((d) => d.pincode === num);

    if (matches.length === 0) return null;

    const first = matches[0];
    const villages = Array.from(new Set(matches.map((m) => cleanVillageName(m.officeName)))).sort();

    return {
      pincode: num,
      state: toTitleCase(first.stateName || ''),
      district: toTitleCase(first.districtName || ''),
      taluk: toTitleCase(first.taluk || ''),
      villages,
      records: matches.map((m) => ({
        officeName: m.officeName,
        taluk: toTitleCase(m.taluk || ''),
        village: cleanVillageName(m.officeName),
      })),
    };
  }
}
