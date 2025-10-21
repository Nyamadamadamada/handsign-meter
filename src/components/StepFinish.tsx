import { Stack, Image, Text } from '@chakra-ui/react';
import { StepType, TodayModeType } from '@/type';

type Props = {
  todayMode: TodayModeType | null;
};

const StepFinish = ({ todayMode }: Props) => {
  if (!todayMode) return <></>;

  return (
    <Stack className="" display={'flex'}>
      <Text lineHeight={'0.8'}>
        今日の気分は
        <Text as="span" fontSize={'4xl'} lineHeight={'0.8'} paddingX={'1'}>
          {todayMode}
        </Text>
        です。
      </Text>
      <Text>良い１日を！</Text>
    </Stack>
  );
};

export default StepFinish;
