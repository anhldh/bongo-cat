import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import {
  Cat,
  Keyboard,
  Monitor,
  Moon,
  PawPrint,
  ScanSearch,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ThemePref } from "../../lib/useTheme";

export type Page = "type" | "keyboard";

type Props = {
  page: Page;
  onPage: (p: Page) => void;
  theme: ThemePref;
  onTheme: () => void;
  sound: boolean;
  onSound: () => void;
  cat: boolean;
  onCat: () => void;
  /** đang gõ -> mờ hẳn đi */
  dimmed: boolean;
};

const THEME_LABEL: Record<ThemePref, string> = {
  dark: "giao diện: tối",
  light: "giao diện: sáng",
  system: "giao diện: theo hệ thống",
};

const NAV: { id: Page; label: string; icon: ReactNode; soon?: boolean }[] = [
  { id: "type", label: "gõ phím", icon: <Keyboard size={16} /> },
  { id: "keyboard", label: "kiểm tra phím", icon: <ScanSearch size={16} /> },
];

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={clsx(
        "grid size-9 place-items-center rounded-lg transition-colors hover:bg-panel",
        active ? "text-text" : "text-sub hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export function Header(p: Props) {
  const ThemeIcon = p.theme === "dark" ? Moon : p.theme === "light" ? Sun : Monitor;

  return (
    <header
      className={clsx(
        "mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-5 transition-opacity duration-300 sm:px-8",
        p.dimmed && "opacity-15 hover:opacity-100",
      )}
    >
      <a
        href="#/"
        onClick={(e) => {
          e.preventDefault();
          p.onPage("type");
        }}
        className="flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-main text-bg">
          <PawPrint size={18} strokeWidth={2.4} />
        </span>
        <span className="hidden sm:inline">
          bongo<span className="text-main">type</span>
        </span>
      </a>

      <nav className="ml-2 flex items-center gap-1 text-sm">
        {NAV.map((n) => {
          const active = p.page === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => p.onPage(n.id)}
              onMouseDown={(e) => e.preventDefault()}
              className={clsx(
                "relative flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors",
                active ? "text-text" : "text-sub hover:text-text",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-panel"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {n.icon}
                <span className="hidden md:inline">{n.label}</span>
                {n.soon && (
                  <span className="rounded bg-main/15 px-1 text-[0.6rem] leading-4 text-main">
                    sắp có
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label={p.sound ? "tắt âm thanh" : "bật âm thanh"}
          onClick={p.onSound}
          active={p.sound}
        >
          {p.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </IconButton>
        <IconButton
          label={p.cat ? "ẩn Umaru" : "hiện Umaru"}
          onClick={p.onCat}
          active={p.cat}
        >
          <Cat size={18} />
        </IconButton>
        <IconButton label={THEME_LABEL[p.theme]} onClick={p.onTheme}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={p.theme}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              <ThemeIcon size={18} />
            </motion.span>
          </AnimatePresence>
        </IconButton>
      </div>
    </header>
  );
}
