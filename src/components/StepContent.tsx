import { Stack, Image, Text } from '@chakra-ui/react';
import { StepType, TodayModeType } from '@/type';

type Props = {
  step: StepType;
  todayMode: TodayModeType | null;
};

const StepContent = ({ step, todayMode }: Props) => {
  // step0: idle
  // step1: isRunningがtrueでSTEP1に切り替わる。「今日の気分を５段階で表してね。5が最も調子が良いよ」というテキストがcanvasに表示される
  // step2: グッジョブ後でSTEP２に切り替わる。「今日の気分を５段階で表してね。5が最も調子が良いよ」というテキストがcanvasに表示される
  // step3: ハンドサインを検知後、クッキーに保存。今日の気分を記録しました（finish）
  console.log('StepContentのステップ', step);
  if (step === 'IDLE' || step === 'FINISH') return <></>;

  return (
    <Stack className="overlay" display={'flex'}>
      {step === 'STEP1' && (
        <>
          <Text>準備ができたらグッジョブを出して!</Text>
          <Image className="pop-once" width="1/2" marginTop={'10%'} src="img/ok_icon.png" alt="グッジョブアイコン" />
        </>
      )}
      {step === 'STEP2' && (
        <>
          <Text>今日の気分を5本指で教えてね。</Text>
          <Text>「5」が「最も調子がいい」だよ。</Text>
        </>
      )}
      {step === 'STEP3' && (
        <>
          <Text lineHeight={'0.8'}>
            今日の気分は
            <Text as="span" fontSize={'4xl'} lineHeight={'0.8'} paddingX={'1'}>
              {todayMode}
            </Text>
            かな？
          </Text>
          <Text>推論が正しかったら、カメラを終了してね。（Escキー）</Text>
        </>
      )}
    </Stack>
  );
};

export default StepContent;
