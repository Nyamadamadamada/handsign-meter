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

// 画像の前処理
// 28x28のグレースケールに変換（MNISTは1x28x28、NCHW）
export const preprocess = (ctx: CanvasRenderingContext2D, sctx: CanvasRenderingContext2D): Tensor => {
  const srcCanvas = ctx.canvas as HTMLCanvasElement;

  // 白でクリアしてから元キャンバスを 28x28 に縮小描画
  sctx.save();
  sctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, 28, 28);
  sctx.restore();

  // 画素を取得
  const imageData = sctx.getImageData(0, 0, 28, 28);
  const { data } = imageData; // RGBA RGBA ...

  // MNIST: 1x28x28 (NCHW)
  const input = new Float32Array(28 * 28);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    // グレースケール（単純平均でもOKだが一応加重平均にしておく）
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b; // 0..255

    // 0..1 正規化 & 反転（白背景/黒文字 → 黒背景/白文字）
    input[j] = 1 - gray / 255;
  }

  return new Tensor('float32', input, [1, 1, 28, 28]);
};
