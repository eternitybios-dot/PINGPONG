# PINGPONG

フォームとコツをイラストで学び、自分の環境に合う練習を続けられる卓球上達ブラウザアプリです。スマートフォンを優先した画面、ホーム画面への追加、初回読み込み後のオフライン利用に対応しています。

## 開発

Node.js 20.19以降を用意して、リポジトリのルートで実行します。

```sh
npm ci
npm run dev
```

公開用の静的ファイルは `npm run build` で `dist/` に生成されます。公開環境はHTTPSが必要です。プレビューは `npm run preview` で開けます。

## GitHub Pagesで公開

GitHubリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。その後、`main` または `docs/mobile-app-requirements` ブランチへpushすると、ワークフローがビルドと公開を行います。公開URLは `https://eternitybios-dot.github.io/PINGPONG/` です。

練習記録・プロフィール・お気に入りは使用中のブラウザに保存されます。アカウント登録、クラウド同期、広告はありません。オフライン利用はオンラインでの初回読み込みと画面の保存後に有効になります。

## 内容

- フォームを動作順序やOK／注意点の図で学ぶ16教材
- ひとり、台なし、ペアで行う24練習と15・30・60分の練習メニュー
- 左右利きの表示切替、お気に入り、検索、練習タイマーと記録
- IndexedDBによるブラウザ内保存とService Workerによるオフライン表示

- [要件定義書](docs/REQUIREMENTS.md)：機能・画面・データ・品質・受入条件
- [教材・練習・イラスト仕様](docs/CONTENT_SPEC.md)：初期コンテンツの設計
- [実装AIへの引き継ぎ](docs/IMPLEMENTATION_HANDOFF.md)：当初の実装順序と納品物
