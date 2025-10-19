import { Grid, GridItem, Box, Image, Center, SimpleGrid } from '@chakra-ui/react';
import { useCallback } from 'react';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import SignatureCanvas from 'react-signature-canvas';

import PostCodeDigit from './PostCodeDigit';
import { mathUtils, runModelUtils } from '@/utils';

type Props = {
  model: InferenceSession;
  digitRefs: React.RefObject<SignatureCanvas>[];
  setPostCode: React.Dispatch<React.SetStateAction<[number, number, number, number, number, number, number]>>;
};

const PostCodeCanvas = ({ model, digitRefs, setPostCode }: Props) => {
  //　ユーザーが筆を置くと発火
  const handlePredict = useCallback(
    async (digitIndex: number, canvasId: string, sctxCanvasId: string) => {
      const ctx = (document.getElementById(canvasId) as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
      // 28x28 の縮小キャンバス
      const scaledCanvas = document.getElementById(sctxCanvasId) as HTMLCanvasElement;
      const sctx = scaledCanvas.getContext('2d') as CanvasRenderingContext2D;

      const tensor = runModelUtils.preprocess(ctx, sctx);
      let feeds: Record<string, Tensor> = {};
      feeds[model.inputNames[0]] = tensor;
      // 推論実行
      const [res, _] = await runModelUtils.runModel(model, tensor);
      const output = mathUtils.postprocess(res);
      const predictedClass = runModelUtils.getPredictedClass(output);
      if (predictedClass === null) {
        console.log('予測に失敗しました');
        return;
      }
      setPostCode((prev) => {
        const newCode = [...prev] as [number, number, number, number, number, number, number];
        newCode[digitIndex] = predictedClass;
        return newCode;
      });
    },
    [model, setPostCode]
  );

  return (
    <Grid
      templateRows="auto auto auto"
      gap={{ base: 3, md: 4 }}
      h="100%"
      p={{ base: 0, md: 4 }}
      maxW="container.sm"
      mx="auto"
      as="section"
      aria-label="郵便番号入力"
    >
      {/* 1段目: 郵便局画像＋3桁 */}
      <GridItem>
        <Box display="flex" alignItems="center" justifyContent="center" gap={{ base: 3, md: 8 }} flexWrap="nowrap">
          <Image
            src="/handsign-meter/img/post_office_icon.png"
            alt="郵便局"
            boxSize={{ base: '48px', md: '70px' }}
            flexShrink={0}
          />
          <Box as="div" role="group" aria-label="郵便番号 上3桁">
            <SimpleGrid columns={3} gap={{ base: 1, md: 3 }}>
              {digitRefs.slice(0, 3).map((ref, index) => (
                <PostCodeDigit key={index} index={index} ref={ref} handlePredict={handlePredict} />
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </GridItem>

      {/* 2段目: ハイフン */}
      <GridItem>
        <Center fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" lineHeight="1" aria-hidden="true">
          -
        </Center>
      </GridItem>

      {/* 3段目: 4桁 */}
      <GridItem>
        <Box as="div" role="group" aria-label="郵便番号 下4桁">
          <SimpleGrid columns={4} gap={{ base: 1, md: 3 }}>
            {digitRefs.slice(3).map((ref, index) => (
              <PostCodeDigit key={index + 3} index={index + 3} ref={ref} handlePredict={handlePredict} />
            ))}
          </SimpleGrid>
        </Box>
      </GridItem>
    </Grid>
  );
};

export default PostCodeCanvas;
