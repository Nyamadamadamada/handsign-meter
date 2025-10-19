import { useEffect, useRef, useState, useCallback, createRef } from 'react';
import { InferenceSession } from 'onnxruntime-web';

import { Heading, Container, Stack } from '@chakra-ui/react';

import Futter from './components/Futter';
import './App.css';
import HandWebcamDetector from './components/HandWebcamDetector';

const App = () => {
  return (
    <Container
      maxW={'3xl'}
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'space-between'}
      alignItems="center"
      minH={'calc(100vh - 100px)'}
      backgroundColor={'white'}
      marginY={10}
      paddingTop={10}
    >
      <Stack
        display={'flex'}
        flexDirection={{ base: 'column', md: 'column' }}
        alignItems="center"
        marginTop={{ base: 10, md: 10 }}
        marginBottom={{ base: 4, md: 10 }}
      >
        <Heading size="3xl" letterSpacing="tight">
          ハンドサイン認識アプリ
        </Heading>
        <Heading size="md" color={'gray.400'} letterSpacing="tight">
          映像はブラウザ内で処理され、外部に送信されることはありません
        </Heading>
      </Stack>
      <Stack>
        <section className="space-y-3">
          <HandWebcamDetector />
        </section>
      </Stack>
      {/* フッター */}
      <Futter />
    </Container>
  );
};

export default App;
