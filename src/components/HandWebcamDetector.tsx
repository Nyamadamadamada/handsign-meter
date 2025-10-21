import { Button, Stack } from '@chakra-ui/react';
import { useHandDetection } from '@/hooks/useHandDetection';
import { useHandLandmarker } from '@/hooks/useHandLandmarker';
import { useEffect, useRef, useState } from 'react';
import { runModelUtils } from '@/utils';
import { MetadataType, StepType, TodayModeType } from '@/type';
import { InferenceSession } from 'onnxruntime-web';
import StepContent from './StepContent';
import StepFinish from './StepFinish';

export default function HandWebcamDetector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handsignModelRef = useRef<InferenceSession | null>(null);
  const metaDataRef = useRef<MetadataType | null>(null);
  const [step, setStep] = useState<StepType>('IDLE');
  const [todayMode, setTodayMode] = useState<TodayModeType | null>(null);

  const { landmarkerRef, ready, changeRunningMode } = useHandLandmarker({ canvasRef });
  const { videoRef, isRunning, handleOnCamera, handleOffCamera } = useHandDetection({
    landmarkerRef,
    ready,
    canvasRef,
    handsignModelRef,
    metaDataRef,
    changeRunningMode,
    setStep,
    todayMode,
    setTodayMode,
  });

  // ハンドサインモデルのロード
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
      {!isRunning && step === 'FINISH' && <StepFinish todayMode={todayMode} />}
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
        {isRunning && <StepContent step={step} todayMode={todayMode} />}
      </Stack>
    </Stack>
  );
}
