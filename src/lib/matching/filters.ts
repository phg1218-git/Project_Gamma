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
 *   3. Dealbreaker conditions check
 *   4. Optional: location compatibility
 */

/**
 * Check if a candidate passes all hard filters for a given user.
 *
 * @param userProfile - The requesting user's profile
 * @param candidateProfile - The candidate being evaluated
 * @returns true if candidate passes all filters, false if eliminated
 */
export function passesHardFilters(
  userProfile: Profile,
  candidateProfile: Profile,
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

  // 4. Dealbreaker conditions
  if (!passesDealbreakers(userProfile, candidateProfile)) {
    return false;
  }

  return true;
}

/**
 * Check dealbreaker conditions.
 *
 * Maps dislikedConditions strings to actual profile checks.
 * Each condition checks a specific attribute of the candidate.
 */
function passesDealbreakers(
  userProfile: Profile,
  candidateProfile: Profile,
): boolean {
  const disliked = userProfile.dislikedConditions;

  for (const condition of disliked) {
    switch (condition) {
      case "흡연자":
        if (candidateProfile.smoking === "OFTEN" || candidateProfile.smoking === "SOMETIMES") {
          return false;
        }
        break;

      case "과음자":
        if (candidateProfile.drinking === "OFTEN") {
          return false;
        }
        break;

      case "종교차이":
        // Different religion is a dealbreaker (except NONE matches anything)
        if (
          userProfile.religion !== "NONE" &&
          candidateProfile.religion !== "NONE" &&
          userProfile.religion !== candidateProfile.religion
        ) {
          return false;
        }
        break;

      case "장거리":
        // Check if residence locations are in different provinces
        if (!isSameProvince(userProfile.residenceLocation, candidateProfile.residenceLocation)) {
          return false;
        }
        break;

      // Other conditions are preference-based, not hard dealbreakers
      // They could be factored into soft scoring instead
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
