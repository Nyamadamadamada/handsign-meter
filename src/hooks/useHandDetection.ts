import { useCallback, useEffect, useRef, useState } from 'react';
import { mathUtils, runModelUtils, webComUtils } from '@/utils';
import { MetadataType } from '@/type';
import { preprocessFromLandmarks } from '@/utils/handsign';
import { InferenceSession } from 'onnxruntime-web';

type UseHandDetectionType = {
  landmarkerRef: React.MutableRefObject<any>;
  ready: boolean;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  handsignModelRef: React.MutableRefObject<InferenceSession | null>;
  metaDataRef: React.MutableRefObject<MetadataType | null>;
  changeRunningMode: (mode: 'IMAGE' | 'VIDEO') => Promise<void>;
};

/**
 *　手の検出と描画を行うカスタムフック
 *  useHandLandmarkerに依存
 * @returns コンポーネントで使う値と関数のオブジェクト
 */
export function useHandDetection({
  landmarkerRef,
  ready,
  canvasRef,
  handsignModelRef,
  metaDataRef,
  changeRunningMode,
}: UseHandDetectionType) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // videoがON時のループ処理
  const predict = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    if (!video || !canvas || !lm) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ts = performance.now();
    const results = lm.detectForVideo(video, ts);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const metaData = metaDataRef.current;
    const handsignModel = handsignModelRef.current;
    if (results?.landmarks?.length && metaData && handsignModel) {
      // 手のランドマーク描画
      webComUtils.drawHands(ctx, results.landmarks);
      // ハンドサインの推論
      const landmarks = results?.landmarks[0];
      const handedness = results.handedness.categoryName;
      const x63 = preprocessFromLandmarks(landmarks, handedness, metaData.scalerMean, metaData.scalerScale);
      // 推論実行
      const [res, _] = await runModelUtils.runModel(handsignModel, x63);
      const output = mathUtils.postprocess(res);
      const predictedClass = runModelUtils.getPredictedClass(output, metaData.labels);
      console.log('予測結果:', predictedClass);
      if (predictedClass === null) {
        console.log('予測に失敗しました');
        return;
      }
    }
    ctx.restore();

    rafRef.current = requestAnimationFrame(predict);
  }, []);

  // isRunning=true(ループ開始時)の effect
  useEffect(() => {
    if (!isRunning) return;
    rafRef.current = requestAnimationFrame(predict);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, predict]);

  // アンマウント時の最終クリーンアップ
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (videoRef.current) {
        try {
          webComUtils.stopStreamedVideo(videoRef.current);
        } catch (e) {
          console.error('Failed to close useHandDetection:', e);
        }
      }
    };
  }, []);

  // video再生開始
  const handleOnCamera = useCallback(async () => {
    if (!webComUtils.hasGetUserMedia() || !ready) return;
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const mediaStream = await webComUtils.createMediaStream();
      video.srcObject = mediaStream;

      // メタデータの読み込み完了を待つ
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video.addEventListener('loadedmetadata', onLoaded);
      });

      await video.play();
      webComUtils.fitSizeCanvas(canvas, video);

      await changeRunningMode('VIDEO');
      setIsRunning(true);
    } catch (e) {
      console.error('Failed to start webcam', e);
      setIsRunning(false);
    }
  }, [ready]); // ready が true になることを期待するため

  // カメラ停止処理
  const handleOffCamera = useCallback(async () => {
    setIsRunning(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        webComUtils.stopStreamedVideo(videoRef.current);
      } catch (e) {
        console.error('Failed to stop webcam:', e);
      }
    }
    await changeRunningMode('IMAGE');
  }, []);

  return {
    videoRef,
    canvasRef,
    isRunning,
    handleOnCamera,
    handleOffCamera,
  };
}
