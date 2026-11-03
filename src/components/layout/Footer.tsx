import clsx from "clsx";

export function Footer({ dimmed }: { dimmed: boolean }) {
  return (
    <footer
      className={clsx(
        "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-6 text-xs text-sub transition-opacity duration-300 sm:px-8",
        dimmed && "opacity-0",
      )}
    >
      <span>
        <kbd className="kbd">tab</kbd> bài mới
      </span>
      <span>
        <kbd className="kbd">ctrl</kbd> + <kbd className="kbd">backspace</kbd>{" "}
        xoá cả từ
      </span>
      <span>
        <kbd className="kbd">space</kbd> sang từ kế
      </span>
    </footer>
  );
}
