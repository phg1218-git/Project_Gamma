import type { Profile } from "@prisma/client";
import { parseLocation } from "@/lib/utils";

/**
 * 이어줌 — Hard Filters (Dealbreaker Logic)
 *
 * Hard filters ELIMINATE candidates before scoring.
 * If a candidate fails any hard filter, they are excluded entirely.
 *
 * Hard Filter Pipeline:
 *   1. stopMatching = false (both users must be active)
 *   2. Gender compatibility (opposite gender matching)
 *   3. Dealbreaker conditions check (관리자 전역 설정으로 개별 필터 비활성화 가능)
 */

export interface FilterConfig {
  filterSmoker: boolean;   // 흡연자 필터 활성 여부
  filterDrinker: boolean;  // 과음자 필터 활성 여부
  filterReligion: boolean; // 종교차이 필터 활성 여부
  filterDistance: boolean; // 장거리 필터 활성 여부
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  filterSmoker: true,
  filterDrinker: true,
  filterReligion: true,
  filterDistance: true,
};

/**
 * Check if a candidate passes all hard filters for a given user.
 *
 * @param userProfile      - The requesting user's profile
 * @param candidateProfile - The candidate being evaluated
 * @param config           - Admin-controlled global filter toggles
 * @returns true if candidate passes all filters, false if eliminated
 */
export function passesHardFilters(
  userProfile: Profile,
  candidateProfile: Profile,
  config: FilterConfig = DEFAULT_FILTER_CONFIG,
): boolean {
  // 1. Both users must be actively matching
  if (userProfile.stopMatching || candidateProfile.stopMatching) {
    return false;
  }

  // 2. Must not be the same user
  if (userProfile.userId === candidateProfile.userId) {
    return false;
  }

  // 3. Opposite gender matching (default behavior)
  if (userProfile.gender === candidateProfile.gender) {
    return false;
  }

  // 4. Dealbreaker conditions (config로 비활성화 가능)
  if (!passesDealbreakers(userProfile, candidateProfile, config)) {
    return false;
  }

  return true;
}

/**
 * Check dealbreaker conditions.
 * config에서 false인 필터는 해당 조건이 있어도 통과시킨다.
 */
function passesDealbreakers(
  userProfile: Profile,
  candidateProfile: Profile,
  config: FilterConfig,
): boolean {
  const disliked = userProfile.dislikedConditions;

  for (const condition of disliked) {
    switch (condition) {
      case "흡연자":
        if (config.filterSmoker &&
            (candidateProfile.smoking === "OFTEN" || candidateProfile.smoking === "SOMETIMES")) {
          return false;
        }
        break;

      case "과음자":
        if (config.filterDrinker && candidateProfile.drinking === "OFTEN") {
          return false;
        }
        break;

      case "종교차이":
        if (
          config.filterReligion &&
          userProfile.religion !== "NONE" &&
          candidateProfile.religion !== "NONE" &&
          userProfile.religion !== candidateProfile.religion
        ) {
          return false;
        }
        break;

      case "장거리":
        if (config.filterDistance &&
            !isSameProvince(userProfile.residenceLocation, candidateProfile.residenceLocation)) {
          return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Check if two locations share the same province.
 * Location format: "province|district"
 */
function isSameProvince(locationA: string, locationB: string): boolean {
  const a = parseLocation(locationA);
  const b = parseLocation(locationB);
  return a.province === b.province;
}

/**
 * Optional: Check location compatibility with configurable strictness.
 * Not used as a hard filter by default, but available for future use.
 */
export function checkLocationCompatibility(
  locationA: string,
  locationB: string,
  strict: boolean = false,
): boolean {
  const a = parseLocation(locationA);
  const b = parseLocation(locationB);

  if (strict) {
    // Same district required
    return a.province === b.province && a.district === b.district;
  }

  // Same province is sufficient
  return a.province === b.province;
}
