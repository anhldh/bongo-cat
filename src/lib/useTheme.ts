import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";

const KEY = "theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function readPref(): ThemePref {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref) {
  const resolved =
    pref === "system" ? (media().matches ? "dark" : "light") : pref;
  document.documentElement.dataset.theme = resolved;
}

/**
 * Theme sáng/tối/theo hệ thống. Script trong index.html đã đặt sẵn data-theme
 * trước lần vẽ đầu, hook này chỉ lo đổi về sau.
 *
 * Lưu kiểu chuỗi trơn (không JSON) để script inline đọc được ngay.
 */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref);

  useEffect(() => {
    apply(pref);
    try {
      if (pref === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, pref);
    } catch {
      /* bỏ qua */
    }
    if (pref !== "system") return;
    const m = media();
    const onChange = () => apply("system");
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [pref]);

  const cycle = () =>
    setPref((p) => (p === "dark" ? "light" : p === "light" ? "system" : "dark"));

  return { pref, setPref, cycle };
}
