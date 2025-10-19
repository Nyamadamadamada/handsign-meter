import { HStack, Text } from '@chakra-ui/react';

const NoAddressFound = () => {
  return (
    <HStack marginTop={10} spaceX={2} fontFamily="mono" fontSize="lg">
      <Text opacity={0.9}>該当する住所が見つかりませんでした。</Text>
    </HStack>
  );
};

export default NoAddressFound;
