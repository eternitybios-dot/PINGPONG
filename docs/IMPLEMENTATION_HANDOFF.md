# 実装済みアプリの引き継ぎ

対象：[eternitybios-dot/PINGPONG](https://github.com/eternitybios-dot/PINGPONG)。スマートフォン優先の卓球上達ブラウザアプリ（PWA）の初版を実装した。機能と受入条件は[REQUIREMENTS.md](REQUIREMENTS.md)、初期教材の原稿と図案は[CONTENT_SPEC.md](CONTENT_SPEC.md)を参照。

## 起動・ビルド

Node.js 20.19以降を使う。

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
```

静的配信物は `dist/` に生成する。スマートフォンからアクセスする本番配信はHTTPSが必要。

## 実装内容

- 日本語の16教材と24練習。教材には動作の順序、コツ、NG／OK、自己確認、関連する練習を含む。練習とフォーム図は手描き風のオリジナルSVGで、利き手に合わせて反転する。
- 台なし、台ありのひとり練習、ペア練習に合わせた15・30・60分の練習メニュー。できる道具を確認し、メニュー中の種目を入れ替えてから開始できる。
- タイマー、休憩、一時停止、再開、種目のスキップ、中断記録、練習後の振り返り、履歴の編集と削除。
- 検索、お気に入り、教材の閲覧記録、利き手・レベル・目標・練習環境の設定。
- IndexedDBによるブラウザ内保存とService Workerのオフラインキャッシュ。PNGとSVGのアプリアイコンを用意し、クラウド同期やアカウント登録はない。

主なコードは `src/App.tsx`（画面と練習操作）、`src/content.ts`（教材・練習原稿）、`src/plans.ts`（メニュー構成）、`src/Illustrations.tsx`（SVG図）、`src/storage.ts`（端末内保存）、`src/pwa.ts` と `public/sw.js`（PWA）にある。

## 確認結果と残作業

型チェック、本番ビルド、ローカル配信プレビューを確認済み。Chromiumのスマホ幅（390px）で16教材、メニュー調整、タイマー、複数タブのロック、振り返りの保存・編集を操作し、キャッシュ後に通信を切った再読み込みで教材を開けることを確認した。iPhone SafariとAndroid Chromeの実機でのホーム画面追加と、本番HTTPS配信は別途実地確認が必要。

規則説明は学習用の簡潔な要点。試合の判定に使う場合は、現行のITTF公式ルールを確認する。
