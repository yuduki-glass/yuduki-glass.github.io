# 毎日1本のAI記事をGitHub Pagesへ公開する（Phase 1）

既存の `.github/workflows/jekyll.yml` に毎日 **09:17 JST** の起動を追加しました。
PCやCodexを起動しておく必要はありません。mainへの通常のpushは従来どおりサイトを公開し、記事は生成しません。

## 初回設定

1. この変更をGitHubのデフォルトブランチ `main` に反映します。
2. [Google AI Studio](https://aistudio.google.com/api-keys) で、課金アカウントを紐付けていない **Free Tier** プロジェクトのAPIキーを作成します。リポジトリの **Settings → Secrets and variables → Actions → Secrets → New repository secret** で、名前 `GEMINI_API_KEY`、値にそのキーを登録します。キーを記事・コード・ログに書かないでください。無料運用を維持するため、そのプロジェクトで課金を有効にしないでください。
3. **Settings → Actions → General** でActions、および使用する `actions/*` と `ruby/setup-ruby` を許可します。workflow内でbuildジョブに `contents: write`、deployジョブに `pages: write` と `id-token: write` を明示しています。組織ポリシーで書き込みが禁止されていないことを確認してください。PR作成権限や個人アクセストークンは不要です。
4. **Settings → Rules → Rulesets**（またはBranchesの保護設定）で、`github-actions[bot]` のmainへの通常pushを許可できることを確認します。PR必須・署名必須などでbotの直接pushが拒否される設定では、この最小構成は動きません。無条件に保護を解除するのでなく、管理方針に合う許可を設定してください。
5. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。既存の独自ドメイン設定は維持します。**Settings → Environments → github-pages** はmainからのdeployを許可し、無人運用では毎回の承認を要求しない設定が必要です。

## 手動テストと成功確認

**Actions → Build and Deploy Jekyll site → Run workflow → Branch: main** を選びます。
`generate_article` をtrueにして実行すると、無料枠を使用する本番の記事生成・commit/push・公開まで行います。

次を確認します。

- `Generate and save daily article` が成功し、`site/_posts/YYYY-MM-DD-daily-ai.md` がmainに追加される。
- `Build site` と `Verify generated article HTML` が成功する。
- `Commit generated article`、`Push generated article` が成功する（同日の2回目はスキップ）。
- deployジョブの `Deploy to GitHub Pages` が成功し、実行画面に公開先URLが表示される。
- `https://yuduki-glass.com/YYYY/MM/DD/daily-ai/` とトップページでタイトル・本文・日付を確認する。
- 同日にもう一度実行すると、ログに `Skipped generation` が出る。APIを呼び直さず、同じ記事を再ビルド・再公開する。

生成を止めて再公開だけ試す場合は `generate_article` をfalseにします。失敗した実行は原因を修正して **Re-run all jobs** で復旧できます。main以外からの手動実行はスキップします。

## 処理と重複防止

同じworkflow execution内で、最新mainのcheckout → Pythonテスト → Gemini API → Markdown保存 → 既存Ruby/Jekyll build → HTML検証 → 記事だけcommit → push → artifact upload → Pages deployを行います。壊れた記事をmainに残さないため、buildをcommitより先にしています。

`GITHUB_TOKEN` のpushが別workflowを起動することには依存しません。通常push・スケジュール・手動実行を共通concurrency groupで直列化し、進行中の公開をキャンセルしません。待機後のcheckoutも最新mainを読みます。人間が生成中にmainを更新してpush競合が起きた場合は、強制pushや自動マージをせず明示的に失敗します。再実行で最新mainからやり直します。

記事の存在が永続的な重複防止記録です。生成開始時の日本時間で日付を確定し、ファイル名は常に `YYYY-MM-DD-daily-ai.md`。同日のファイルを削除・改名すると再生成されるため、通常は維持してください。日付をまたぐ長い実行・翌日の再実行では、その実行開始日の記事になります。過去日の欠損を自動で埋める機能はありません。

front matterは既存の8項目（layout/title/date/category/tags/slug/excerpt/image）に合わせ、日付に `+0900` を付けます。モデルにYAMLやファイル名を作らせず、Python側でエスケープして組み立てます。Jekyllによる本文の誤解釈を避けるため `render_with_liquid: false` を追加しています。ファイルは一時ファイルから排他的に保存し、上書きしません。

記事は日本語の一般的なAI活用方法です。ニュース収集・検索・画像生成・製品の最新仕様確認は行いません。AI生成の注記を付けます。内容の高度な重複排除は未実装で、日付が異なる記事のテーマが似ることはあります。

ActionsのJekyll buildでは環境変数 `TZ: Asia/Tokyo` を設定し、日付表示とURLを日本時間に統一します。既存のJekyll設定・レイアウト・Gemfile・lockfile・記事は変更していません。`scripts/ai_article_state.py` と `docs/ai-article-*.md` は従来の人間主導の探索・公開手順として残します。ローカル専用かつGit管理外の探索stateは、この無人投稿では読み書きしません。Codexの「AI記事探索テスト」スケジュールも別機構です。

## 時刻・モデルを変更する

時刻は `jekyll.yml` の `schedule.cron` を編集してmainへ反映します。UTC基準なので、日本時間から9時間引きます。

- 現在：`17 0 * * *` → 毎日09:17 JST
- 変更例：`30 12 * * *` → 毎日21:30 JST

GitHub Actionsのscheduleは定刻ぴったりの実行や毎日の配送を保証しません。負荷による遅延・欠落、ActionsやGeminiの障害・利用制限では投稿されないことがあります。公開リポジトリでは長期間の活動停止でscheduleが無効になる場合もあります。Phase 1は1日1回の起動と一時的なAPI障害の最大3回の試行を実装し、外部障害の常時復旧システムは持ちません。

モデルは **Settings → Secrets and variables → Actions → Variables → New repository variable** に `GEMINI_MODEL` を登録すると変更できます。未指定は `gemini-3.5-flash-lite`。無料枠・generateContent・構造化出力の対応を公式資料と該当プロジェクトで確認し、変更後は手動テストしてください。有料モデルや別プロバイダーへの自動フォールバックはありません。

2026-10-07に公式資料で既定モデルの無料枠（入力・出力とも無料）と構造化出力の対応を確認しました。高性能モデルより低コストのFlash-Liteを優先します。出力上限は6000トークン、候補数は1。検索・画像生成・キャッシュ等の追加機能を使わず、Python標準ライブラリから `generateContent` を呼びます。APIキーはURLに含めず `x-goog-api-key` ヘッダーへ渡します。pip依存はありません。

無料枠のRPM・TPM・RPDはプロジェクト・モデルにより異なり、現在の値はAI Studioで確認します。日次枠は太平洋時間の午前0時にリセットされます。1日1記事は通常1リクエストですが、障害時の再試行や手動テストも枠を使用します。無料サービスの利用可能性・将来の無料枠・毎日の成功は保証されません。無料枠では入力・出力がGoogleの製品改善に利用される場合があるため、公開用の一般的な依頼文だけを送信します。

0円運用は、Google側のプロジェクトをFree Tierのまま維持することが前提です。生成用APIキーから課金設定を確認・変更する機能はありません。人間がそのプロジェクトの課金を有効化した場合、コードだけでは従量課金を防げません。GitHub側は公開リポジトリの標準ランナーを使用します。既存独自ドメインの維持費はこのAPI無料枠とは別です。

- [Geminiモデル](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)
- [Gemini料金](https://ai.google.dev/gemini-api/docs/pricing)
- [Geminiレート制限](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini課金とFree Tier](https://ai.google.dev/gemini-api/docs/billing)
- [generateContent API仕様](https://ai.google.dev/api/generate-content)
- [GitHub scheduleの動作と制約](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 失敗箇所の見方

| 失敗 | Actionsログと対応 |
| --- | --- |
| Gemini API | `Gemini API failed`。HTTPステータス・APIのstatus・メッセージ。400/403はキーやアクセス条件、404はモデル名、429は無料枠・利用制限、5xxはAPI側を確認。一時的な通信障害・408・500/502/503/504のみ最大3回試行し、キーは表示しません。 |
| 記事生成 | `Article generation failed`。未完了・拒否・不正JSON・短すぎる本文など。記事を保存せず失敗。モデル設定を確認して再実行。 |
| Markdown保存 | `Markdown save failed`。パス・ディスク・権限を確認。部分的な記事を公開しません。 |
| commit | `Commit generated article` / `Commit failed`。Gitログを確認。対象記事だけステージします。 |
| push | `Push generated article` / `Push failed`。contents権限・mainの規則・同時pushを確認。失敗時はdeployしません。 |
| 依存導入/Jekyll | `Install dependencies` / `Build site`。BundlerとJekyllの元のログを確認。Gemfile/lockfileの書換えをcommitしません。 |
| HTML検証 | `Verify generated article HTML`。記事の出力URL、title/H1、本文、トップ・archives・sitemap掲載を確認。 |
| Pages公開 | deployジョブの `Deploy to GitHub Pages`。Pages source、environment承認、pages/id-token権限を確認。記事push済みなら再実行しても同日の記事は増えません。 |

## 無料枠の上限エラーからの復旧

`429 RESOURCE_EXHAUSTED` は無料枠等の上限です。APIから返る説明とAI Studioの利用量を確認してください。日次上限の場合はリセットを待ち、一時的な分単位の制限なら間隔を空けて手動再実行できます。枠が0・モデルが利用不可の場合は、Free Tierの提供状況と対象モデルを確認してください。課金を有効化して回避しません。

日次上限で無駄なリクエストを重ねないよう、429は1回で停止します。記事がpush済みで公開だけ失敗した場合、同日再実行はAPIを呼ばず再公開します。旧プロバイダー用のSecret・モデル変数はこのworkflowから参照しません。

## ローカル検証（API課金なし）

リポジトリルートで `python -B -m unittest discover -s scripts -p 'test_generate_daily_article.py' -v`。
既存のstate管理回帰テストは `python -B scripts/test_ai_article_state.py`。
Jekyllは `site/` で、日本時間の環境変数を設定して `bundle exec jekyll build`。Linux/macOSでは `TZ=Asia/Tokyo bundle exec jekyll build`。Windows PowerShellでは `$env:TZ='JST-9'` と `$env:BUNDLE_FROZEN='true'` を設定してから実行します（WindowsのRubyではIANA形式のTZ環境変数が正しく解釈されないため、同じUTC+09:00のPOSIX表記を使用）。テスト本文を使う場合はリポジトリのコピーや一時ディレクトリを使い、本番記事としてcommitしないでください。
