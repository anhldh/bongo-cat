/**
 * Danh sách từ và bộ sinh đề. Chỉ dùng từ thông dụng, viết thường, NFC.
 */

export type Lang = "en" | "vi";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "english" },
  { id: "vi", label: "tiếng việt" },
];

const EN = `the be of and a to in he have it that for they with as not on she at by
this we you do but from or which one would all will there say who make when can
more if no man out other so what time up go about than into could state only new
year some take come these know see use get like then first any work now may such
give over think most even find day also after way many must look before great
back through long where much should well people down own just because good each
those feel seem how high too place little world very still nation hand old life
tell write become here show house both between need mean call develop under last
right move thing general school never same another begin while number part turn
real leave might want point form off child few small since against ask late home
interest large person end open public follow during present without again hold
govern around possible head consider word program problem however lead system set
order eye plan run keep face fact group play stand increase early course change
help line city put close case force meet once water upon war build hear light
unite live every country bring center let side try provide continue name certain
power pay result question study woman member until far night always service away
report something company week church toward start social room figure nature though
young less enough almost read include president nothing yet better big boy cost
business value second why clear expect family complete act sense mind experience
art next near direct car law industry important girl god several matter usual rather
per often kind among white reason action return foot care simple within love human
along appear doctor believe speak active student month drive concern best door hope
example inform body ever least probable understand reach effect different idea whole
control condition field pass fall note special talk particular today measure walk
team sort area`
  .split(/\s+/)
  .filter(Boolean);

const VI = `và của có là không người một những được cho trong này đã với các để
khi đến từ ra nhưng thì cũng như làm đi về lại năm nhiều còn sẽ việc nói theo
ngày đó nước sau phải biết thể vào mình rất chúng tôi họ anh em chị ông bà con
nhà học sinh viên trường thầy cô bạn bè gia đình yêu thương cuộc sống thời gian
hôm nay ngày mai tuần tháng sáng trưa chiều tối đêm mưa nắng gió mây trời đất
biển sông núi rừng cây hoa lá xanh đỏ vàng trắng đen tím hồng mới cũ lớn nhỏ cao
thấp dài ngắn nhanh chậm vui buồn đẹp xấu tốt hay giỏi khó dễ nóng lạnh ấm mát
ăn uống ngủ chơi đọc viết nghe nhìn thấy nghĩ hiểu nhớ quên đứng ngồi chạy nhảy
bàn ghế cửa sổ phòng xe đường phố chợ quán cơm nước trà sữa bánh mì phở bún
máy tính bàn phím chuột màn hình điện thoại mạng công nghệ phần mềm dữ liệu
mèo chó cá chim gà vịt trâu bò heo thỏ ngựa voi khỉ hổ gấu
một hai ba bốn năm sáu bảy tám chín mười trăm nghìn triệu
đâu nào sao gì ai bao giờ tại vì nên nếu thế đây kia ấy rồi vẫn đang chỉ mỗi
cả hết thêm nữa luôn vừa mới đúng sai thật giả dần ngay sớm muộn lâu xa gần
tiếng việt nam hà nội sài gòn quê hương đất nước bình minh hoàng hôn
câu chuyện bài hát âm nhạc bức tranh trang sách lời nói ước mơ niềm vui`
  .normalize("NFC")
  .split(/\s+/)
  .filter(Boolean);

const LISTS: Record<Lang, string[]> = { en: EN, vi: VI };

export type GenOptions = {
  lang: Lang;
  punctuation: boolean;
  numbers: boolean;
};

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: readonly T[]) => a[rand(a.length)];
const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * Sinh `count` từ nối tiếp sau `prev` (để viết hoa / không lặp đúng chỗ khi
 * chế độ thời gian nối thêm từ giữa chừng).
 */
export function generateWords(
  count: number,
  opts: GenOptions,
  prev: readonly string[] = [],
  /** true khi đây là toàn bộ đề (chế độ số từ) -> kết thúc bằng dấu chấm. */
  finalize = false,
): string[] {
  const list = LISTS[opts.lang];
  const out: string[] = [];
  let last = prev.at(-1) ?? "";
  // đầu đề, hoặc từ trước kết thúc câu -> viết hoa
  let sentenceStart = prev.length === 0 || /[.!?]$/.test(last);

  for (let i = 0; i < count; i++) {
    let w: string;
    if (opts.numbers && Math.random() < 0.1) {
      w = String(rand(10 ** (1 + rand(4))));
    } else {
      // tránh hai từ giống nhau đứng liền nhau
      do w = pick(list);
      while (w === last.toLowerCase().replace(/[^\p{L}]/gu, "") && list.length > 1);
    }

    if (opts.punctuation) {
      if (sentenceStart) w = capitalize(w);
      const r = Math.random();
      if (r < 0.09) w += ",";
      else if (r < 0.15) w += ".";
      else if (r < 0.17) w += "?";
      else if (r < 0.19) w += "!";
      else if (r < 0.205) w += ";";
      else if (r < 0.22) w += ":";
      else if (r < 0.24) w = `"${w}"`;
      else if (r < 0.255) w = `(${w})`;
      else if (r < 0.265 && opts.lang === "en") w += "'s";
      else if (r < 0.28) w = `${w}-${pick(list)}`;
    }

    out.push(w);
    last = w;
    sentenceStart = opts.punctuation && /[.!?]["')]?$/.test(w);
  }

  // câu cuối có dấu chấm cho trọn vẹn
  if (finalize && opts.punctuation && out.length) {
    const end = out[out.length - 1].replace(/[,;:-]$/, "");
    out[out.length - 1] = /[.!?]["')]?$/.test(end) ? end : end + ".";
  }
  return out;
}
