import { useTuning } from "../../useTuning";
import { CatView } from "./CatView";

/**
 * Bản có bảng leva để canh lại tay. Chỉ nạp khi mở trang với ?tune, để leva
 * không chui vào bundle chính.
 */
export default function TunedCat({ sound }: { sound: boolean }) {
  const { tuning, freezeMouse } = useTuning();
  return <CatView sound={sound} tuning={tuning} freezeMouse={freezeMouse} />;
}
