export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const omitted = new Set<PropertyKey>(keys);
  const result: Partial<Omit<T, K>> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!omitted.has(key)) {
      (result as Record<keyof T, T[keyof T]>)[key] = obj[key];
    }
  }
  return result as Omit<T, K>;
}

export function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function groupBy<T, K extends PropertyKey>(
  values: T[],
  getKey: (value: T) => K
): Record<K, T[]> {
  return values.reduce((acc, value) => {
    const key = getKey(value);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(value);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(
  values: T[],
  iteratee?: (value: T) => string | number
): T[] {
  const list = [...values];
  if (!iteratee) {
    return list.sort() as T[];
  }
  return list.sort((a, b) => {
    const left = iteratee(a);
    const right = iteratee(b);
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

export function truncate(
  value: string,
  options: number | { length?: number; omission?: string } = 30,
  omissionArg = "..."
): string {
  const length =
    typeof options === "number" ? options : (options.length ?? 30);
  const omission =
    typeof options === "number" ? omissionArg : (options.omission ?? "...");
  if (value.length <= length) {
    return value;
  }
  const end = Math.max(length - omission.length, 0);
  return `${value.slice(0, end)}${omission}`;
}
