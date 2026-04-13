import type { Data } from '../types';

import { atom } from '@rbxts/charm';

export interface DataState {
  readonly [user: string]: Data | undefined;
}

export const dataAtom = atom<DataState>({});
