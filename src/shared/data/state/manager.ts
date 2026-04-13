import { computed } from '@rbxts/charm';
import { produce } from '@rbxts/immut';
import { Draft } from '@rbxts/immut/src/types-external';
import { Data } from '../types';
import { normalizeData, createDefaultData, buildDataKey } from '../utils';
import { dataAtom, DataState } from './atom';

export class DataManager {
  public static getData(id: number): Data {
    const key = buildDataKey(id);
    return normalizeData(dataAtom()[key]);
  }

  public static setData(id: number, data: Data): void {
    const key = buildDataKey(id);
    const normalized = normalizeData(data);
    dataAtom(
      (prev) =>
        produce(prev, (draft: Draft<DataState>): void => {
          draft[key] = normalized;
        }) as DataState,
    );
  }

  public static selectData(id: number): () => Data {
    return computed(() => DataManager.getData(id));
  }

  public static deleteData(id: number): void {
    const key = buildDataKey(id);
    dataAtom(
      (prev) =>
        produce(prev, (draft: Draft<DataState>): void => {
          draft[key] = undefined;
        }) as DataState,
    );
  }

  public static updateData(id: number, mutator: (data: Draft<Data>) => void): void {
    const key = buildDataKey(id);
    dataAtom(
      (prev) =>
        produce(prev, (draft: Draft<DataState>): void => {
          if (draft[key] === undefined) {
            draft[key] = createDefaultData();
          }

          const current = draft[key];
          if (current === undefined) {
            return;
          }

          mutator(current as Draft<Data>);
        }) as DataState,
    );
  }
}
