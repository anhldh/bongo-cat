import asyncio

import psutil
from bleak import BleakClient, BleakScanner

try:
    import pynvml

    pynvml.nvmlInit()
    HAS_NVIDIA = True
except Exception as e:
    print(f"[WARN] Khong dung duoc NVML: {e!r}")
    HAS_NVIDIA = False

DEVICE_NAME = "PC-MONITOR"
CHAR_UUID = "6e5f0002-b5a3-f393-e0a9-e50e24dcca9e"

# Dien MAC vao day de bo qua buoc quet (~2s moi lan ket noi).
# Xem MAC o log khoi dong cua ESP: [BLE] Dang quang cao ten "PC-MONITOR", MAC ...
ESP_ADDRESS = None

SEND_INTERVAL = 5.0
SCAN_TIMEOUT = 10.0
GB = 1024 ** 3


def get_cpu_temp():
    try:
        temps = psutil.sensors_temperatures()
        for key in ("coretemp", "k10temp", "cpu_thermal"):
            if key in temps and temps[key]:
                return temps[key][0].current
        for entries in temps.values():
            if entries:
                return entries[0].current
    except Exception as e:
        print(f"[WARN] Doc nhiet do CPU loi: {e!r}")
    return 0.0


def get_gpu_stats():
    if not HAS_NVIDIA:
        return None
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
        try:
            power = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0
        except pynvml.NVMLError:
            power = 0.0
        return {
            "util": pynvml.nvmlDeviceGetUtilizationRates(handle).gpu,
            "temp": pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU),
            "power": power,
            "vram_used": mem.used / GB,
            "vram_total": mem.total / GB,
        }
    except Exception as e:
        print(f"[WARN] Doc GPU loi: {e!r}")
        return None


def collect():
    mem = psutil.virtual_memory()
    return {
        # interval=None -> khong block; tra ve trung binh ke tu lan goi truoc,
        # tuc dung bang chu ky 5s cua vong lap
        "cpu": psutil.cpu_percent(interval=None),
        "cpu_temp": get_cpu_temp(),
        "ram_used": mem.used / GB,
        "ram_total": mem.total / GB,
        "gpu": get_gpu_stats(),
    }


def to_wire(d):
    """key=value ngan cach bang dau ; -- ESP tu quyet dinh hien thi the nao."""
    parts = [
        f"cpu={d['cpu']:.0f}",
        f"ct={d['cpu_temp']:.0f}",
        f"ram={d['ram_used']:.1f}",
        f"ramt={d['ram_total']:.0f}",
    ]
    g = d["gpu"]
    if g:
        parts += [
            f"gpu={g['util']}",
            f"gt={g['temp']}",
            f"gw={g['power']:.0f}",
            f"vr={g['vram_used']:.1f}",
            f"vrt={g['vram_total']:.0f}",
        ]
    return ";".join(parts)


def to_human(d):
    line = (f"CPU:{d['cpu']:.0f}% {d['cpu_temp']:.0f}C | "
            f"RAM:{d['ram_used']:.1f}/{d['ram_total']:.0f}G")
    g = d["gpu"]
    if g:
        line += (f" | GPU:{g['util']}% {g['temp']}C {g['power']:.0f}W "
                 f"VRAM:{g['vram_used']:.1f}/{g['vram_total']:.0f}G")
    return line


async def find_device():
    if ESP_ADDRESS:
        return ESP_ADDRESS
    print(f"[SCAN] Dang tim '{DEVICE_NAME}'...")
    dev = await BleakScanner.find_device_by_name(DEVICE_NAME, timeout=SCAN_TIMEOUT)
    if dev is None:
        return None
    print(f"[SCAN] Thay tai {dev.address}")
    return dev


async def run_session(target):
    disconnected = asyncio.Event()

    def on_disconnect(_):
        print("[LOST] ESP32 ngat ket noi")
        disconnected.set()

    async with BleakClient(target, disconnected_callback=on_disconnect) as client:
        print(f"-> Da ket noi | NVIDIA NVML: {'OK' if HAS_NVIDIA else 'KHONG CO'}\n")
        psutil.cpu_percent(interval=None)  # lan doc dau tien luon tra ve 0.0

        while not disconnected.is_set():
            data = collect()
            await client.write_gatt_char(CHAR_UUID, to_wire(data).encode(), response=True)
            print(f"[PC Sent]: {to_human(data)}")

            try:
                await asyncio.wait_for(disconnected.wait(), timeout=SEND_INTERVAL)
            except asyncio.TimeoutError:
                pass  # het 5s ma van con ket noi -> gui tiep


async def main():
    while True:
        try:
            target = await find_device()
            if target is None:
                print("[WAIT] Chua thay ESP32. Kiem tra no da bat nguon chua...")
                await asyncio.sleep(3)
                continue
            await run_session(target)
        except Exception as e:
            print(f"[ERR] {e!r} -> thu lai sau 3s")
        await asyncio.sleep(3)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDa dung chuong trinh!")