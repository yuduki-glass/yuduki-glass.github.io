# 検証済みAI記事を公開する手順

このファイルは記事生成フローとは分離されており、明示的に公開を依頼された場合だけ使用する。記事生成・検証は [ai-article-workflow.md](ai-article-workflow.md) が担当する。この手順書の作成・閲覧や、記事生成の依頼だけを公開の許可と解釈しない。

目的は、指定された検証済みの記事Markdownだけをcommit・pushし、既存GitHub ActionsによるGitHub Pages公開と、公開内容の一致を確認すること。この手順書自体や他の変更は記事と一緒にcommitしない。

## 1. 公開対象と作業前の状態を確認する

リポジトリルートで次を確認する。

```text
git status --short
git branch --show-current
git remote -v
git diff --cached --name-only
```

- 公開対象を、ユーザーが指定した `site/_posts/` 内の具体的なMarkdownファイル名で確定する。対象が不明なら、ステージング前に確認する。
- 対象が検証済みであることを確認し、タイトル、予定URL、現在のHEAD、作業前の差分・未追跡ファイルを記録する。
- ブランチがmain、originが結月硝子の公開先リポジトリであることを確認する。異なる場合は勝手に切り替えたりremoteを書き換えたりせず停止する。
- 対象外に未commit・未追跡ファイルがあっても、変更・削除・ステージングしない。既存のステージングも勝手に解除しない。対象外がすでにステージングされていた場合は停止して報告する。
- pushで無関係な未公開commitまで送らないよう、origin/mainとの関係を確認する。必要なら `git fetch origin` でリモート参照を更新し、`git log --oneline origin/main..HEAD` と `git log --oneline HEAD..origin/main` を確認する。無関係な先行commit、遅れ、分岐があれば停止する。勝手にpull・merge・rebaseしない。

## 2. 記事と出典を再確認する

- Front Matterの `layout`、`title`、`date`、`category`、`tags`、`slug`、`excerpt`、`image` の8項目を確認する。`layout: "post"`、`category: "AI活用"`、tagsはYAMLインライン配列、imageは半角引用符の空文字 `""` とする。
- 公開日、ファイル名の日付、slug、予定URLの整合を確認する。slugは英数字とハイフンのみとし、既存記事とURLが衝突していないことを確認する。
- 未来日付による出力除外やタイムゾーンの影響を確認する。公開のために日付を変更したり `--future` を付けたりしない。
- 出典リンクを開き、操作・仕様・費用・制限の根拠が現在も確認できるかを再確認する。執筆時と公開日が異なる場合は、古い確認日の情報をそのまま最新と扱わない。
- 既存記事と目的・機能・操作・得られる結果が大きく重複していないことを再確認する。同じサービス名だけを理由に重複と判断しない。
- 修正が必要な場合は公開を止めて報告する。公開作業に便乗して本文を書き直さない。修正と再検証は別途指示に従う。

## 3. Jekyll buildと生成HTMLを再検証する

site/で、既存の設定と依存関係を使って実行する。

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

既存の生成物も保持する必要がある場合は、新しい一時ディレクトリを `--destination` に明示して出力する。設定ファイルは変更しない。生成物・キャッシュ・ログはcommitしない。

対象外の未追跡記事や未commit変更も、通常のローカルビルドには含まれる点に注意する。公開予定の内容だけを検証できない場合は、元の作業ファイルを変更せず、現在のHEADの追跡済みソースと対象記事だけを使った一時コピーで検証する。未公開の他記事に依存する内部リンクを正常と判定しない。検証用コピーや生成物はリポジトリのcommit対象に含めない。

次を確認し、比較用の生成HTMLと対象Markdownのハッシュを保持する。

- 終了コードが0で、対象記事のHTMLが期待するURLの位置に生成されている。
- title要素とH1がFront Matterのtitleに一致し、公開日表示が正しい。
- H2/H3、箇条書き、コードブロックが本文どおりに生成されている。
- 内部リンクが実際の公開対象に到達し、一次情報への外部リンクのURLが正しい。
- トップページの最新記事表示対象に入る場合はそこに掲載され、記事一覧とsitemapにも対象URLがある。トップは現行設定で最新7件のため、古い公開日の記事は表示範囲も確認する。
- category、tags、excerpt、imageなど、現行レイアウトが表示しない項目を表示済みと報告しない。
- 作業前と比べて、意図しない追跡ファイル変更がない。

## 4. 対象記事だけをステージングしてcommitする

`git add` には確定した記事ファイルのパスだけを個別に渡す。ワイルドカード、ディレクトリ指定、`git add .`、`git add -A`、`git commit -a` は使用しない。

下記の `ARTICLE_PATH` は、実在する公開対象の完全なリポジトリ相対パスへ置き換えるための表記であり、そのまま実行しない。

```text
git add -- ARTICLE_PATH
git diff --cached --name-only
git diff --cached --check
git diff --cached
```

ステージング済みファイル一覧が指定対象と完全に一致し、差分の本文が検証済みMarkdownと一致することを確認する。対象外が含まれていたらcommitしない。勝手にステージを組み替えず停止して報告する。差分がない場合も空commitや再commitは行わない。

commit messageは記事内容が分かる簡潔な英語にする。ユーザーから指定があればそれを使う。例：`Add NotebookLM data tables guide`。

確認後に `git commit -m "記事内容を表す英語メッセージ"` を実行する。成功後、`git rev-parse HEAD` と `git show --stat --oneline HEAD` でhash・対象ファイルを記録する。検証後に記事が変わっていたら公開へ進まない。

## 5. mainをoriginへpushする

commit成功と対象の一致を確認した後に、次を実行する。

```text
git push origin main
```

push成功を確認して次へ進む。失敗時は停止し、force push、認証方式の切り替え、ブランチ保護の解除、pull・rebaseなどによる回避をしない。

## 6. GitHub ActionsとPagesを確認する

GitHubの画面、CLIまたはAPIの読み取りで、pushしたcommit hashに対応する既存の `Build and Deploy Jekyll site` ワークフローを特定する。別commitの成功を今回の成功として扱わない。

実行がqueuedまたはin_progressなら、適切な間隔で待って確認する。無制限のポーリングはしない。完了しない場合や確認手段が使えない場合は、未確認であることと実行URLを報告し、成功と断定しない。

- workflowがcompletedで、conclusionがsuccessである。
- buildジョブと `Build site` ステップが成功している。
- deployジョブと `Deploy to GitHub Pages` ステップが成功している。

失敗・キャンセル・承認待ちがあれば停止し、状態、失敗箇所、確認できたエラー、実行URLを報告する。ワークフローを勝手に変更・再実行したり、Pages設定を変更したりしない。

## 7. 公開URLの内容を照合する

Pages deploy成功後に、確定した公開URLへHTTP GETを行う。

- HTTPステータスが200である。
- 公開HTMLのtitle要素とH1が、ローカル検証済みHTMLと一致する。
- 公開HTMLの `.post-content` に含まれる記事本文全体が、ローカル検証済みHTMLの同じ領域と一致する。

本文比較ではCRLFとLFなど改行表現の差だけを正規化し、文字、リンク先、見出し、コードを削って一致扱いにしない。短い文章の部分一致やHTTP 200だけでは公開成功と判定しない。前後記事ナビゲーションなど本文外の要素は、本文の一致と分けて扱う。

不一致、HTTPエラー、取得失敗があればその時点で停止し、成功と報告しない。無断の再pushや再デプロイで回避しない。

## エラー時と変更範囲の原則

各段階のコマンド結果を確認してから次へ進む。認証、権限、ブランチ保護、Actions、Pages、buildなどの問題が発生した場合は勝手な回避策を実行しない。ローカルcommit済み・push済みなど、どこまで完了したかを明示して報告する。勝手なreset、revert、記事削除も行わない。

公開処理中は、既存設定、GitHub Actions、Gemfile、Gemfile.lock、.gitignore、レイアウト、他の記事、生成手順書を変更しない。環境や依存関係の修正が必要なら、公開作業から切り離して相談する。

## 最終報告

`git status --short`、`git status -sb`、ステージング済み差分を確認し、次を報告する。

- 公開対象ファイル
- commit hash
- commit message
- push結果
- GitHub Actions結果と実行URL
- Pages deploy結果
- 公開URL確認結果（HTTPステータス、タイトル・H1・本文全体の一致）
- 最終git status（作業前から存在した変更と今回の変更を区別する）
- 警告またはエラー、未確認事項、途中停止した場合は完了した段階

すでにユーザーが対象記事の公開を明示的に依頼している場合、この手順書を理由に追加の公開確認を繰り返す必要はない。ただし対象の曖昧さやエラーによる停止は上記の規則に従う。
