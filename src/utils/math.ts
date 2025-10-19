import { Tensor } from 'onnxruntime-web';

export function softmax(arr: number[]): any {
  const C = Math.max(...arr);
  const d = arr.map((y) => Math.exp(y - C)).reduce((a, b) => a + b);
  return arr.map((value) => {
    return Math.exp(value - C) / d;
  });
}

// 結果の後処理（活性化関数）
export const postprocess = (rawOutput: Tensor): Float32Array => {
  return softmax(Array.prototype.slice.call(rawOutput.data));
};
