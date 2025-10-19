import { Button, Stack } from '@chakra-ui/react';
import { useHandDetection } from '@/hooks/useHandDetection';
import { useHandLandmarker } from '@/hooks/useHandLandmarker';
import { useEffect, useRef, useState } from 'react';
import { runModelUtils } from '@/utils';
import { MetadataType } from '@/type';
import { InferenceSession } from 'onnxruntime-web';

export default function HandWebcamDetector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // step0: idle
  // step1: isRunningがtrueでSTEP1に切り替わる。「今日の気分を５段階で表してね。5が最も調子が良いよ」というテキストがcanvasに表示される
  // step3: ハンドサインを検知後、クッキーに保存。今日の気分を記録しました（finish）
  const handsignModelRef = useRef<InferenceSession | null>(null);
  const metaDataRef = useRef<MetadataType | null>(null);
  const [step, setStep] = useState<'IDLE' | 'STEP1' | 'FINISH'>('IDLE');

  const { landmarkerRef, ready, changeRunningMode } = useHandLandmarker({ canvasRef });
  const { videoRef, isRunning, handleOnCamera, handleOffCamera } = useHandDetection({
    landmarkerRef,
    ready,
    canvasRef,
    handsignModelRef,
    metaDataRef,
    changeRunningMode,
  });

  // モデルのロード
  useEffect(() => {
    (async () => {
      try {
        handsignModelRef.current = await runModelUtils.createModel();
        const metadata = await runModelUtils.loadMetadata();
        metaDataRef.current = metadata;
      } catch (e) {
        console.error('Failed to load HandLandmarker', e);
      }
    })();
  }, []);

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
