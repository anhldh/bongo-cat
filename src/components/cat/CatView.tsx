import { useBongo } from "../../hooks/useBongo";
import { useMouse } from "../../hooks/useMouse";
import type { Tuning } from "../../tuning";
import { BongoCat } from "./BongoCat";

type Props = {
  sound: boolean;
  tuning?: Tuning;
  freezeMouse?: boolean;
};

/** BongoCat đã nối sẵn bàn phím + chuột toàn trang. */
export function CatView({ sound, tuning, freezeMouse = false }: Props) {
  const { pressed, hand } = useBongo(sound);
  const mouse = useMouse({ track: !freezeMouse, sound });
  return (
    <BongoCat
      pressed={pressed}
      hand={hand}
      mouse={mouse}
      tuning={tuning}
      style={{ width: "100%" }}
    />
  );
}
