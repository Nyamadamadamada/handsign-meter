import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Stack } from '@chakra-ui/react';
import { webComUtils } from '@/utils';

export default function HandWebcamDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null); // Webカメラの映像
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 推論結果（手のランドマークなど）を描画
  const landmarkerRef = useRef<any>(null); // 推論モデル（HandLandmarker）のインスタンス

  const rafRef = useRef<number | null>(null); // ループ用の requestAnimationFrame ID
  const [isRunning, setIsRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const runningModeRef = useRef<'IMAGE' | 'VIDEO'>('IMAGE');

  // HandLandmarker の読み込み
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 初回は IMAGE モードのみ可能
        const lm = await webComUtils.loadHandLandmarker('IMAGE');
        if (mounted) {
          landmarkerRef.current = lm;
          setReady(true);
        }
      } catch (e) {
        console.error('Failed to load HandLandmarker', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // videoがON時のループ処理
  const predict = () => {
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
    if (results?.landmarks?.length) {
      console.log(results.landmarks);
      webComUtils.drawHands(ctx, results.landmarks);
    }
    ctx.restore();

    rafRef.current = requestAnimationFrame(predict);
  };

  // isRunning=true(ループ開始時)の effect
  useEffect(() => {
    if (!isRunning) return;
    rafRef.current = requestAnimationFrame(predict);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, predict]);

  // アンマウント時の最終クリーンアップも追加
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        landmarkerRef.current?.close?.();
      } catch {}
      if (videoRef.current) {
        try {
          webComUtils.stopStreamedVideo(videoRef.current);
        } catch {}
      }
    };
  }, []);

  // video再生開始
  const handleOnCamera = async () => {
    if (!webComUtils.hasGetUserMedia() || !ready) return;
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // 1) ストリームを取得して video にセット
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      video.srcObject = mediaStream;

      // 2) メタデータ（＝解像度）が読まれるのを待つ
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video.addEventListener('loadedmetadata', onLoaded);
      });

      // 3) 再生開始
      await video.play();

      // 4) canvas の描画解像度・見た目サイズを video に合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = `${video.videoWidth}px`;
      canvas.style.height = `${video.videoHeight}px`;

      // 5) 検出器をVIDEOモードに戻す
      if (runningModeRef.current === 'IMAGE') {
        console.log('VIDEOモードに変更');
        runningModeRef.current = 'VIDEO';
        await landmarkerRef.current.setOptions({ runningMode: 'VIDEO' });
      }

      // ループ開始
      setIsRunning(true);
    } catch (e) {
      console.error('Failed to start webcam', e);
      setIsRunning(false);
    }
  };

  // 停止処理
  const handleOffCamera = async () => {
    setIsRunning(false);
    // 1) アニメーションループ停止
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // 2) video停止 & ストリーム解放
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        webComUtils.stopStreamedVideo(videoRef.current);
      } catch (e) {
        console.error('Failed to stop webcam', e);
      }
    }
    // 3) 検出器をIMAGEモードに戻す
    if (runningModeRef.current === 'VIDEO') {
      runningModeRef.current = 'IMAGE';
      await landmarkerRef.current.setOptions({ runningMode: 'IMAGE' });
    }
  };

  return (
    <Stack spaceY={4} alignItems="center">
      {isRunning ? (
        <Button onClick={handleOffCamera}>終了</Button>
      ) : (
        <Button disabled={!ready} onClick={handleOnCamera}>
          {ready ? 'カメラオンで推論開始' : 'モデル読み込み中...'}
        </Button>
      )}

      <Stack position={'relative'}>
        <video ref={videoRef} id="webcam" autoPlay playsInline muted />
        <canvas ref={canvasRef} id="output_canvas" />
      </Stack>
    </Stack>
  );
}
