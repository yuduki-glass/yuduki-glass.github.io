# 毎日1本のAI記事をGitHub Pagesへ公開する（Phase 1）

既存の `.github/workflows/jekyll.yml` に毎日 **09:17 JST** の起動を追加しました。
PCやCodexを起動しておく必要はありません。mainへの通常のpushは従来どおりサイトを公開し、記事は生成しません。

## 初回設定

1. この変更をGitHubのデフォルトブランチ `main` に反映します。
2. リポジトリの **Settings → Secrets and variables → Actions → Secrets → New repository secret** で、名前 `OPENAI_API_KEY`、値にOpenAI APIキーを登録します。キーを記事・コード・ログに書かないでください。OpenAI側のAPI課金、残高、モデル利用権限も必要です。ChatGPTの契約とは別です。
3. **Settings → Actions → General** でActions、および使用する `actions/*` と `ruby/setup-ruby` を許可します。workflow内でbuildジョブに `contents: write`、deployジョブに `pages: write` と `id-token: write` を明示しています。組織ポリシーで書き込みが禁止されていないことを確認してください。PR作成権限や個人アクセストークンは不要です。
4. **Settings → Rules → Rulesets**（またはBranchesの保護設定）で、`github-actions[bot]` のmainへの通常pushを許可できることを確認します。PR必須・署名必須などでbotの直接pushが拒否される設定では、この最小構成は動きません。無条件に保護を解除するのでなく、管理方針に合う許可を設定してください。
5. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。既存の独自ドメイン設定は維持します。**Settings → Environments → github-pages** はmainからのdeployを許可し、無人運用では毎回の承認を要求しない設定が必要です。

## 手動テストと成功確認

**Actions → Build and Deploy Jekyll site → Run workflow → Branch: main** を選びます。
`generate_article` をtrueにして実行すると、本番の記事生成・API課金・commit/push・公開まで行います。

次を確認します。

- `Generate and save daily article` が成功し、`site/_posts/YYYY-MM-DD-daily-ai.md` がmainに追加される。
- `Build site` と `Verify generated article HTML` が成功する。
- `Commit generated article`、`Push generated article` が成功する（同日の2回目はスキップ）。
- deployジョブの `Deploy to GitHub Pages` が成功し、実行画面に公開先URLが表示される。
- `https://yuduki-glass.com/YYYY/MM/DD/daily-ai/` とトップページでタイトル・本文・日付を確認する。
- 同日にもう一度実行すると、ログに `Skipped generation` が出る。APIを呼び直さず、同じ記事を再ビルド・再公開する。

生成を止めて再公開だけ試す場合は `generate_article` をfalseにします。失敗した実行は原因を修正して **Re-run all jobs** で復旧できます。main以外からの手動実行はスキップします。

## 処理と重複防止

同じworkflow execution内で、最新mainのcheckout → Pythonテスト → OpenAI API → Markdown保存 → 既存Ruby/Jekyll build → HTML検証 → 記事だけcommit → push → artifact upload → Pages deployを行います。壊れた記事をmainに残さないため、buildをcommitより先にしています。

`GITHUB_TOKEN` のpushが別workflowを起動することには依存しません。通常push・スケジュール・手動実行を共通concurrency groupで直列化し、進行中の公開をキャンセルしません。待機後のcheckoutも最新mainを読みます。人間が生成中にmainを更新してpush競合が起きた場合は、強制pushや自動マージをせず明示的に失敗します。再実行で最新mainからやり直します。

記事の存在が永続的な重複防止記録です。生成開始時の日本時間で日付を確定し、ファイル名は常に `YYYY-MM-DD-daily-ai.md`。同日のファイルを削除・改名すると再生成されるため、通常は維持してください。日付をまたぐ長い実行・翌日の再実行では、その実行開始日の記事になります。過去日の欠損を自動で埋める機能はありません。

front matterは既存の8項目（layout/title/date/category/tags/slug/excerpt/image）に合わせ、日付に `+0900` を付けます。モデルにYAMLやファイル名を作らせず、Python側でエスケープして組み立てます。Jekyllによる本文の誤解釈を避けるため `render_with_liquid: false` を追加しています。ファイルは一時ファイルから排他的に保存し、上書きしません。

記事は日本語の一般的なAI活用方法です。ニュース収集・検索・画像生成・製品の最新仕様確認は行いません。AI生成の注記を付けます。内容の高度な重複排除は未実装で、日付が異なる記事のテーマが似ることはあります。

ActionsのJekyll buildでは環境変数 `TZ: Asia/Tokyo` を設定し、日付表示とURLを日本時間に統一します。既存のJekyll設定・レイアウト・Gemfile・lockfile・記事は変更していません。`scripts/ai_article_state.py` と `docs/ai-article-*.md` は従来の人間主導の探索・公開手順として残します。ローカル専用かつGit管理外の探索stateは、この無人投稿では読み書きしません。Codexの「AI記事探索テスト」スケジュールも別機構です。

## 時刻・モデルを変更する

時刻は `jekyll.yml` の `schedule.cron` を編集してmainへ反映します。UTC基準なので、日本時間から9時間引きます。

- 現在：`17 0 * * *` → 毎日09:17 JST
- 変更例：`30 12 * * *` → 毎日21:30 JST

GitHub Actionsのscheduleは定刻ぴったりの実行や毎日の配送を保証しません。負荷による遅延・欠落、ActionsやOpenAIの障害・利用制限では投稿されないことがあります。公開リポジトリでは長期間の活動停止でscheduleが無効になる場合もあります。Phase 1は1日1回の起動と一時的なAPI障害の最大3回の試行を実装し、外部障害の常時復旧システムは持ちません。

モデルは **Settings → Secrets and variables → Actions → Variables → New repository variable** に `OPENAI_MODEL` を登録すると変更できます。未指定は `gpt-5.4-mini`。Responses APIとStructured Outputsをサポートするモデルを指定し、変更後は手動テストしてください。APIパラメータ互換性のないモデルへは名前の変更だけでは移行できません。

2026-10-07に公式モデル資料でResponses API・Structured Outputs対応を確認しました。既定モデルは標準のテキスト料金が入力100万トークンあたり$0.75、出力$4.50で、本文生成に必要な能力と費用のバランスを採用理由としています。1記事の費用は実際のトークン数で変わります。出力上限は6000トークンです。Python標準ライブラリのHTTPクライアントを使い、pip依存はありません。

- [OpenAI GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [GitHub scheduleの動作と制約](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 失敗箇所の見方

| 失敗 | Actionsログと対応 |
| --- | --- |
| OpenAI API | `OpenAI API failed`。HTTPステータス・エラーコード・request ID。401はキー、403/404はモデル権限やモデル名、429は残高・利用制限、5xxはAPI側を確認。一時エラーのみ最大3回試行し、キーは表示しません。 |
| 記事生成 | `Article generation failed`。未完了・拒否・不正JSON・短すぎる本文など。記事を保存せず失敗。モデル設定を確認して再実行。 |
| Markdown保存 | `Markdown save failed`。パス・ディスク・権限を確認。部分的な記事を公開しません。 |
| commit | `Commit generated article` / `Commit failed`。Gitログを確認。対象記事だけステージします。 |
| push | `Push generated article` / `Push failed`。contents権限・mainの規則・同時pushを確認。失敗時はdeployしません。 |
| 依存導入/Jekyll | `Install dependencies` / `Build site`。BundlerとJekyllの元のログを確認。Gemfile/lockfileの書換えをcommitしません。 |
| HTML検証 | `Verify generated article HTML`。記事の出力URL、title/H1、本文、トップ・archives・sitemap掲載を確認。 |
| Pages公開 | deployジョブの `Deploy to GitHub Pages`。Pages source、environment承認、pages/id-token権限を確認。記事push済みなら再実行しても同日の記事は増えません。 |

## ローカル検証（API課金なし）

リポジトリルートで `python -B -m unittest discover -s scripts -p 'test_generate_daily_article.py' -v`。
既存のstate管理回帰テストは `python -B scripts/test_ai_article_state.py`。
Jekyllは `site/` で、日本時間の環境変数を設定して `bundle exec jekyll build`。Linux/macOSでは `TZ=Asia/Tokyo bundle exec jekyll build`。Windows PowerShellでは `$env:TZ='JST-9'` と `$env:BUNDLE_FROZEN='true'` を設定してから実行します（WindowsのRubyではIANA形式のTZ環境変数が正しく解釈されないため、同じUTC+09:00のPOSIX表記を使用）。テスト本文を使う場合はリポジトリのコピーや一時ディレクトリを使い、本番記事としてcommitしないでください。
