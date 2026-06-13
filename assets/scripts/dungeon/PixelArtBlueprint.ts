export type PixelColor = readonly [number, number, number, number?];

export interface PixelPart {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: PixelColor;
}

/*
 * 程序化像素人资源用于快速验证战斗手感，后续替换正式美术时保持节点职责一致即可。
 */
export const PLAYER_PIXEL_PARTS: readonly PixelPart[] = [
  { name: 'Cape', x: -32, y: -34, width: 18, height: 64, color: [92, 39, 62, 255] },
  { name: 'CapeShade', x: -28, y: -42, width: 10, height: 18, color: [56, 28, 48, 255] },
  { name: 'BootLeft', x: -16, y: -48, width: 14, height: 12, color: [45, 35, 55, 255] },
  { name: 'BootRight', x: 4, y: -48, width: 14, height: 12, color: [45, 35, 55, 255] },
  { name: 'LegLeft', x: -14, y: -36, width: 12, height: 22, color: [61, 84, 145, 255] },
  { name: 'LegRight', x: 4, y: -36, width: 12, height: 22, color: [61, 84, 145, 255] },
  { name: 'Body', x: -18, y: -14, width: 40, height: 38, color: [76, 132, 232, 255] },
  { name: 'ArmorPlate', x: -10, y: -8, width: 24, height: 26, color: [173, 194, 214, 255] },
  { name: 'Belt', x: -20, y: -18, width: 42, height: 8, color: [101, 70, 41, 255] },
  { name: 'Head', x: -12, y: 24, width: 28, height: 24, color: [242, 178, 120, 255] },
  { name: 'Hair', x: -16, y: 36, width: 34, height: 12, color: [59, 36, 47, 255] },
  { name: 'Eye', x: 8, y: 28, width: 5, height: 5, color: [31, 30, 38, 255] },
  { name: 'Arm', x: 18, y: -6, width: 12, height: 24, color: [242, 178, 120, 255] },
  { name: 'Sword', x: 24, y: -22, width: 8, height: 70, color: [220, 236, 246, 255] },
  { name: 'SwordCore', x: 27, y: -16, width: 3, height: 58, color: [113, 181, 255, 255] },
  { name: 'SwordGuard', x: 18, y: -14, width: 14, height: 6, color: [230, 177, 66, 255] },
];

/*
 * 训练房怪物使用简化史莱姆蓝图，重点服务碰撞和血条反馈验证。
 */
export const SLIME_PIXEL_PARTS: readonly PixelPart[] = [
  { name: 'Shadow', x: -28, y: -28, width: 56, height: 8, color: [28, 36, 50, 190] },
  { name: 'BodyBottom', x: -32, y: -22, width: 64, height: 28, color: [58, 166, 96, 255] },
  { name: 'BodyMid', x: -26, y: -2, width: 52, height: 26, color: [86, 216, 128, 255] },
  { name: 'BodyTop', x: -18, y: 18, width: 36, height: 10, color: [114, 235, 153, 255] },
  { name: 'Highlight', x: -18, y: 8, width: 14, height: 10, color: [173, 255, 190, 255] },
  { name: 'EyeLeft', x: -14, y: 2, width: 7, height: 9, color: [21, 35, 35, 255] },
  { name: 'EyeRight', x: 8, y: 2, width: 7, height: 9, color: [21, 35, 35, 255] },
  { name: 'Mouth', x: -6, y: -10, width: 12, height: 4, color: [36, 79, 62, 255] },
];

/*
 * 根据像素块反推节点包围尺寸，避免手工维护 UITransform 大小与蓝图内容不一致。
 */
export function getPixelArtBounds(parts: readonly PixelPart[]): { width: number; height: number } {
  const minX = Math.min(...parts.map((part) => part.x));
  const maxX = Math.max(...parts.map((part) => part.x + part.width));
  const minY = Math.min(...parts.map((part) => part.y));
  const maxY = Math.max(...parts.map((part) => part.y + part.height));

  return {
    width: maxX - minX,
    height: maxY - minY,
  };
}
