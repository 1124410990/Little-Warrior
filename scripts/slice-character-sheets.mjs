import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolve(rootDir, 'assets/textures/characters');
const outputDir = resolve(rootDir, 'assets/resources/textures/characters');

const BG_SATURATION_MAX = 22;
const BG_LIGHTNESS_MIN = 210;
const MIN_FRAME_ALPHA_PIXELS = 1000;
const MIN_FRAME_BOUNDS_AREA = 10000;
const PLAYER_ANCHOR_BOTTOM_RATIO = 0.32;
const PLAYER_ANCHOR_MAX_DEVIATION = 1;
const PLAYER_FRAME_NORMALIZED_CLIPS = new Set([
  'player_attack_1',
  'player_attack_2',
  'player_attack_3',
]);

const SHEETS = [
  { source: 'player_warrior_idle', clip: 'player_idle', frames: 4, group: 'player', scale: 1.04 },
  { source: 'player_warrior_run', clip: 'player_run', frames: 5, group: 'player', sliceMode: 'content-runs' },
  { source: 'player_warrior_attack_1', clip: 'player_attack_1', frames: 4, group: 'player', sliceMode: 'content-runs', bodyHeights: [360, 346, 347, 346] },
  { source: 'player_warrior_attack_2', clip: 'player_attack_2', frames: 4, group: 'player', sliceMode: 'content-runs', bodyHeights: [360, 365, 342, 360] },
  {
    source: 'player_warrior_attack_3',
    clip: 'player_attack_3',
    frames: 5,
    group: 'player',
    slots: [
      { start: 55, end: 366 },
      { start: 394, end: 686 },
      { start: 708, end: 1140 },
      { start: 1175, end: 1585 },
      { start: 1586, end: 1941 },
    ],
    bodyHeights: [326, 318, 275, 324, 267],
    minComponentPixels: 1000,
  },
  { source: 'player_warrior_skill', clip: 'player_skill_slash_wave', frames: 5, group: 'player' },
  { source: 'player_warrior_hit', clip: 'player_hit', frames: 3, group: 'player' },
  { source: 'player_warrior_dead', clip: 'player_dead', frames: 5, group: 'player' },
  { source: 'enemy_slime_idle', clip: 'enemy_idle', frames: 3, group: 'enemy' },
  { source: 'enemy_slime_walk', clip: 'enemy_walk', frames: 4, group: 'enemy' },
  { source: 'enemy_slime_attack', clip: 'enemy_attack', frames: 4, group: 'enemy' },
  { source: 'enemy_slime_hit', clip: 'enemy_hit', frames: 2, group: 'enemy' },
  { source: 'enemy_slime_dead', clip: 'enemy_dead', frames: 4, group: 'enemy' },
];

const groupArgIndex = process.argv.indexOf('--group');
const targetGroup = groupArgIndex >= 0 ? process.argv[groupArgIndex + 1] : null;
const activeSheets = targetGroup ? SHEETS.filter((sheet) => sheet.group === targetGroup) : SHEETS;

if (targetGroup && activeSheets.length === 0) {
  throw new Error(`[slice] Unknown group: ${targetGroup}`);
}

function isBgColor(png, x, y) {
  const i = (png.width * y + x) * 4;
  const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) < BG_SATURATION_MAX && min > BG_LIGHTNESS_MIN;
}

function clearCheckerboardBackground(png) {
  const { width: W, height: H } = png;
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x += 1) {
    stack.push(x, 0, x, H - 1);
  }
  for (let y = 0; y < H; y += 1) {
    stack.push(0, y, W - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const idx = W * y + x;
    if (bg[idx] || !isBgColor(png, x, y)) continue;
    bg[idx] = 1;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  for (let p = 0; p < W * H; p += 1) {
    png.data[p * 4 + 3] = bg[p] ? 0 : 255;
  }
  return bg;
}

function removeGeneratedPngs(dir) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        rmSync(resolve(dir, entry.name), { force: true });
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

function removeOrphanedMetaFiles(dir) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png.meta')) {
        continue;
      }
      const pngPath = resolve(dir, entry.name.replace(/\.meta$/u, ''));
      if (!existsSync(pngPath)) {
        rmSync(resolve(dir, entry.name), { force: true });
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

function alphaAt(png, x, y) {
  return png.data[(png.width * y + x) * 4 + 3];
}

function verticalBounds(png, xStart, xEnd) {
  let top = png.height;
  let bottom = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      if (alphaAt(png, x, y) > 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
    }
  }
  return { top, bottom };
}

function horizontalBounds(png, xStart, xEnd) {
  let left = xEnd + 1;
  let right = xStart - 1;
  for (let x = xStart; x <= xEnd; x += 1) {
    for (let y = 0; y < png.height; y += 1) {
      if (alphaAt(png, x, y) > 0) {
        if (x < left) left = x;
        if (x > right) right = x;
        break;
      }
    }
  }
  return { left, right };
}

function detectHorizontalContentRuns(png) {
  const runs = [];
  let start = -1;

  for (let x = 0; x < png.width; x += 1) {
    let hasAlpha = false;
    for (let y = 0; y < png.height; y += 1) {
      if (alphaAt(png, x, y) > 0) {
        hasAlpha = true;
        break;
      }
    }

    if (hasAlpha && start < 0) {
      start = x;
    }

    if ((!hasAlpha || x === png.width - 1) && start >= 0) {
      runs.push({ start, end: hasAlpha && x === png.width - 1 ? x : x - 1 });
      start = -1;
    }
  }

  return runs;
}

function extractFrames(sheet, png) {
  clearCheckerboardBackground(png);

  const slots = sheet.slots ?? (sheet.sliceMode === 'content-runs'
    ? detectHorizontalContentRuns(png)
    : Array.from({ length: sheet.frames }, (_, index) => ({
      start: Math.round((png.width * index) / sheet.frames),
      end: Math.round((png.width * (index + 1)) / sheet.frames) - 1,
    })));

  if (slots.length !== sheet.frames) {
    throw new Error(`[slice] ${sheet.source}: expected ${sheet.frames} frames, detected ${slots.length}`);
  }

  return slots.map((slot, index) => {
    const slotStart = slot.start;
    const slotEnd = slot.end;
    const h = horizontalBounds(png, slotStart, slotEnd);
    if (h.right < h.left) {
      throw new Error(`[slice] ${sheet.source} frame ${index}: empty frame content`);
    }
    const v = verticalBounds(png, h.left, h.right);
    const frame = { srcX: h.left, srcY: v.top, width: h.right - h.left + 1, height: v.bottom - v.top + 1 };
    validateFrame(sheet, index, png, frame);
    return frame;
  });
}

function countAlphaPixels(png, frame) {
  let count = 0;
  for (let y = frame.srcY; y < frame.srcY + frame.height; y += 1) {
    for (let x = frame.srcX; x < frame.srcX + frame.width; x += 1) {
      if (alphaAt(png, x, y) > 0) {
        count += 1;
      }
    }
  }
  return count;
}

function validateFrame(sheet, index, png, frame) {
  const alphaPixels = countAlphaPixels(png, frame);
  const boundsArea = frame.width * frame.height;
  if (alphaPixels < MIN_FRAME_ALPHA_PIXELS || boundsArea < MIN_FRAME_BOUNDS_AREA) {
    throw new Error(
      `[slice] ${sheet.source} frame ${index}: suspiciously small content `
      + `(alpha=${alphaPixels}, bounds=${frame.width}x${frame.height}, source=${png.width}x${png.height})`,
    );
  }
}

function getFrameAlphaBounds(png, frame) {
  let left = frame.srcX + frame.width;
  let right = frame.srcX - 1;
  let top = frame.srcY + frame.height;
  let bottom = frame.srcY - 1;
  for (let y = frame.srcY; y < frame.srcY + frame.height; y += 1) {
    for (let x = frame.srcX; x < frame.srcX + frame.width; x += 1) {
      if (alphaAt(png, x, y) > 0) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  return { left, right, top, bottom };
}

function medianNumber(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function resolveFrameAnchorX(sheet, png, frame) {
  if (sheet.group !== 'player') {
    return frame.srcX + frame.width / 2;
  }

  const bounds = getFrameAlphaBounds(png, frame);
  const sampleHeight = Math.max(1, Math.round((bounds.bottom - bounds.top + 1) * PLAYER_ANCHOR_BOTTOM_RATIO));
  const sampleTop = Math.max(bounds.top, bounds.bottom - sampleHeight + 1);
  const xs = [];
  for (let y = sampleTop; y <= bounds.bottom; y += 1) {
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      if (alphaAt(png, x, y) > 0) {
        xs.push(x + 0.5);
      }
    }
  }

  return xs.length > 0 ? medianNumber(xs) : frame.srcX + frame.width / 2;
}

function pruneSmallComponents(png, minPixels) {
  if (!minPixels) {
    return;
  }

  const { width, height } = png;
  const seen = new Uint8Array(width * height);
  const toClear = [];
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = width * y + x;
      if (seen[startIndex] || alphaAt(png, x, y) === 0) {
        continue;
      }

      const queue = [[x, y]];
      const pixels = [startIndex];
      seen[startIndex] = 1;
      for (let head = 0; head < queue.length; head += 1) {
        const [cx, cy] = queue[head];
        for (const [dx, dy] of neighbors) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }
          const nextIndex = width * ny + nx;
          if (seen[nextIndex] || alphaAt(png, nx, ny) === 0) {
            continue;
          }
          seen[nextIndex] = 1;
          queue.push([nx, ny]);
          pixels.push(nextIndex);
        }
      }

      if (pixels.length < minPixels) {
        toClear.push(...pixels);
      }
    }
  }

  for (const index of toClear) {
    png.data[index * 4 + 3] = 0;
  }
}

function writeFrame(png, frame, scale, canvasW, canvasH, outPath, anchorX = frame.srcX + frame.width / 2, minComponentPixels = 0) {
  const sw = Math.max(1, Math.round(frame.width * scale));
  const sh = Math.max(1, Math.round(frame.height * scale));
  const out = new PNG({ width: canvasW, height: canvasH });
  out.data.fill(0);
  const anchorInFrame = (anchorX - frame.srcX) * scale;
  const offsetX = Math.round(canvasW / 2 - anchorInFrame);
  const offsetY = canvasH - sh;
  for (let y = 0; y < sh; y += 1) {
    const srcY = frame.srcY + Math.min(frame.height - 1, Math.floor((y * frame.height) / sh));
    for (let x = 0; x < sw; x += 1) {
      const srcX = frame.srcX + Math.min(frame.width - 1, Math.floor((x * frame.width) / sw));
      const srcIdx = (png.width * srcY + srcX) * 4;
      const dstX = offsetX + x;
      const dstY = offsetY + y;
      if (dstX < 0 || dstY < 0 || dstX >= canvasW || dstY >= canvasH) {
        continue;
      }
      const dstIdx = (canvasW * dstY + dstX) * 4;
      const alpha = png.data[srcIdx + 3];
      out.data[dstIdx] = alpha === 0 ? 0 : png.data[srcIdx];
      out.data[dstIdx + 1] = alpha === 0 ? 0 : png.data[srcIdx + 1];
      out.data[dstIdx + 2] = alpha === 0 ? 0 : png.data[srcIdx + 2];
      out.data[dstIdx + 3] = alpha;
    }
  }
  pruneSmallComponents(out, minComponentPixels);
  writeFileSync(outPath, PNG.sync.write(out));
  return { offsetX, offsetY, anchorInFrame };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function resolveFrameScales(item, targetHeight) {
  const scaleAdjustment = item.sheet.scale ?? 1;
  if (item.sheet.group !== 'player' || !PLAYER_FRAME_NORMALIZED_CLIPS.has(item.sheet.clip)) {
    return item.frames.map(() => (targetHeight / item.refHeight) * scaleAdjustment);
  }

  const bodyHeights = item.sheet.bodyHeights;
  return item.frames.map((frame, index) => (targetHeight / (bodyHeights?.[index] ?? frame.height)) * scaleAdjustment);
}

function main() {
  const parsed = [];
  const groupRefs = new Map();

  for (const sheet of activeSheets) {
    const srcPath = resolve(sourceDir, `${sheet.source}.png`);
    const png = PNG.sync.read(readFileSync(srcPath));
    const frames = extractFrames(sheet, png);
    const refHeight = median(frames.map((frame) => frame.height));
    const anchors = frames.map((frame) => resolveFrameAnchorX(sheet, png, frame));
    parsed.push({ sheet, png, frames, refHeight, anchors });

    const refs = groupRefs.get(sheet.group) ?? [];
    refs.push(refHeight);
    groupRefs.set(sheet.group, refs);
    console.log(`[slice] ${sheet.source}: cut ${frames.length} frames OK (expected ${sheet.frames}), ref height ${refHeight}`);
  }

  const groupTarget = new Map();
  for (const [group, refs] of groupRefs) {
    groupTarget.set(group, median(refs));
  }

  const groupCanvas = new Map();
  for (const item of parsed) {
    item.frameScales = resolveFrameScales(item, groupTarget.get(item.sheet.group));
    const canvas = groupCanvas.get(item.sheet.group) ?? { width: 0, height: 0 };
    for (let index = 0; index < item.frames.length; index += 1) {
      const frame = item.frames[index];
      const scale = item.frameScales[index];
      const scaledWidth = frame.width * scale;
      const anchorInFrame = (item.anchors[index] - frame.srcX) * scale;
      const leftSpace = Math.ceil(anchorInFrame);
      const rightSpace = Math.ceil(scaledWidth - anchorInFrame);
      canvas.width = Math.max(canvas.width, leftSpace * 2, rightSpace * 2);
      canvas.height = Math.max(canvas.height, Math.round(frame.height * scale));
    }
    groupCanvas.set(item.sheet.group, canvas);
  }

  let totalFrames = 0;
  for (const { sheet, png, frames, frameScales, anchors } of parsed) {
    const canvas = groupCanvas.get(sheet.group);
    const clipDir = resolve(outputDir, sheet.clip);
    mkdirSync(clipDir, { recursive: true });
    removeGeneratedPngs(clipDir);
    const anchorOutputs = [];
    frames.forEach((frame, index) => {
      const name = String(index).padStart(2, '0');
      const writeResult = writeFrame(
        png,
        frame,
        frameScales[index],
        canvas.width,
        canvas.height,
        resolve(clipDir, `${name}.png`),
        anchors[index],
        sheet.minComponentPixels ?? 0,
      );
      const outputAnchor = writeResult.offsetX + writeResult.anchorInFrame;
      anchorOutputs.push(outputAnchor);
      if (sheet.group === 'player') {
        console.log(
          `[slice] ${sheet.clip}/${name}.png: anchorX=${anchors[index].toFixed(2)} `
          + `offsetX=${writeResult.offsetX} canvas=${canvas.width}x${canvas.height}`,
        );
      }
      totalFrames += 1;
    });
    const scaleSummary = frameScales.every((scale) => Math.abs(scale - frameScales[0]) < 0.0005)
      ? frameScales[0].toFixed(3)
      : frameScales.map((scale) => scale.toFixed(3)).join(',');
    if (sheet.group === 'player' && (sheet.clip === 'player_idle' || sheet.clip === 'player_run')) {
      const target = medianNumber(anchorOutputs);
      const maxDeviation = Math.max(...anchorOutputs.map((anchor) => Math.abs(anchor - target)));
      if (maxDeviation > PLAYER_ANCHOR_MAX_DEVIATION) {
        throw new Error(`[slice] ${sheet.clip}: output anchor deviation ${maxDeviation.toFixed(2)}px exceeds ${PLAYER_ANCHOR_MAX_DEVIATION}px`);
      }
      console.log(`[slice] ${sheet.clip}: output anchor max deviation ${maxDeviation.toFixed(2)}px`);
    }
    console.log(`[slice] ${sheet.clip}: wrote ${frames.length} frames -> scale ${scaleSummary} -> canvas ${canvas.width}x${canvas.height}`);
  }

  for (const sheet of activeSheets) {
    removeOrphanedMetaFiles(resolve(outputDir, sheet.clip));
  }

  const summary = [...groupCanvas.entries()]
    .map(([group, canvas]) => `${group} target ${groupTarget.get(group)} canvas ${canvas.width}x${canvas.height}`)
    .join(', ');
  console.log(`[slice] done: ${totalFrames} frames; ${summary}`);
  console.log('[slice] Next: open the project in Cocos Creator to preview the generated sprite animations.');
}

main();
