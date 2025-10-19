import { useEffect, useRef, useState } from 'react';
import { webComUtils } from '@/utils';

type UseHandLandmarkerType = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
};
/**
 *  手の推論モデルのロードとインスタンス管理
 * @returns コンポーネントで使う値と関数のオブジェクト
 */
export function useHandLandmarker({ canvasRef }: UseHandLandmarkerType) {
  const landmarkerRef = useRef<any>(null);
  const runningModeRef = useRef<'IMAGE' | 'VIDEO'>('IMAGE');
  const [ready, setReady] = useState(false);

  // モデルのロード
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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

  // モデル読み込み後にウォームアップ推論を実行しておく
  useEffect(() => {
    if (!ready || canvasRef.current === null) return;
    webComUtils.warmUpHandLandmarker(landmarkerRef.current, canvasRef.current);
  }, [ready]);

  // アンマウント時の最終クリーンアップ
  useEffect(() => {
    return () => {
      try {
        landmarkerRef.current?.close?.();
      } catch (e) {
        console.error('Failed to close HandLandmarker:', e);
      }
    };
  }, []);

  // 推論モード切替（画像or映像）
  const changeRunningMode = async (mode: 'IMAGE' | 'VIDEO') => {
    if (runningModeRef.current === mode) return;
    if (!landmarkerRef.current) return;

    try {
      runningModeRef.current = mode;
      await landmarkerRef.current.setOptions({ runningMode: mode });
    } catch (e) {
      console.error('Failed to set running mode:', e);
    }
  };

  return { landmarkerRef, ready, changeRunningMode };
}
