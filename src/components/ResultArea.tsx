import { Stack } from '@chakra-ui/react';
import AddressResultCard from './AddressResultCard';
import NoAddressFound from './NoAddressFound';
import { AddressRow } from '@/type/addresses';

type Props = {
  addressHit: AddressRow | null;
};
const ResultArea = ({ addressHit }: Props) => {
  return (
    <Stack>
      {addressHit && <AddressResultCard addressHit={addressHit} />}
      {!addressHit && <NoAddressFound />}
    </Stack>
  );
};

export default ResultArea;
