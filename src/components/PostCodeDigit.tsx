import SignatureCanvas from 'react-signature-canvas';
import { Stack } from '@chakra-ui/react';
import { forwardRef } from 'react';
type Props = {
  index: number;
  ref: React.MutableRefObject<null | SignatureCanvas>;
  handlePredict: (index: number, canvasId: string, sctxCanvasId: string) => void;
};

const PostCodeDigit = forwardRef<SignatureCanvas, Props>(({ index, handlePredict }, ref) => {
  const canvasId = `input-canvas-${index}`;
  const sctxCanvasId = `input-canvas-scaled-${index}`;
  return (
    <Stack border="1px solid red" height={'100%'}>
      <SignatureCanvas
        ref={ref}
        minWidth={4}
        maxWidth={4}
        penColor="black"
        backgroundColor="white"
        canvasProps={{
          width: 120,
          height: 120,
          className: 'sigCanvas',
          id: canvasId,
        }}
        onEnd={() => handlePredict(index, canvasId, sctxCanvasId)}
      />
      <canvas id={sctxCanvasId} width="28" height="28" className="none"></canvas>
    </Stack>
  );
});

export default PostCodeDigit;
