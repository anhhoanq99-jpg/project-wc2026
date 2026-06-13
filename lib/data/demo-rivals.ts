/**
 * Đối thủ DEMO (ảo) để bảng xếp hạng có không khí thi đua.
 * Đây là người chơi giả lập — bảng xếp hạng nhiều người THẬT cần máy chủ (làm sau).
 */
export interface RivalScore {
  name: string;
  points: number;
  bot: true;
}

// Số dư điểm (bắt đầu 500). Cao = đoán giỏi, thấp = đặt bừa thua lỗ.
export const DEMO_RIVALS: RivalScore[] = [
  { name: "Trùm Soi Kèo", points: 920, bot: true },
  { name: "Cao Thủ Dự Đoán", points: 845, bot: true },
  { name: "Fan Cuồng Bóng Đá", points: 712, bot: true },
  { name: "Nhà Tiên Tri", points: 638, bot: true },
  { name: "Bình Luận Viên Vỉa Hè", points: 560, bot: true },
  { name: "Đội Trưởng Phán", points: 470, bot: true },
  { name: "Vua Tài Xỉu", points: 388, bot: true },
  { name: "Người Mới Tập Đoán", points: 305, bot: true },
];
