import type { Profile } from "@prisma/client";
import { parseLocation } from "@/lib/utils";
import { isSameMetropolitanRegion } from "@/constants/locations";

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
            !isSameMetroRegion(userProfile.residenceLocation, candidateProfile.residenceLocation)) {
          return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Check if two locations are in the same metropolitan region.
 * Location format: "province|district"
 *
 * 광역권 예시:
 * - 수도권: 서울/경기/인천
 * - 영남권: 부산/울산/경남/경북/대구
 * - 호남권: 광주/전남/전북
 * - 충청권: 대전/세종/충남/충북
 */
function isSameMetroRegion(locationA: string, locationB: string): boolean {
  const a = parseLocation(locationA);
  const b = parseLocation(locationB);
  return isSameMetropolitanRegion(a.province, b.province);
}

/**
 * @deprecated Use isSameMetroRegion instead for better regional matching.
 * Check if two locations share the same province.
 */
function isSameProvince(locationA: string, locationB: string): boolean {
  const a = parseLocation(locationA);
  const b = parseLocation(locationB);
  return a.province === b.province;
}

/**
 * Optional: Check location compatibility with configurable strictness.
 * Not used as a hard filter by default, but available for future use.
 *
 * @param locationA - First location (province|district)
 * @param locationB - Second location (province|district)
 * @param mode - Compatibility mode:
 *   - "metro": Same metropolitan region (default, most lenient)
 *   - "province": Same province (stricter)
 *   - "district": Same district (strictest)
 */
export function checkLocationCompatibility(
  locationA: string,
  locationB: string,
  mode: "metro" | "province" | "district" = "metro",
): boolean {
  const a = parseLocation(locationA);
  const b = parseLocation(locationB);

  switch (mode) {
    case "district":
      return a.province === b.province && a.district === b.district;
    case "province":
      return a.province === b.province;
    case "metro":
    default:
      return isSameMetropolitanRegion(a.province, b.province);
  }
}
