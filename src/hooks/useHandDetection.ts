import { useCallback, useEffect, useRef, useState } from 'react';
import { mathUtils, runModelUtils, webComUtils } from '@/utils';
import { MetadataType, StepType, TodayModeType } from '@/type';
import { preprocessFromLandmarks } from '@/utils/handsign';
import { InferenceSession } from 'onnxruntime-web';

type UseHandDetectionType = {
  landmarkerRef: React.MutableRefObject<any>;
  ready: boolean;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  handsignModelRef: React.MutableRefObject<InferenceSession | null>;
  metaDataRef: React.MutableRefObject<MetadataType | null>;
  changeRunningMode: (mode: 'IMAGE' | 'VIDEO') => Promise<void>;
  step: StepType;
  setStep: React.Dispatch<React.SetStateAction<StepType>>;
  todayMode: TodayModeType | null;
  setTodayMode: React.Dispatch<React.SetStateAction<TodayModeType | null>>;
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
  step,
  setStep,
  todayMode,
  setTodayMode,
}: UseHandDetectionType) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  // ハンドサイン推論結果に基づく処理
  const handsignStep = useCallback(
    (predictedClass: string) => {
      setStep((prev) => {
        // OKサイン検知でステップ２へ
        if (prev === 'STEP1' && predictedClass === 'peace') {
          return 'STEP2';
        }

        // 今日の気分を５段階評価で判定
        if ((prev === 'STEP2' || prev === 'STEP3') && predictedClass === 'peace') {
          setTodayMode('5');
          return 'STEP3';
        }
        if ((prev === 'STEP2' || prev === 'STEP3') && predictedClass === 'other') {
          setTodayMode('1');
          return 'STEP3';
        }

        return prev; // 変更なし
      });
    },
    [setStep, setTodayMode]
  );

  // videoがON時のループ処理
  const predict = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    // 必要な要素が揃っていなければ抜ける
    if (!video || !canvas || !lm) return;

    // 再生できる状態でなければ抜ける
    if (!isRunning || video.paused || video.ended || video.readyState < 2) return;

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
      // 推論結果に基づくステップ処理
      handsignStep(predictedClass);
    }
    ctx.restore();

    rafRef.current = requestAnimationFrame(predict);
  }, [isRunning, handsignStep]);

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

      setIsRunning(true);
      setStep('STEP1');
      await changeRunningMode('VIDEO');
    } catch (e) {
      console.error('Failed to start webcam', e);
      setIsRunning(false);
    }
  }, [ready, setStep]); // ready が true になることを期待するため

  // カメラ停止処理
  const handleOffCamera = useCallback(async () => {
    // 推論前なら「IDLE」、推論後なら「FINISH」
    setStep(todayMode ? 'FINISH' : 'IDLE');
    setIsRunning(false);

    // canvasクリア
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // アニメーションフレームを止める
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // ビデオストリームを停止
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        webComUtils.stopStreamedVideo(videoRef.current);
      } catch (e) {
        console.error('Failed to stop webcam:', e);
      }
    }
    // 手の骨格モデルを画像モードに戻す
    // await changeRunningMode('IMAGE');
  }, [todayMode]);

  // エスケープキーでもカメラ停止
  useEffect(() => {
    const handleEscape = (event: { key: string }) => {
      if (isRunning && event.key === 'Escape') {
        handleOffCamera();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isRunning, todayMode, setStep]);

  return {
    videoRef,
    canvasRef,
    isRunning,
    handleOnCamera,
    handleOffCamera,
  };
}
