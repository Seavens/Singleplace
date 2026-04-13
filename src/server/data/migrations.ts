import type { CollectionOptions } from '@rbxts/lapis';
import type { Data } from 'shared';

// DATA_MIGRATIONS defines how to migrate saved player data between schema versions.
// Each entry migrates stored data from version N-1 → N (oldest first).
// The last entry in the array must return the current Data type.
//
// Lapis requires at least one entry when the key is present, so this
// exports `undefined` until your first real migration is needed.
// Once you have entries, assign the array directly.
//
// ─── Example: adding `profile.coins` in v1 ───────────────────────────────
//
//   type DataV0 = { profile: Omit<Data['profile'], 'coins'> };
//
//   export const DATA_MIGRATIONS: DataMigrationList = [
//     (old: unknown): Data => {
//       const prev = old as DataV0;
//       return { profile: { ...prev.profile, coins: 0 } };
//     },
//   ];
//
// ─────────────────────────────────────────────────────────────────────────

// Migration<T> is not exported by Lapis, so we derive the list type from CollectionOptions.
export type DataMigrationList = NonNullable<CollectionOptions<Data>['migrations']>;

export const DATA_MIGRATIONS: DataMigrationList | undefined = undefined;
