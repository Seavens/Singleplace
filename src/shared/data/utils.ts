import type { ProfileData, Data } from './types';

const PLAYER_KEY_PREFIX = 'Player';

const DEFAULT_PROFILE_DATA: ProfileData = {
  timePlayed: 0,
  lastLogin: '',
  loginStreak: 0,
};

function createDefaultProfileData(): ProfileData {
  return { ...DEFAULT_PROFILE_DATA };
}

export function createDefaultData(): Data {
  return {
    profile: createDefaultProfileData(),
  };
}

export const DEFAULT_DATA: Data = createDefaultData();

export function normalizeData(data: Partial<Data> | undefined): Data {
  return {
    profile: {
      ...DEFAULT_PROFILE_DATA,
      ...data?.profile,
    },
  };
}

export function buildDataKey(userId: number): string {
  return `${PLAYER_KEY_PREFIX}:${userId}`;
}

export function parseDataUserId(key: string): number | undefined {
  const parts = string.split(key, ':');
  if (parts.size() !== 2 || parts[0] !== PLAYER_KEY_PREFIX) {
    return undefined;
  }
  return tonumber(parts[1]);
}
