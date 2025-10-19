## スクリーンショットから Git への変換方法

ffmpeg -i demo-1.mov -vf setpts=PTS/2 -af atempo=2 output.mov
ffmpeg -i output.mov -r 10 output.gif
