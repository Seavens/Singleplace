import { Service, OnStart } from '@flamework/core';
import Object from '@rbxts/object-utils';
import { Players } from '@rbxts/services';
import Squash from '@rbxts/squash';
import { Functions, Events } from 'server/network';
import { GameClock } from 'shared/core';
import { DataReplica, DataReplicationDelta } from 'shared/data/replication';
import { dataAtom, DataManager } from 'shared/data/state';
import { buildDataKey, parseDataUserId } from 'shared/data/utils';
import { PlayerStateService } from 'server/players';

const serdesCount = Squash.vlq();

@Service({})
export class DataReplicationService implements OnStart {
  private readonly replicas = new Map<string, DataReplica>();
  private readonly hydratedPlayers = new Set<number>();
  private accum = 0;

  public constructor(private readonly playerStateService: PlayerStateService) {}

  public onStart(): void {
    GameClock.on((dt) => {
      this.accum += dt;
      if (this.accum < 0.2) return;
      this.accum -= 0.2;
      this.tick();
    });
    this.playerStateService.onPlayerLoaded((player) => this.sendSnapshot(player));
    this.playerStateService.onPlayerRemoving((player) =>
      this.hydratedPlayers.delete(player.UserId),
    );
    Functions.requestHydration.setCallback((player) => this.sendSnapshot(player));
  }

  private tick(): void {
    const grouped = this.collectDeltas();
    grouped.forEach((deltas, userId) => {
      if (deltas.size() === 0) {
        return;
      }
      const player = Players.GetPlayerByUserId(userId);
      if (!player) {
        return;
      }
      const payload = this.encode(deltas);
      Events.core.dataDelta(player, payload);
    });
  }

  private collectDeltas(): Map<number, Array<DataReplicationDelta>> {
    const grouped = new Map<number, Array<DataReplicationDelta>>();
    const current = dataAtom();
    const seen = new Set<string>();

    for (const [key, data] of Object.entries(current)) {
      const recordKey = key as string;
      seen.add(recordKey);
      const userId = parseDataUserId(recordKey);
      if (userId === undefined) {
        continue;
      }
      if (!this.playerStateService.isPlayerLoaded(userId)) {
        continue;
      }
      let replica = this.replicas.get(recordKey);
      if (!replica) {
        replica = new DataReplica(recordKey, data);
        this.replicas.set(recordKey, replica);
      }
      const delta = replica.update(data);
      if (delta) {
        this.pushDelta(grouped, userId, delta);
      }
    }

    const stale: Array<string> = [];
    this.replicas.forEach((_, key) => {
      if (!seen.has(key)) {
        stale.push(key);
      }
    });

    for (const key of stale) {
      const replica = this.replicas.get(key)!;
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
    if (this.hydratedPlayers.has(player.UserId)) {
      return;
    }

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
    this.hydratedPlayers.add(player.UserId);
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
