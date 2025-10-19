import { Flex, Button, HStack, Text, Icon } from '@chakra-ui/react';
import { RefreshCcw } from 'lucide-react';

const ContrrolBar = ({
  postCode,
  reset,
}: {
  postCode: [number, number, number, number, number, number, number];
  reset: () => void;
}) => {
  return (
    <Flex mt="14px" w="full" align="center" justify="space-between">
      <Button variant="ghost" onClick={reset}>
        <Icon as={RefreshCcw} />
        reset
      </Button>

      <HStack spaceX={2} fontFamily="mono" fontSize="lg">
        <Text opacity={0.7}>現在の推定:</Text>
        <Text as="span" fontWeight="bold">
          {postCode.join('')}
        </Text>
      </HStack>
    </Flex>
  );
};

export default ContrrolBar;
