export type MetadataType = { scalerMean: number[]; scalerScale: number[]; labels: { [key: string]: string } };

export type StepType = 'IDLE' | 'STEP1' | 'STEP2' | 'STEP3' | 'FINISH';

export type TodayModeType = '1' | '2' | '3' | '4' | '5';
