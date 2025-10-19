// src/components/AddressResultCard.tsx
import { AddressRow } from '@/type/addresses';
import { Box, HStack, Badge, Text, useClipboard, Button } from '@chakra-ui/react';
import { Copy, MapPin, Check } from 'lucide-react';

type Props = {
  addressHit: AddressRow;
};

const AddressResultCard = ({ addressHit }: Props) => {
  const fullAddress = `${addressHit.prefecture} ${addressHit.city}`;
  const clipboard = useClipboard({ value: fullAddress });

  return (
    <Box
      mt="18px"
      p="16px"
      borderWidth="1px"
      borderRadius="2xl"
      bgGradient="linear(to-br, gray.50, white)"
      _dark={{ bgGradient: 'linear(to-br, gray.800, gray.900)' }}
      boxShadow="lg"
    >
      <HStack justify="space-between" mb={2}>
        <HStack>
          <MapPin size={18} />
          <Badge colorScheme="teal" variant="solid" borderRadius="md">
            {addressHit.zipcode.slice(0, 3)}-{addressHit.zipcode.slice(3)}
          </Badge>
        </HStack>
        <Button size="sm" variant="ghost" onClick={clipboard.copy}>
          {clipboard.copied ? <Check size={16} /> : <Copy size={16} />}
          住所をコピー
        </Button>
      </HStack>

      <Text fontSize="xl" fontWeight="bold" lineHeight={1.3}>
        {addressHit.prefecture} {addressHit.city}
      </Text>
      <Text fontSize="sm" opacity={0.7}>
        {addressHit.prefectureKana} {addressHit.cityKana}
      </Text>
    </Box>
  );
};

export default AddressResultCard;
