/**
 * SF-260H 外壳与内腔共用尺寸。
 * 门在 +Z；内部结构必须落在 inner* 范围内，避免穿出护罩。
 */
export const SF260_SHELL = {
  W: 416,
  D: 360,
  /** 原上段高度（屋顶相对旧 y0）；地板会再向下延伸 */
  upperH: 318,
  R: 14,
  skin: 8,
  /** 门口内侧安全距离（相对 zFace） */
  doorKeepOut: 52,
  /** 后墙内侧安全距离 */
  rearKeepOut: 30,
  /** 侧墙内侧安全距离 */
  sideKeepOut: 28,
  /**
   * 地板相对 baseTopY 再下沉，包住床身/摇篮底座
   * （摇篮底部约在 tableTopY-59 ≈ baseTopY-37）
   */
  floorDrop: 52,
} as const;

export type Sf260InnerBounds = {
  y0: number;
  yTop: number;
  zFace: number;
  halfW: number;
  halfD: number;
  /** 内腔 X 半宽 */
  xClear: number;
  /** 内腔前壁（最大 +Z，门口内侧） */
  zFront: number;
  /** 内腔后壁（最小 -Z） */
  zRear: number;
  innerW: number;
  innerD: number;
  /** 床身建议尺寸（含余量） */
  bedW: number;
  bedD: number;
  /** 结构中心相对机床原点的 Z（偏后，离开门口） */
  structZ: number;
};

export function sf260InnerBounds(baseTopY: number): Sf260InnerBounds {
  const { W, D, upperH, skin, doorKeepOut, rearKeepOut, sideKeepOut, floorDrop } =
    SF260_SHELL;
  const halfW = W / 2;
  const halfD = D / 2;
  const zFace = halfD;
  const yTop = baseTopY - 4 + upperH;
  const y0 = baseTopY - floorDrop;
  const xClear = halfW - skin - sideKeepOut;
  const zFront = zFace - doorKeepOut;
  const zRear = -halfD + rearKeepOut;
  const innerW = xClear * 2;
  const innerD = zFront - zRear;
  const bedW = innerW - 24;
  const bedD = innerD - 20;
  const structZ = (zFront + zRear) / 2;
  return {
    y0,
    yTop,
    zFace,
    halfW,
    halfD,
    xClear,
    zFront,
    zRear,
    innerW,
    innerD,
    bedW,
    bedD,
    structZ,
  };
}
