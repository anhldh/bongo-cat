import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Header, type Page } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { TypingTest } from "./components/typing/TypingTest";
import { KeyboardTester } from "./components/keyboard/KeyboardTester";
import { CornerCat } from "./components/cat/CornerCat";
import { useTheme } from "./lib/useTheme";
import { usePersistent } from "./lib/usePersistent";

const pageFromHash = (): Page =>
  window.location.hash.startsWith("#/keyboard") ? "keyboard" : "type";

export default function App() {
  const { pref, cycle } = useTheme();
  const [sound, setSound] = usePersistent("sound", true);
  const [cat, setCat] = usePersistent("cat", true);
  const [page, setPageState] = useState<Page>(pageFromHash);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const onHash = () => setPageState(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = (p: Page) => {
    window.location.hash = p === "keyboard" ? "/keyboard" : "/";
    setPageState(p);
    if (p !== "type") setRunning(false);
  };

  const onRunningChange = useCallback((r: boolean) => setRunning(r), []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        page={page}
        onPage={setPage}
        theme={pref}
        onTheme={cycle}
        sound={sound}
        onSound={() => setSound((s) => !s)}
        cat={cat}
        onCat={() => setCat((c) => !c)}
        dimmed={running}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 pb-10 sm:px-8 lg:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {page === "type" ? (
              <TypingTest onRunningChange={onRunningChange} />
            ) : (
              <KeyboardTester />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer dimmed={running || page !== "type"} />

      <CornerCat visible={cat} sound={sound} onHide={() => setCat(false)} />
    </div>
  );
}
