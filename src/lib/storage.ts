/**
 * localStorage bọc try/catch: tab ẩn danh, bị chặn cookie... đều có thể ném lỗi.
 * Hỏng thì coi như không có gì, app vẫn chạy bằng giá trị mặc định.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bỏ qua */
  }
}
