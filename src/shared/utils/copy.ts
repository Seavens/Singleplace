/** @internal */
function isObject(v: unknown): v is Record<string | number, unknown> {
  return typeOf(v as defined) === 'table';
}

/** @internal */
function isArray(v: unknown): v is Array<unknown> {
  if (!isObject(v)) {
    return false;
  }
  return (v as Record<number, unknown>)[1 as unknown as number] !== undefined;
}

/**
 * Deep clone: recursively clones an object or array, preserving reference identity for circular references
 * @param value
 * @param seen
 * @returns
 */
export function deepClone<T>(value: T, seen = new Map<object, unknown>()): T {
  if (!isObject(value)) {
    return value;
  }

  const cached = seen.get(value as unknown as object);
  if (cached !== undefined) {
    return cached as T;
  }

  if (isArray(value)) {
    const out = [] as Array<unknown>;
    seen.set(value as unknown as object, out);
    const arr = value as unknown as Array<unknown>;
    for (let i = 0; i < arr.size(); i++) {
      out[i] = deepClone(arr[i], seen);
    }
    return out as unknown as T;
  }

  const out: Record<string | number, unknown> = {};
  seen.set(value as unknown as object, out);
  let key: unknown = undefined;
  let done = false;
  while (!done) {
    const [nextKey, nextValue] = next(value as object, key);
    if (nextKey === undefined) {
      done = true;
    } else {
      key = nextKey;
      out[nextKey as string | number] = deepClone(nextValue, seen);
    }
  }
  return out as unknown as T;
}

/**
 * Deep merge: recursively merges `over` into `base`
 * @param base
 * @param over
 * @returns
 */
export function deepMerge<T>(base: T, over?: Partial<T>): T {
  if (over === undefined) {
    return base;
  }
  if (!isObject(base)) {
    return (over as T) ?? base;
  }

  const result = deepClone(base);
  let key: unknown = undefined;
  let done = false;
  while (!done) {
    const [nextKey, nextValue] = next(over as object, key);
    if (nextKey === undefined) {
      done = true;
    } else {
      key = nextKey;

      const keyString = nextKey as string | number;
      const rv = (result as Record<string | number, unknown>)[keyString];

      if (isArray(nextValue)) {
        (result as Record<string | number, unknown>)[keyString] = deepClone(nextValue);
      } else if (isObject(nextValue) && isObject(rv)) {
        (result as Record<string | number, unknown>)[keyString] = deepMerge(
          rv,
          nextValue as Partial<typeof rv>,
        );
      } else {
        (result as Record<string | number, unknown>)[keyString] = deepClone(nextValue);
      }
    }
  }
  return result;
}
