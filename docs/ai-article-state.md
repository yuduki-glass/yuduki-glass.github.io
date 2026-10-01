# 日次探索状態の管理

`scripts/ai_article_state.py` はPython標準ライブラリだけを使うローカルの記録ツールです。探索・記事生成・公開・定期実行・公開本数の確定は行いません。既存の生成／公開手順の判断を置き換えるものではありません。

## 保存と読み取り

本番記録はリポジトリの `runtime/ai-article-state/YYYY-MM-DD.json` に保存します。現在の日本時間（UTC+09:00、Asia/Tokyo）を使い、作業ディレクトリに左右されません。日付指定で書き込む機能はありません。ディレクトリ全体を.gitignoreで除外します。状態・入力用JSON・一時ファイルをcommitしないでください。自動削除や保持期限による削除は実装していません。

以下の `python` は利用可能なPython 3の実行ファイルに置き換えられます。PATHにない場合も、既存の実行ファイルを指定し、新たにインストールする必要はありません。

```powershell
python -B scripts/ai_article_state.py show
python -B scripts/ai_article_state.py init
python -B scripts/ai_article_state.py record --input runtime/ai-article-state/input.json
python -B scripts/ai_article_state.py show --date 2026-10-01
```

`show` が見つからないファイルを空の状態に変えることはありません。`init` は初回作成を明示する操作であり、既存ファイルを上書きしません。初期化しても当日の公開本数は不明のままです。履歴が失われた疑いがある場合は、初期化して続行せず履歴の照合を先に行ってください。`--date` は過去記録を読むためだけに使用します。

## JSON構造と追記

ルートには `schema_version`、`date`、`timezone`、`test_data`、`created_at`、`updated_at`、`runs`、`candidates` を保持します。`publication_count` は常に `null`、`requires_publication_reconciliation` は常に `true` です。既存記事と実際の公開履歴を照合しないまま0本扱いする経路を設けていません。

`runs` は実行ID、開始・終了時刻、`normal` / `final`、結果、候補IDを保持します。`candidates` は安定したIDと `observations`（各回の調査・判断の履歴）を保持します。最新の観測は履歴の末尾ですが、過去の見送り理由・公開処理の記録も必ず確認してください。

`record` は1回分の結果をまとめて追記します。候補がない回は `candidates: []` にできます。実行IDの再使用はエラーで、二重追記しません。以下は架空のTEST入力であり、本物の調査結果ではありません。

```json
{
  "test_data": true,
  "run": {
    "run_id": "TEST-normal-1",
    "mode": "normal",
    "started_at": "2026-10-01T08:00:00+09:00",
    "finished_at": "2026-10-01T08:10:00+09:00",
    "result": "TEST: 今回は公開なし"
  },
  "candidates": [{
    "name": "TEST候補（実在の調査ではない）",
    "service": "TEST service",
    "feature": "TEST feature",
    "use_case": "TEST usage",
    "announcement_url": "https://example.invalid/announcement",
    "source_urls": ["https://example.invalid/source"],
    "summary": "状態管理テスト専用",
    "decision": "skipped",
    "reason": "TEST: 一次情報不足",
    "reevaluate_when": ["TEST: 操作の公式資料が確認できた場合"],
    "changes": [],
    "article_file": null,
    "public_url": null,
    "publication": {"status": "not_started"}
  }]
}
```

本番入力は `test_data: false` とし、実際の調査内容・当日の日本時間を使用します。decisionは `adopted` / `skipped` / `pending`。採用でも見送りでもreasonを必須とします。各観測に比較結果や公式更新日、未確認事項などの補足フィールドも記録できます。候補の記事パスとURLは未生成ならnullで構いません。記録内容が一次情報で裏付けられるかは実行者が確認します。

## 同一候補と再評価

- 名称だけでは照合しません。サービス・機能・用途をNFKC、大小文字、空白について正規化して照合します。
- 機能の表記が変わっても、同じサービス・同じ用途で公式発表URLが一致すれば同一候補とします。URLのフラグメントと末尾スラッシュは除き、意味を持ち得るクエリは保持します。
- 類義語・別名などで一致しない場合は、履歴を読んだ実行者が `existing_id` と `identity_reason` を指定できます。用途の違う候補を機械的に統合しません。複数候補に一致した場合はエラーで停止し、根拠を確認して明示指定します。
- `reevaluate_when` に再評価条件を残します。変化があれば `changes` に `kind`、`detail`、`source_url` を記録します。kindは `official_update`（公式更新）、`availability`（提供拡大）、`pricing`（料金・無料枠）、`new_usage`（新用途）、`source_found`（不足していた一次情報）のいずれかです。
- 同じ候補へ新しい観測を追記するため、以前の見送り判断は消えません。変化の自動監視や意味理解による自動採用は行いません。最終探索で優先度を変える場合もreasonに説明を残します。品質不足は、その原因が解消しなければ採用しません。

## 通常探索と最終探索への組み込み

1. `show` で当日の状態を読む。未作成の場合も「今日は0本」とは推測せず、当日付の記事・実際の公開履歴を確認する。破損・履歴の欠落・公開処理中の記録があれば停止する。
2. 公開本数を外部の根拠と照合し、生成手順書の上限・品質・公開許可ルールを適用する。JSON内の `verified` も実行者が記録した証拠であり、自動で真偽を検証したものではない。古い記録も必ず再照合する。
3. normalでは既調査候補を参考に探索し、価値不足なら記事を作らず、`record` で見送り理由を含む結果を記録して正常終了する。
4. finalでは、全候補の履歴（過去の見送り・再評価条件を含む）と新候補を比較する。公開0本と確認でき、最低品質条件を満たす最良候補があれば記事化する。なければ品質を優先して公開なしの結果を記録する。
5. 記事化した場合はarticle_fileを記録する。公開を明示的に許可された場合も、公開手順を別途すべて実行する。公開開始前に `in_progress` を記録し、中断を次回から見えるようにする。後続の状態更新は別の一意な実行IDで追記する。

publication.statusは `not_started` / `in_progress` / `verified` / `failed` / `unknown`。`verified` の保存にはarticle_file、public_urlに加え、commit（40桁）、actions_url、buildとdeploy（success）、http_status（200）、title_match・h1_match・body_match（true）、first_published_atとchecked_at（日本時間）が必要です。他の状態では分かっている証拠だけ補足できます。状態を記録しても公開本数は返しません。

## 障害・同時実行・テスト

不正なJSON、重複キー、必要項目の欠落、不正なモード、日付不一致、テスト／本番混在はエラー（終了コード1）です。元のJSONを勝手に修復・削除・上書きしません。破損時は新規生成・公開も停止し、実際の履歴から復元する作業を別途行います。

書き込みは排他的な `.lock` と同じディレクトリの一時ファイルを使い、検証後に置換します。途中失敗で既存JSONを切り詰めません。残ったロックは勝手に削除しません。このロックは短い状態更新だけの保護です。探索から公開までの並行実行を防ぐ役割は将来の起動側が持ちます。日付が変わると別ファイルになり、前日の候補は自動コピーしません。前日からの公開処理中状態も、起動側が前回実行記録と実際の履歴で確認してください。

```powershell
python -B scripts/test_ai_article_state.py
python -B scripts/ai_article_state.py init --test-data
python -B scripts/ai_article_state.py show --test-data
```

テストは一時ディレクトリ内で架空のTESTデータを使用します。CLIの `--test-data` は `runtime/ai-article-state/test-data/YYYY-MM-DD.json` へ隔離し、通常モードでは読みません。サンプル入力の日時はテスト実行日の日本時間へ置き換えてください。本番日次ファイルへ架空の調査結果を混ぜません。
