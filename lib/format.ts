const NF = new Intl.NumberFormat("vi-VN");

/** Định dạng số kèm đơn vị WC, dấu chấm phân cách hàng nghìn (như VNĐ). */
export function fmtWC(n: number): string {
  return `${NF.format(n)} WC`;
}

/** Chỉ số có dấu chấm phân cách, không kèm đơn vị. */
export function fmtNum(n: number): string {
  return NF.format(n);
}

/** Khoản cộng/trừ có dấu +/− và dấu chấm, không kèm đơn vị (cho nhãn gọn). */
export function fmtDeltaShort(n: number): string {
  return `${n < 0 ? "−" : "+"}${NF.format(Math.abs(n))}`;
}

/** Định dạng có dấu +/− ở trước kèm WC. */
export function fmtDelta(n: number): string {
  return `${fmtDeltaShort(n)} WC`;
}
