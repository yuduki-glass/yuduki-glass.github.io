import copy
from datetime import datetime, timezone
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import generate_daily_article as g


def article():
    return {"title": 'AIで「メモ」を整理する: 初めの一歩',
            "excerpt": "生成AIへの依頼文と、整理したメモを確認する手順を紹介します。",
            "body": "## メモの整理\n\n" + "これは説明用の例です。目的を指定して文章を整理し、元のメモと比べて確認します。" * 25}


def response(data):
    handle = io.BytesIO(json.dumps(data).encode())
    handle.headers = {"x-request-id": "req_test"}
    return handle


def completed():
    return {"modelVersion": g.DEFAULT_MODEL, "candidates": [{"finishReason": "STOP", "content": {"parts": [
        {"thought": True, "text": "Not article JSON"}, {"text": json.dumps(article())}]}}]}


class GeneratorTests(unittest.TestCase):
    def test_response_contract(self):
        with patch.object(g, "urlopen", return_value=response(completed())) as call:
            self.assertEqual(g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY"), article())
        req = call.call_args.args[0]
        data = json.loads(req.data)
        self.assertEqual(req.full_url, g.ENDPOINT + '/' + g.DEFAULT_MODEL + ':generateContent')
        self.assertEqual(data["generationConfig"]["responseMimeType"], "application/json")
        self.assertEqual(req.get_header("X-goog-api-key"), "TEST_KEY")
        self.assertNotIn("TEST_KEY", req.full_url)
        self.assertNotIn("tools", data)

    def test_jst_day_and_rerun_skips_without_secret(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            now = datetime(2026, 10, 6, 16, tzinfo=timezone.utc)
            with patch.dict(os.environ, {"GEMINI_API_KEY": "TEST_KEY"}), patch.object(g, "request_article", return_value=article()) as request:
                path, created = g.generate(root, now)
                self.assertTrue(created)
                self.assertEqual(path, "site/_posts/2026-10-07-daily-ai.md")
                original = (root / path).read_bytes()
                with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
                    self.assertEqual(g.generate(root, now), (path, False))
                request.assert_called_once()
                self.assertEqual((root / path).read_bytes(), original)

    def test_missing_key_creates_no_file(self):
        with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            with self.assertRaisesRegex(g.ArticleError, "Missing GEMINI_API_KEY"):
                g.generate(Path(temp))
            self.assertEqual(list(Path(temp).rglob("*.md")), [])

    def test_front_matter_and_atomic_no_overwrite(self):
        markdown = g.render_article(article(), "2026-10-07")
        front = dict(line.split(": ", 1) for line in markdown.split("---\n")[1].strip().splitlines())
        self.assertEqual(json.loads(front["title"]), article()["title"])
        self.assertEqual(json.loads(front["date"]), "2026-10-07 00:00:00 +0900")
        self.assertFalse(json.loads(front["render_with_liquid"]))
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "posts" / "post.md"
            g.save_article(path, markdown)
            with self.assertRaises(g.ArticleError) as error:
                g.save_article(path, "overwrite")
            self.assertEqual(error.exception.stage, "Markdown save")
            self.assertEqual(path.read_text(encoding="utf-8"), markdown)
            self.assertEqual(list(path.parent.glob("*.tmp")), [])

    def test_disk_error_leaves_no_partial_post(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(g.os, "link", side_effect=OSError("disk full")):
            path = Path(temp) / "post.md"
            with self.assertRaisesRegex(g.ArticleError, "disk full"):
                g.save_article(path, "content")
            self.assertFalse(path.exists())
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_incomplete_refusal_and_invalid_json_fail(self):
        cases = [
            {"candidates": [{"finishReason": "MAX_TOKENS"}]},
            {"candidates": [{"finishReason": "SAFETY"}]},
            {"promptFeedback": {"blockReason": "SAFETY"}},
            {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": "bad json"}]}}]},
        ]
        for data in cases:
            with self.subTest(data=data), patch.object(g, "urlopen", return_value=response(data)):
                with self.assertRaises(g.ArticleError) as error:
                    g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY")
                self.assertEqual(error.exception.stage, "Article generation")

    def test_unsafe_or_short_article_rejected(self):
        for field, value in [("title", "bad"), ("body", "短い本文"), ("body", article()["body"] + "{% include secret %}"),
                             ("title", '<script>alert("日本語")</script>'), ("title", "記事タイトル\nlayout: evil")]:
            data = copy.deepcopy(article())
            data[field] = value
            with self.subTest(field=field, value=value[:30]), self.assertRaises(g.ArticleError):
                g.validate_article(data)

    def test_api_auth_failure_is_redacted_and_not_retried(self):
        error = HTTPError(g.ENDPOINT, 403, "Forbidden", {}, io.BytesIO(
            b'{"error":{"status":"PERMISSION_DENIED","message":"Invalid TEST_KEY"}}'))
        with patch.object(g, "urlopen", side_effect=error) as call, patch.object(g.time, "sleep") as sleep:
            with self.assertRaises(g.ArticleError) as caught:
                g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY")
            self.assertEqual(caught.exception.stage, "Gemini API")
            self.assertNotIn("TEST_KEY", str(caught.exception))
            call.assert_called_once()
            sleep.assert_not_called()

    def test_transient_http_retry_then_success(self):
        error = HTTPError(g.ENDPOINT, 503, "Unavailable", {}, io.BytesIO(b'{}'))
        with patch.object(g, "urlopen", side_effect=[error, response(completed())]) as call, patch.object(g.time, "sleep"):
            self.assertEqual(g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY"), article())
            self.assertEqual(call.call_count, 2)

    def test_free_quota_fails_once_without_fallback(self):
        payload = {"error": {"status": "RESOURCE_EXHAUSTED", "message": "Free tier daily limit exceeded"}}
        error = HTTPError(g.ENDPOINT, 429, "Quota", {}, io.BytesIO(json.dumps(payload).encode()))
        with patch.object(g, "urlopen", side_effect=error) as call, patch.object(g.time, "sleep") as sleep:
            with self.assertRaises(g.ArticleError) as caught:
                g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY")
            self.assertIn("RESOURCE_EXHAUSTED", str(caught.exception))
            self.assertEqual(caught.exception.stage, "Gemini API")
            call.assert_called_once()
            sleep.assert_not_called()

    def test_model_cannot_change_endpoint(self):
        with patch.object(g, "urlopen") as call, self.assertRaises(g.ArticleError):
            g.request_article("2026-10-07", "../other?key=bad", "TEST_KEY")
        call.assert_not_called()

    def test_model_h1_becomes_h2_but_code_examples_stay_intact(self):
        value = article()
        value['body'] = value['body'].replace('## メモの整理', '# メモの整理')
        value['body'] += '\n\n```markdown\n# 入力例\n```\n\n##\u3000確認方法\n原文と確認。'
        normalized = g.validate_article(value)['body']
        self.assertTrue(normalized.startswith('## メモの整理'))
        self.assertIn('```markdown\n# 入力例\n```', normalized)
        self.assertIn('## 確認方法', normalized)

    def test_code_heading_does_not_count_as_article_structure(self):
        value = article()
        value['body'] = value['body'].replace('## メモの整理', 'メモの整理') + '\n```\n## 例だけ\n```'
        with self.assertRaisesRegex(g.ArticleError, 'section headings'):
            g.validate_article(value)

    def test_network_retry_is_bounded(self):
        with patch.object(g, "urlopen", side_effect=URLError("offline")) as call, patch.object(g.time, "sleep"):
            with self.assertRaises(g.ArticleError) as caught:
                g.request_article("2026-10-07", g.DEFAULT_MODEL, "TEST_KEY")
            self.assertEqual(caught.exception.stage, "Gemini API")
            self.assertEqual(call.call_count, 3)


if __name__ == "__main__":
    unittest.main()
