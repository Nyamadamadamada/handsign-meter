# 今日の気分を５本指で表現しよう！

<img src="./output.gif" width="50%" />

https://nyamadamadamada.github.io/handsign-meter/

### Zenn の記事

## 環境構築

```terminal
git clone https://github.com/Nyamadamadamada/handsign-meter.git
cd handsign-meter
npm install
```

## デプロイの方法

1. `main`ブランチに最新のコードをマージ
2. `npm run build`を実行
3. push 後にタグをつける
4. GitHub Workflows が発火し、GitHubPages にデプロイされる

※ タグは`v0.0.1`など始めに`v`をつけること。

```bash
# タグの例
git tag -a v0.0.1 -m "画像を表示されるように" HEAD
git push origin --tags
```

### 初回だけやること

GitHub > Environments > Configure github-pages の

「Deployment branches and tags」を「No restriction」にする。
