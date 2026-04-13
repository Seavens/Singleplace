import { Service, OnStart } from '@flamework/core';
import { Players } from '@rbxts/services';
import Squash from '@rbxts/squash';
import { Functions, Events } from 'server/network';
import { Clock } from 'shared/core';
import { DataReplica, DataReplicationDelta } from 'shared/data/replication';
import { dataAtom, DataManager } from 'shared/data/state';
import { buildDataKey, parseDataUserId } from 'shared/data/utils';
import { iterateRecord } from 'shared/utils';
import { PlayerStateService } from 'server/players';

const serdesCount = Squash.vlq();

@Service({})
export class DataReplicationService implements OnStart {
  private readonly replicas = new Map<string, DataReplica>();
  private readonly clock = new Clock(1 / 5);

  public constructor(private readonly playerStateService: PlayerStateService) {}

  public onStart(): void {
    this.clock.on(() => this.tick());
    // onPlayerLoaded already fires catch-up callbacks for any players loaded
    // before this service started, so no separate loop is needed here.
    this.playerStateService.onPlayerLoaded((player) => this.sendSnapshot(player));
    Functions.requestHydration.setCallback((player) => this.sendSnapshot(player));
  }

  private tick(): void {
    const grouped = this.collectDeltas();
    for (const [userId, deltas] of grouped) {
      if (deltas.size() === 0) {
        continue;
      }
      const player = Players.GetPlayerByUserId(userId);
      if (!player) {
        continue;
      }
      const payload = this.encode(deltas);
      Events.core.dataDelta(player, payload);
    }
  }

  private collectDeltas(): Map<number, Array<DataReplicationDelta>> {
    const grouped = new Map<number, Array<DataReplicationDelta>>();
    const current = dataAtom();
    const seen = new Set<string>();

    iterateRecord(current, (key, data) => {
      seen.add(key);
      const userId = parseDataUserId(key);
      if (userId === undefined) {
        return;
      }
      if (!this.playerStateService.isPlayerLoaded(userId)) {
        return;
      }
      let replica = this.replicas.get(key);
      if (!replica) {
        replica = new DataReplica(key, data);
        this.replicas.set(key, replica);
      }
      const delta = replica.update(data);
      if (delta) {
        this.pushDelta(grouped, userId, delta);
      }
    });

    for (const [key, replica] of this.replicas) {
      if (seen.has(key)) {
        continue;
      }
      const userId = parseDataUserId(key);
      this.replicas.delete(key);
      if (userId === undefined) {
        continue;
      }
      const cleanup = replica.cleanup();
      this.pushDelta(grouped, userId, cleanup);
    }

    return grouped;
  }

  private sendSnapshot(player: Player): void {
    const key = buildDataKey(player.UserId);
    if (dataAtom()[key] === undefined) {
      warn(`[DataReplication] sendSnapshot called before data loaded for ${player.UserId}`);
      return;
    }
    const entry = DataManager.getData(player.UserId);
    let replica = this.replicas.get(key);
    if (!replica) {
      replica = new DataReplica(key, entry);
      this.replicas.set(key, replica);
    }
    const snapshot = replica.snapshotDelta(entry);
    replica.prime();
    const payload = this.encode([snapshot]);
    Events.core.dataDelta(player, payload);
  }

  private encode(deltas: ReadonlyArray<DataReplicationDelta>): buffer {
    const cursor = Squash.cursor();
    for (const delta of deltas) {
      DataReplica.serialize(cursor, delta);
    }
    serdesCount.ser(cursor, deltas.size());
    return Squash.tobuffer(cursor);
  }

  private pushDelta(
    grouped: Map<number, Array<DataReplicationDelta>>,
    userId: number,
    delta: DataReplicationDelta,
  ): void {
    let list = grouped.get(userId);
    if (!list) {
      list = new Array<DataReplicationDelta>();
      grouped.set(userId, list);
    }
    list.push(delta);
  }
}
