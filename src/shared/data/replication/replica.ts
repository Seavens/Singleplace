import Squash, { Cursor } from '@rbxts/squash';
import { Data } from '../types';
import { DataFlags, DataReplicationDelta } from './types';
import { HttpService } from '@rbxts/services';

const serdesKey = Squash.string();
const serdesFlags = Squash.uint(1);
const serdesPayload = Squash.opt(Squash.string());

export class DataReplica {
  public readonly key: string;
  private lastSerialized?: string;
  private initialized = false;

  public constructor(key: string, initial: Data) {
    this.key = key;
    this.lastSerialized = HttpService.JSONEncode(initial);
  }

  public update(data: Data): DataReplicationDelta | undefined {
    const serialized = HttpService.JSONEncode(data);
    if (this.initialized && serialized === this.lastSerialized) {
      return undefined;
    }
    this.lastSerialized = serialized;
    const flags = this.initialized ? DataFlags.Data : DataFlags.Data | DataFlags.Spawn;
    this.initialized = true;
    return {
      key: this.key,
      flags,
      data,
    };
  }

  public snapshotDelta(data: Data): DataReplicationDelta {
    this.lastSerialized = HttpService.JSONEncode(data);
    return {
      key: this.key,
      flags: DataFlags.Data | DataFlags.Spawn,
      data,
    };
  }

  public cleanup(): DataReplicationDelta {
    this.lastSerialized = undefined;
    this.initialized = false;
    return {
      key: this.key,
      flags: DataFlags.Cleanup,
    };
  }

  public prime(): void {
    this.initialized = true;
  }

  public static serialize(cursor: Cursor, delta: DataReplicationDelta): void {
    serdesPayload.ser(cursor, delta.data ? HttpService.JSONEncode(delta.data) : undefined);
    serdesFlags.ser(cursor, delta.flags);
    serdesKey.ser(cursor, delta.key);
  }

  public static deserialize(cursor: Cursor): DataReplicationDelta {
    const key = serdesKey.des(cursor) as string;
    const flags = serdesFlags.des(cursor) as DataFlags;
    const payload = serdesPayload.des(cursor) as string | undefined;
    return {
      key,
      flags,
      data: payload !== undefined ? (HttpService.JSONDecode(payload) as Data) : undefined,
    };
  }
}
