// features.ts
// MediaPipe 21点のランドマーク標準化（PythonコードのTypeScript移植）

import { Tensor } from 'onnxruntime-web';

export type Handedness = 'Left' | 'Right';
export type Landmark = { x: number; y: number; z: number };

const IDX_WRIST = 0;
const IDX_MID_MCP = 9;
const EPS = 1e-6;

/**
 * lm: MediaPipe 形式のランドマーク配列（長さ21, 各{x,y,z}は[0,1]相対座標）
 * handedness: "Left" | "Right"
 * mean, scale: 標準化パラメータ。スカラーでも63次元ベクトルでもOK
 * 返り値: 63次元ベクトル（Float64の number[]）
 */
export function preprocessFromLandmarks(
  lm: Landmark[],
  handedness: Handedness,
  mean: number[] = [],
  scale: number[] = []
): Tensor {
  if (lm.length !== 21) {
    throw new Error(`Expected 21 landmarks, got ${lm.length}`);
  }
  const pts: number[][] = lm.map((paramter: { x: number; y: number; z: number }) => [
    paramter.x,
    paramter.y,
    paramter.z,
  ]);

  // 1) 幾何正規化（左右統一・原点平行移動・スケール正規化・フラット化）
  const x = normalizeLandmarks(pts, {
    flipIfRight: true,
    handednessLabel: handedness,
  });

  // 2) 標準化 (x - mean) / scale
  return standardizeVector(x, mean, scale);
}

/**
 * Python: normalize_landmarks(lm_xyz, flip_if_right, handedness_label) 相当
 * 入力: 21x3 の配列
 * 出力: 63次元の一次元配列
 */
export function normalizeLandmarks(
  lmXYZ: number[][],
  opts?: { flipIfRight?: boolean; handednessLabel?: Handedness }
): number[] {
  if (lmXYZ.length !== 21) {
    throw new Error(`Expected 21 points, got ${lmXYZ.length}`);
  }
  // 21x3 をコピー
  const pts = lmXYZ.map((row) => row.slice());

  // 左右統一（画像座標系で x を反転）
  if (opts?.flipIfRight && opts.handednessLabel === 'Right') {
    for (let i = 0; i < pts.length; i++) {
      pts[i][0] = 1.0 - pts[i][0];
    }
  }

  // 平行移動除去（手首を原点へ）
  const wrist = pts[IDX_WRIST].slice(); // [x,y,z]
  for (let i = 0; i < pts.length; i++) {
    pts[i][0] -= wrist[0];
    pts[i][1] -= wrist[1];
    pts[i][2] -= wrist[2];
  }

  // スケール正規化（手首→中指MCP 距離）
  const m = pts[IDX_MID_MCP];
  const scale = Math.hypot(m[0], m[1], m[2]) + EPS;
  for (let i = 0; i < pts.length; i++) {
    pts[i][0] /= scale;
    pts[i][1] /= scale;
    pts[i][2] /= scale;
  }

  // 63次元にフラット化
  const flat: number[] = new Array(21 * 3);
  let k = 0;
  for (let i = 0; i < pts.length; i++) {
    flat[k++] = pts[i][0];
    flat[k++] = pts[i][1];
    flat[k++] = pts[i][2];
  }
  return flat;
}

/** (x - mean) / scale をスカラーまたは要素ごとに適用 */
const standardizeVector = (x: number[], mean: number[], scale: number[]): Tensor => {
  const N = x.length;
  const out = new Array<number>(N);

  if (mean.length !== N) {
    throw new Error(`mean is ${mean.length}, length must be ${N}`);
  }
  if (scale.length !== N) {
    throw new Error(`scale is ${scale.length}, length must be ${N}`);
  }
  // 各要素ごとに標準化
  for (let i = 0; i < N; i++) {
    out[i] = (x[i] - mean[i]) / scale[i];
  }
  return new Tensor('float32', out, [1, 63]);
};
