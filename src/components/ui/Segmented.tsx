import clsx from "clsx";
import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Nút trong thanh cấu hình. Nhóm loại trừ nhau thì truyền `layoutGroup`
 *  để nền chạy theo nút đang chọn. */
export function Opt({
  active,
  onClick,
  children,
  layoutGroup,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  layoutGroup?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      // không cho nút giữ focus, kẻo space/enter lại bấm nút thay vì gõ
      onMouseDown={(e) => e.preventDefault()}
      className={clsx(
        "relative flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors duration-150",
        active ? "text-main" : "text-sub hover:text-text",
      )}
    >
      {active && layoutGroup && (
        <motion.span
          layoutId={layoutGroup}
          className="absolute inset-0 rounded-md bg-main/10"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </button>
  );
}

export const Sep = () => (
  <span className="mx-1 h-4 w-[2px] shrink-0 rounded bg-line" />
);

export function Bar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-y-1 rounded-xl bg-panel px-2 py-1.5 text-[0.8rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}
