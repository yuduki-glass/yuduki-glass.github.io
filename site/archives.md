---
layout: default
title: 記録一覧
permalink: /archives/
page_type: sub
---

# 記録一覧

これまでの観測記録です。

<div class="archive-search" role="search">
  <label for="archive-search-input">記事を単語で検索</label>
  <input id="archive-search-input" type="search" placeholder="例：AI、Gemini、RPG" autocomplete="off">
  <p id="archive-search-status" class="archive-search-status" aria-live="polite"></p>
</div>

---

<ul id="archive-post-list" class="archive-post-list">
{% for post in site.posts %}
{% assign w = post.date | date: "%w" %}
  <li class="archive-post-item" data-search="{{ post.title | strip_html | escape }} {{ post.content | strip_html | strip_newlines | escape }} {{ post.tags | join: ' ' | escape }}">
    {{ post.date | date: "%Y.%m.%d" }}（{{ "日月火水木金土" | slice: w, 1 }}） — <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>

<p id="archive-search-empty" class="archive-search-empty" hidden>該当する記事はありません。</p>

---

[← 表紙へ戻る](/)

<script>
(() => {
  const input = document.getElementById('archive-search-input');
  const items = Array.from(document.querySelectorAll('.archive-post-item'));
  const status = document.getElementById('archive-search-status');
  const empty = document.getElementById('archive-search-empty');

  if (!input || !items.length) return;

  const normalize = (value) => value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/\s+/g, ' ')
    .trim();

  const filterPosts = () => {
    const query = normalize(input.value);
    const terms = query ? query.split(' ').filter(Boolean) : [];
    let visible = 0;

    items.forEach((item) => {
      const haystack = normalize(item.dataset.search || '');
      const matched = terms.length === 0 || terms.every((term) => haystack.includes(term));
      item.hidden = !matched;
      if (matched) visible += 1;
    });

    if (!query) {
      status.textContent = '';
      empty.hidden = true;
      return;
    }

    status.textContent = `${visible}件の記事が見つかりました`;
    empty.hidden = visible !== 0;
  };

  input.addEventListener('input', filterPosts);
})();
</script>
