import { MetadataType } from '@/type';
import { InferenceSession, Tensor, env } from 'onnxruntime-web';

function init() {
  // env.wasm.simd = false;
  // URL.createObjectURLの抑制のためにシングルスレッドの設定が必須．
  // ref: https://github.com/microsoft/onnxruntime/issues/14445
  env.wasm.numThreads = 1;
}

const MODEL_FILEPATH_DEV = '/handsign-meter/model/model.fp32.onnx';
const GESTURE_META = '/handsign-meter/model/gesture_meta.json';

export async function createModel(): Promise<InferenceSession> {
  init();
  return await InferenceSession.create(MODEL_FILEPATH_DEV, {
    executionProviders: ['webgpu', 'webgl', 'wasm'],
  });
}

// データ標準化用のメタデータ読み込み
export async function loadMetadata(): Promise<MetadataType> {
  const scaler = await fetch(GESTURE_META).then((r) => r.json());
  return {
    scalerMean: scaler.scaler_mean,
    scalerScale: scaler.scaler_scale,
    labels: scaler.labels,
  };
}

export async function runModel(model: InferenceSession, preprocessedData: Tensor): Promise<[Tensor, number]> {
  const start = new Date();
  try {
    const feeds: Record<string, Tensor> = {};
    feeds[model.inputNames[0]] = preprocessedData;
    const outputData = await model.run(feeds);
    const end = new Date();
    const inferenceTime = end.getTime() - start.getTime();
    const output = outputData[model.outputNames[0]];

    return [output, inferenceTime];
  } catch (e) {
    console.error(e);
    throw new Error();
  }
}

/**
 *　確率が最も高いハンドサインを返す
 * @param output 推論結果の確率配列
 * @returns 推論結果のクラス（good,1,2,3,4,5,other）, 予測不能な場合はnullを返す
 */
export const getPredictedClass = (output: Float32Array, labels: { [key: string]: string }): string | null => {
  // すべての要素が0なら予測不能とする
  if (output.reduce((a, b) => a + b, 0) === 0) {
    return null;
  }
  // 順番に比較して最も高い値を返す（速度重視でreduceを使用）
  const index = output.reduce((argmax, n, i) => (n > output[argmax] ? i : argmax), 0);
  return labels[index.toString()];
};
