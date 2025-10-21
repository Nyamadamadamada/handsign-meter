export type MetadataType = { scalerMean: number[]; scalerScale: number[]; labels: { [key: string]: TodayModeType } };

export type StepType = 'IDLE' | 'STEP1' | 'STEP2' | 'STEP3' | 'FINISH';

export type TodayModeType = '1' | '2' | '3' | '4' | '5';

/**
 * 推論結果が TodayModeType のいずれかに一致しているかを判定
 */
export const isTodayModeType = (value: string): value is TodayModeType => {
  return ['1', '2', '3', '4', '5'].includes(value);
};
