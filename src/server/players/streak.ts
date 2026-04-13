import { ProfileData } from 'shared';

// 12-hour periods so casual players who log in at e.g. 8pm one evening and
// 7am the next morning still get credit for a consecutive session.
const STREAK_PERIOD = 43200; // seconds

export function applyLoginStreak(
  profile: ProfileData,
  now: DateTime,
): Pick<ProfileData, 'loginStreak' | 'lastLogin'> {
  const lastLogin = profile.lastLogin;
  const nowPeriod = math.floor(now.UnixTimestamp / STREAK_PERIOD);

  let loginStreak: number;

  if (lastLogin === '') {
    loginStreak = 1;
  } else {
    const lastDate = DateTime.fromIsoDate(lastLogin);
    if (!lastDate) {
      loginStreak = 1;
    } else {
      const diff = nowPeriod - math.floor(lastDate.UnixTimestamp / STREAK_PERIOD);
      if (diff === 0) {
        loginStreak = profile.loginStreak;
      } else if (diff === 1) {
        loginStreak = profile.loginStreak + 1;
      } else {
        loginStreak = 1;
      }
    }
  }

  return { loginStreak, lastLogin: now.ToIsoDate() };
}
