import type { Data } from '../types';

export interface DataReplicationDelta {
  key: string;
  flags: DataFlags;
  data?: Data;
}

export const enum DataFlags {
  None = 0,
  Data = 1 << 0,
  Spawn = 1 << 1,
  Cleanup = 1 << 7,
}
