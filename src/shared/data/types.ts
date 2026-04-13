import { t } from '@rbxts/t';

export const IS_PROFILE_DATA = t.interface({
  timePlayed: t.number,
  lastLogin: t.string,
  loginStreak: t.number,
});

export const IS_DATA = t.interface({
  profile: IS_PROFILE_DATA,
});

export type ProfileData = t.static<typeof IS_PROFILE_DATA>;

export type Data = t.static<typeof IS_DATA> & {
  profile: ProfileData;
};
