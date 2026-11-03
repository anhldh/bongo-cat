import { useEffect, useState, useSyncExternalStore } from "react";
import { TypingEngine, type Config } from "./engine";

export function useTypingEngine(initial: Config) {
  const [engine] = useState(() => new TypingEngine(initial));
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  useEffect(() => () => engine.dispose(), [engine]);
  return { engine, snap };
}
