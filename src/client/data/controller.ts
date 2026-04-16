import { Controller, OnStart } from '@flamework/core';
import Squash from '@rbxts/squash';
import { Events, Functions } from 'client/network';
import { DataReplica, DataManager, DataFlags } from 'shared';
import { parseDataUserId } from 'shared/data/utils';

const serdesCount = Squash.vlq();

@Controller({})
export class DataController implements OnStart {
  public onStart(): void {
    Events.core.dataDelta.connect((payload) => this.onDataDelta(payload));
    Functions.requestHydration.invoke();
  }

  private onDataDelta(payload: buffer): void {
    const [ok, err] = pcall(() => {
      const cursor = Squash.frombuffer(payload);
      const count = serdesCount.des(cursor) as number;

      for (let i = 0; i < count; i++) {
        const delta = DataReplica.deserialize(cursor);
        const userId = parseDataUserId(delta.key);
        if (userId === undefined) {
          continue;
        }

        if ((delta.flags & DataFlags.Cleanup) !== 0) {
          DataManager.deleteData(userId);
          continue;
        }

        if (delta.data !== undefined) {
          DataManager.setData(userId, delta.data);
        }
      }
    });

    if (!ok) {
      warn(`[DataController] failed to deserialize delta: ${err}`);
    }
  }
}
