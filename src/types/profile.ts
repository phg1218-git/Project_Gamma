/**
 * 이어줌 — Profile Types
 *
 * Client-side types for profile data.
 * Mirrors the Prisma Profile model for type-safe component props.
 */

export interface ProfileData {
  id: string;
  gender: string;
  dateOfBirth: string; // ISO string on the wire
  nickname: string;
  jobCategory: string;
  jobDetail: string;
  companyLocation: string;
  residenceLocation: string;
  hometownLocation: string;
  personality: string;
  hobbies: string[];
  preferences: string[];
  mbti: string;
  bloodType: string;
  religion: string;
  drinking: string;
  smoking: string;
  dislikedConditions: string[];
  height?: number;
  profileImage?: string;
  celebrity?: string;
  minMatchScore: number;
  stopMatching: boolean;
}

export interface ProfileFormData extends Omit<ProfileData, "id"> {}
