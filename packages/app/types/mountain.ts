/**
 * Shared mountain-related types used across the app
 */

/**
 * Base mountain data from API responses
 */
export type MountainData = {
  id: string;
  name: string;
  slug: string;
  location: string;
  height: string;
  latitude: string;
  longitude: string;
  imageUrl: string | null;
  essential: boolean;
  avgFamilyFriendly?: number | null;
  familyRatingCount?: number;
  avgDogFriendly?: number | null;
  dogRatingCount?: number;
  avgDifficulty?: number | null;
  difficultyRatingCount?: number;
};

/**
 * Mountain data with challenge count (used in My Mountains)
 */
export type MountainWithChallengeCount = MountainData & {
  challengeCount: number;
};

/**
 * New mountain data for local state (not yet saved to server)
 */
export type NewMountainData = {
  tempId: string;
  name: string;
  location: string;
  height: number;
  latitude: number;
  longitude: number;
  essential: boolean;
  image: string;
  imageUri?: string;
};

/**
 * Mountain info for display in avatar groups, lists, etc.
 */
export type MountainInfo = {
  id: string;
  name: string;
  imageUrl: string | null;
};
