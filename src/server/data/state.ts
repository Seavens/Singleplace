import { Service, OnStart } from '@flamework/core';
import { effect } from '@rbxts/charm';
import { createCollection, Document } from '@rbxts/lapis';
import { IS_DATA, Data } from 'shared';
import { DataManager } from 'shared/data/state';
import { DEFAULT_DATA } from 'shared/data/utils';
import { PlayerStateService } from 'server/players';
import { USE_MOCK_DATA, COLLECTION_NAME, DOCUMENT_PREFIX } from './constants';
import { DATA_MIGRATIONS } from './migrations';

type Unsubscribe = () => void;

@Service({})
export class DataStoreService implements OnStart {
  private readonly collection = createCollection<Data>(COLLECTION_NAME, {
    defaultData: DEFAULT_DATA,
    validate: IS_DATA,
    ...(DATA_MIGRATIONS !== undefined ? { migrations: DATA_MIGRATIONS } : {}),
  });

  private readonly docs = new Map<number, Document<Data>>();
  private readonly subs = new Map<number, Unsubscribe>();

  public constructor(private readonly playerService: PlayerStateService) {}

  public onStart(): void {
    // onPlayerAdded fires catch-up for any players already online, so no
    // separate getPlayers() pass is needed (and would cause a double-load).
    this.playerService.onPlayerAdded((player) => this.loadPlayer(player));
    this.playerService.onPlayerRemoving((player) => this.unloadPlayer(player));
  }

  private async loadPlayer(player: Player): Promise<void> {
    const id = player.UserId;

    // In Studio, use completely in-memory data that never touches DataStore.
    if (USE_MOCK_DATA) {
      DataManager.setData(id, DEFAULT_DATA);
      this.playerService.markPlayerLoaded(player);
      return;
    }

    const key = `${DOCUMENT_PREFIX}${id}`;

    try {
      const doc = await this.collection.load(key, [id]);

      // Player may have disconnected while we awaited the DataStore load.
      // unloadPlayer would have already run (finding no doc), so we must
      // close the document and bail out to avoid orphaning data in the atom.
      if (!this.playerService.getPlayerByUserId(id)) {
        await doc
          .close()
          .catch((e) => warn(`DataStoreService: close on early-exit failed for ${id}: ${e}`));
        return;
      }

      const initial = doc.read();

      DataManager.setData(id, initial);

      const unsubscribe = effect(() => {
        const current = DataManager.getData(id);
        doc.write(current);
      });

      this.subs.set(id, unsubscribe);
      this.docs.set(id, doc);
    } catch (err) {
      warn(`DataStoreService: failed to load ${player.Name} (${id}): ${err}`);
      DataManager.setData(id, DEFAULT_DATA);
    }

    this.playerService.markPlayerLoaded(player);
  }

  private async unloadPlayer(player: Player): Promise<void> {
    const id = player.UserId;

    if (USE_MOCK_DATA) {
      DataManager.deleteData(id);
      return;
    }

    const doc = this.docs.get(id);

    // Flush final state to the document before unsubscribing the reactive
    // effect. If Charm defers effect runs (end-of-frame batching), the last
    // atom mutation (e.g. session time saved on disconnect) may not have
    // triggered doc.write() yet — writing explicitly here closes that gap.
    if (doc) {
      doc.write(DataManager.getData(id));
    }

    this.subs.get(id)?.();
    this.subs.delete(id);
    DataManager.deleteData(id);

    if (!doc) {
      return;
    }

    await doc.close().catch((e) => warn(`DataStoreService: close failed for ${id}: ${e}`));
    this.docs.delete(id);
  }
}
