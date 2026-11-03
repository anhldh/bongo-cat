import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { CatView } from "./CatView";

const TUNE = new URLSearchParams(window.location.search).has("tune");
const TunedCat = lazy(() => import("./TunedCat"));

type Props = {
  visible: boolean;
  sound: boolean;
  onHide: () => void;
};

/** Umaru ngồi gõ ở góc phải dưới, nhại theo bàn phím + chuột thật. */
export function CornerCat({ visible, sound, onHide }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="group pointer-events-none fixed right-0 bottom-0 z-20 hidden w-[clamp(200px,21vw,320px)] sm:block"
          aria-label="Umaru"
        >
          <button
            type="button"
            onClick={onHide}
            onMouseDown={(e) => e.preventDefault()}
            title="ẩn Umaru"
            aria-label="ẩn Umaru"
            className="pointer-events-auto absolute top-[18%] right-3 z-10 grid size-7 place-items-center rounded-full bg-panel/90 text-sub opacity-0 shadow-sm ring-1 ring-line backdrop-blur transition-opacity group-hover:opacity-100 hover:text-text focus-visible:opacity-100"
          >
            <X size={14} />
          </button>
          {/* group-hover cần sự kiện chuột ở chính khung -> bật lại ở lớp trong */}
          {/* mép trái ảnh bị cắt cứng -> làm mờ dần cho hoà vào nền */}
          <div className="pointer-events-auto [mask-image:linear-gradient(to_right,transparent,black_22%)]">
            {TUNE ? (
              <Suspense fallback={null}>
                <TunedCat sound={sound} />
              </Suspense>
            ) : (
              <CatView sound={sound} />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
