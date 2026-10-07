"""Fail the workflow if Jekyll silently omitted or misrendered the daily post."""
import html
import json
from pathlib import Path
import re
import sys


def verify(article, site=Path("site")):
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})-daily-ai.md", article.name)
    if not match:
        raise ValueError("Unexpected daily article filename")
    source = article.read_text(encoding="utf-8")
    title = re.search(r'^title: (".*")$', source, re.M)
    if not title:
        raise ValueError("Missing title front matter")
    title = json.loads(title[1])
    url = "/" + "/".join(match.groups()) + "/daily-ai/"
    page = (site / "_site" / url.strip("/") / "index.html").read_text(encoding="utf-8")
    for tag in ("title", "h1"):
        value = re.search(rf"<{tag}\b[^>]*>(.*?)</{tag}>", page, re.S)
        if not value or html.unescape(value[1]).strip() != html.unescape(title):
            raise ValueError(f"Rendered {tag} mismatch")
    if '<div class="post-content">' not in page or "この記事はAIにより自動生成されています。" not in page:
        raise ValueError("Missing article body")
    for name in ("index.html", "archives/index.html", "sitemap.xml"):
        if url not in (site / "_site" / name).read_text(encoding="utf-8"):
            raise ValueError(f"Article absent from {name}")
    print(f"Verified daily article HTML: {url}")


if __name__ == "__main__":
    try:
        verify(Path(sys.argv[1]))
    except (OSError, ValueError, IndexError) as exc:
        message = str(exc).replace("%", "%25").replace("\n", "%0A").replace("\r", "%0D")
        print(f"::error title=Article HTML verification failed::{message}", file=sys.stderr)
        sys.exit(1)
