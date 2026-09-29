# AI活用記事を1本作る半自動フロー

この手順は、人が開始を依頼し、AIがWeb調査・執筆・ローカル検証を行い、人が公開を判断する運用です。APIによる無人生成プログラムではありません。定期実行、Actionsの追加、ステージング、commit、pushは含みません。このファイルはJekyllのソースであるsite/の外に置き、サイトには公開しません。

## 開始時の依頼例

> この手順に従ってAI活用記事を1本作成してください。現在の一次情報を調べ、既存記事との重複を確認し、新規Markdownをsite/_posts/へ追加してビルドと生成HTMLを確認してください。既存の追跡ファイルと.gitignoreは変更せず、commit・push・Actions変更は行わないでください。記事・出典・検証結果・git statusを報告してください。

## 1. 作業前の状態と重複候補を確認

- リポジトリルートでgit status --shortとgit diff --cached --name-onlyを確認する。他の作業の変更を戻したり取り込んだりしない。
- site/_posts/のタイトル、category、tags、excerptと、候補テーマに関係する本文を確認する。
- 製品名が一致するかだけでなく、読者の目的、具体的な手順、記事で得られる成果が重複しないかを比較する。
- 同じ目的の記事があれば、言い換えて新規作成せず、別の実用テーマを選ぶ。

## 2. 一次情報からテーマを選ぶ

- 現在閲覧できる公式ドキュメント、公式ブログ、公式リポジトリを優先する。
- 操作・仕様・料金・上限について、それぞれ裏付けるURLと確認日を控え、本文の該当箇所にリンクする。
- 古い発表と現行ヘルプが異なる場合は現行の記載を確認し、確認できない仕様は省く。
- 料金が必要な手順なら、通貨、課金単位、適用条件も確認する。無料枠で完結するなら、その条件と上限を示す。
- 実機操作をしていない場合は「公式手順に基づく説明」とし、体験談や実測値を作らない。

## 3. 新規記事を1本作る

UTF-8のsite/_posts/YYYY-MM-DD-slug.mdを新規作成する。同じファイル名や公開URLが存在する場合は上書きしない。日付は予定公開日と一致させ、8項目を使う。

```yaml
---
layout: "post"
title: "読者ができるようになることを示すタイトル"
date: "YYYY-MM-DD"
category: "AI活用"
tags: ["AI活用", "対象サービス", "用途"]
slug: "lowercase-ascii-slug"
excerpt: "記事の対象・用途・扱う範囲を短く説明する。"
image: ""
---
```

本文のH1はレイアウトに任せ、H2/H3、手順、必要なプロンプト例、制限、出典を使う。説明用の例と製品仕様を区別し、誇張や水増しを避ける。関連する既存記事へのリンクは実在するURLだけを使う。

## 4. ローカルビルド

site/でPowerShellから実行する。BUNDLE_FROZENでロックファイルの更新を禁止し、不要なディスクキャッシュを抑える。以前からBUNDLE_FROZENを設定していた場合は終了後に元の値へ戻す。

```powershell
$previousBundleFrozen = $env:BUNDLE_FROZEN
try {
    $env:BUNDLE_FROZEN = 'true'
    bundle exec jekyll build --disable-disk-cache
    if ($LASTEXITCODE -ne 0) { throw 'Jekyll build failed' }
} finally {
    $env:BUNDLE_FROZEN = $previousBundleFrozen
}
```

依存関係やビルドに問題が出たら、既存設定・Gemfile.lockの変更で回避せず、原因を報告する。site/_site/は生成先であり、ステージングしない。将来日付の記事が出力されない場合も、無断で--futureを付けて検証済み扱いにしない。

## 5. 生成HTMLとGitの状態を確認

- site/_site/YYYY/MM/DD/slug/index.htmlが存在する。
- title要素とH1がFront Matterのtitleに一致し、日付・URLも正しい。
- H2/H3、箇条書き、コードブロック、リンク先が本文どおりに生成される。
- 内部リンクに対応する出力ファイルが存在し、外部出典の内容を閲覧できる。
- トップページ・archives・sitemapに新記事のURLが入る。
- YAMLの8項目、category、インライン配列tags、ASCIIのslug、空のimageを確認する。
- 現行レイアウトが表示しないcategory、tags、excerpt、imageを、表示済みと報告しない。
- git diff、git diff --cached、git status --shortで、既存ファイルやステージに意図しない変更がないことを確認する。

## 6. 人に渡す結果

テーマと選定理由、出典と確認日、新規ファイル、タイトル、予定URL、要約、重複候補との違い、ビルド結果、HTML検証、警告、最終git statusを報告する。公開は別途明示的に依頼された場合に限る。公開日が変わる場合は出典を再確認する。

## 2026-09-29の実施テーマ

- 既存記事202件からAI活用の主な比較対象は「生成AIで文章を要約する方法：プロンプト例と原文確認の手順」。
- 新規テーマは資料から学習用クイズを作る手順。要約の作成とは目的と操作が異なる。原文確認の共通部分は既存記事へリンクする。
- 仕様の根拠は新記事末尾のGoogle公式ヘルプ3件。操作画面の実測検証は行っていない。
- ルートとsite/に.gitignoreは存在しない。追加するならルートで/site/_site/、/site/.jekyll-cache/、/site/.jekyll-metadataを指定する案があるが、このフローでは作成・変更しない。
