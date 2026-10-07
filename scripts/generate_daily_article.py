"""Generate one JST-dated Jekyll post using Gemini's free tier (stdlib only)."""
import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

JST = timezone(timedelta(hours=9), "Asia/Tokyo")
DEFAULT_MODEL = "gemini-3.5-flash-lite"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"
SCHEMA = {
    "type": "OBJECT",
    "properties": {key: {"type": "STRING"} for key in ("title", "excerpt", "body")},
    "required": ["title", "excerpt", "body"],
}


class ArticleError(Exception):
    def __init__(self, stage, message):
        super().__init__(message)
        self.stage = stage


def log(message):
    # Never let model/API text become a GitHub Actions command.
    print(json.dumps(message, ensure_ascii=False), flush=True)


def request_article(day, model, api_key):
    if not re.fullmatch(r"gemini-[a-z0-9.-]+", model):
        raise ArticleError("Gemini API", "Invalid GEMINI_MODEL identifier")
    payload = {
        "systemInstruction": {"parts": [{"text": (
            "あなたは日本語ブログの編集者です。初心者が試せる、生成AIを日常の文章作成や"
            "考えの整理に使う具体的な方法を一つ選び、1200〜2000字の記事を書いてください。"
            "導入、H2見出し、具体的な手順、コピーできる依頼文の例、結果の確認方法を含めます。"
            "ニュース・検索・実機検証はしていません。最新情報、製品固有の画面操作・料金、"
            "出典URL、架空の体験談や実測値は作らないでください。例は説明用と明記します。"
            "個人情報を入力しないこと、出力を確認することも自然に説明してください。"
            "titleは具体的な日本語タイトル、excerptは短い日本語要約、bodyはMarkdown本文。"
            "本文にH1、front matter、HTML、Liquid構文を含めないでください。"
        )}]},
        "contents": [{"role": "user", "parts": [{
            "text": f"日本時間の投稿日は{day}です。今日の記事を1本作成してください。",
        }]}],
        "generationConfig": {
            "candidateCount": 1, "maxOutputTokens": 6000,
            "responseMimeType": "application/json", "responseSchema": SCHEMA,
        },
    }
    req = Request(f"{ENDPOINT}/{model}:generateContent", data=json.dumps(payload).encode("utf-8"), headers={
        "x-goog-api-key": api_key, "Content-Type": "application/json",
    })
    for attempt in range(3):
        try:
            with urlopen(req, timeout=120) as response:
                data = json.load(response)
            break
        except HTTPError as exc:
            try:
                error = json.loads(exc.read()).get("error", {})
            except (ValueError, UnicodeError):
                error = {}
            # API messages may echo an invalid key. Redact before logging.
            detail = str(error.get("message", exc.reason)).replace(api_key, "[REDACTED]")
            code = str(error.get("status", "unknown")).replace(api_key, "[REDACTED]")
            message = f"HTTP {exc.code}; status={code}; {detail}"
            # 429 may be a daily/zero free quota. Never upgrade billing or switch providers.
            retry = exc.code in (408, 500, 502, 503, 504)
            if not retry or attempt == 2:
                raise ArticleError("Gemini API", message) from exc
            log(f"Gemini API retry {attempt + 1}/2: {message}")
        except (URLError, TimeoutError, OSError) as exc:
            if attempt == 2:
                raise ArticleError("Gemini API", f"Network/timeout: {exc}") from exc
            log(f"Gemini API network/timeout; retry {attempt + 1}/2")
        except (ValueError, UnicodeError) as exc:
            raise ArticleError("Gemini API", "Response was not valid JSON") from exc
        time.sleep(5 * (2 ** attempt))
    if not isinstance(data, dict):
        raise ArticleError("Article generation", "Invalid response object")
    candidates = data.get("candidates", [])
    if not candidates:
        raise ArticleError("Article generation", f"No candidate; promptFeedback={data.get('promptFeedback')}")
    candidate = candidates[0]
    if candidate.get("finishReason") != "STOP":
        raise ArticleError("Article generation", f"Incomplete/blocked response: {candidate.get('finishReason')}")
    chunks = [part.get("text", "") for part in candidate.get("content", {}).get("parts", [])
              if not part.get("thought")]
    log(f"Gemini modelVersion={data.get('modelVersion', model)}; usage={data.get('usageMetadata', {})}")
    try:
        article = json.loads("".join(chunks))
    except (ValueError, TypeError) as exc:
        raise ArticleError("Article generation", "Missing or invalid article JSON") from exc
    return validate_article(article)


def validate_article(article):
    if not isinstance(article, dict) or set(article) != {"title", "excerpt", "body"}:
        raise ArticleError("Article generation", "Expected title, excerpt and body")
    for key, minimum, maximum in (("title", 5, 120), ("excerpt", 10, 300), ("body", 600, 12000)):
        value = article[key]
        if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
            raise ArticleError("Article generation", f"Invalid {key} length/type")
        article[key] = value.strip()
        if not re.search(r"[ぁ-んァ-ヶ一-龯]", value):
            raise ArticleError("Article generation", f"{key} must contain Japanese")
        if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", value) or "{%" in value or "{{" in value:
            raise ArticleError("Article generation", f"Unsafe control/Liquid syntax in {key}")
        if re.search(r"<[^>]*>", value):
            raise ArticleError("Article generation", f"Unexpected HTML in {key}")
    if any("\n" in article[key] or "\r" in article[key] for key in ("title", "excerpt")):
        raise ArticleError("Article generation", "Metadata must be single-line")
    if not re.search(r"^## ", article["body"], re.M) or re.search(r"^# ", article["body"], re.M):
        raise ArticleError("Article generation", "Body must use H2 headings, without H1")
    return article


def render_article(article, day):
    metadata = {
        "layout": "post", "title": article["title"], "date": f"{day} 00:00:00 +0900",
        "category": "AI活用", "tags": ["AI活用", "生成AI"], "slug": "daily-ai",
        "excerpt": article["excerpt"], "image": "", "render_with_liquid": False,
    }
    # JSON strings/arrays/bools are valid YAML; model text cannot add front matter keys.
    front = "\n".join(f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in metadata.items())
    return f"---\n{front}\n---\n\n{article['body']}\n\n---\n\n*この記事はAIにより自動生成されています。*\n"


def save_article(path, markdown):
    temp = None
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n",
                                         dir=path.parent, suffix=".tmp", delete=False) as handle:
            temp = Path(handle.name)
            handle.write(markdown)
            handle.flush()
            os.fsync(handle.fileno())
        # Atomic, exclusive publish: neither concurrent generation nor retries overwrite a post.
        os.link(temp, path)
    except OSError as exc:
        raise ArticleError("Markdown save", str(exc)) from exc
    finally:
        if temp is not None:
            temp.unlink(missing_ok=True)


def generate(root, now=None):
    day = (now or datetime.now(JST)).astimezone(JST).date().isoformat()
    relative = f"site/_posts/{day}-daily-ai.md"
    path = root / relative
    if path.exists():
        if not path.is_file() or path.stat().st_size == 0:
            raise ArticleError("Article generation", f"Existing post is invalid: {relative}")
        log(f"Skipped generation: {relative} already exists; build/deploy will continue")
        return relative, False
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ArticleError("Gemini API", "Missing GEMINI_API_KEY repository Actions secret")
    model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    log(f"Generating {day} (Asia/Tokyo), model={model}")
    article = request_article(day, model, api_key)
    save_article(path, render_article(article, day))
    log(f"Saved {relative}")
    return relative, True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        relative, created = generate(args.root)
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as handle:
                handle.write(f"article_path={relative}\ncreated={str(created).lower()}\n")
    except (ArticleError, OSError) as exc:
        stage = exc.stage if isinstance(exc, ArticleError) else "Markdown save"
        message = str(exc).replace(os.environ.get("GEMINI_API_KEY") or "\0", "[REDACTED]")
        escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::error title={stage} failed::{escaped}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
