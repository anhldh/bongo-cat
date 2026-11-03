import { motion } from "motion/react";
import { ScanSearch } from "lucide-react";

/** Chỗ giữ cho tính năng 2 (kiểm tra bàn phím). */
export function KeyboardTesterSoon() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl bg-panel px-8 py-12 text-center"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-main/15 text-main">
        <ScanSearch size={28} />
      </span>
      <h2 className="text-xl font-medium">kiểm tra bàn phím</h2>
      <p className="text-sm text-sub">
        Bấm từng phím để xem phím nào còn nhận, phím nào chết. Tính năng này
        đang được làm.
      </p>
    </motion.div>
  );
}
