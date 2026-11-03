import { useEffect, useState } from "react";
import { load, save } from "./storage";

/** useState nhớ qua localStorage. */
export function usePersistent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue] as const;
}
