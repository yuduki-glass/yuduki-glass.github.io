---
layout: default
title: 結月硝子
---

<div class="hero-section">
  <div class="hero-lead">
    <div class="hero-main">
      思ってたより<br>
      “整理されてること”って少ないみたい。
    </div>
    <div class="hero-sub">
      <br />
      たまに書き留めています。<br />
      ただ、<a href="/404.html">そこ</a>にあるものを。
    </div>
  </div>

  <div class="hero-tags">
    <div class="tag-title">観測されているもの</div>
    <div class="tag-container">
      {% for tag in site.data.tags %}
        <a href="/tags/{{ tag.slug }}/" class="tag-item">
          {{ tag.name }}
        </a>
      {% endfor %}

  <a href="/tags/" class="tag-item tag-more">
  その他の観測 →
  </a>
    </div>
  </div>
</div>

<div class="home-search" role="search" style="margin: 2.5rem 0 3rem;">
  <label for="home-search-input" style="display:block; margin-bottom:.65rem; color:var(--color-text-muted);">記録を探す</label>
  <input id="home-search-input" type="search" placeholder="記事内の単語を入力" autocomplete="off" style="width:100%; padding:.85rem 1rem; border:1px solid rgba(53,80,107,.22); border-radius:12px; background:rgba(255,255,255,.32); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); color:var(--color-text-main); font:inherit; outline:none;">
  <p id="home-search-status" aria-live="polite" style="min-height:1.5em; margin:.6rem 0 0; color:var(--color-text-muted); font-size:.9rem;"></p>
  <ul id="home-search-results" style="list-style:none; padding:0; margin:1rem 0 0;"></ul>
</div>

<div id="home-search-data" hidden>
{% for post in site.posts %}
  <div class="home-search-source" data-title="{{ post.title | strip_html | escape }}" data-url="{{ post.url | relative_url }}" data-date="{{ post.date | date: '%Y.%m.%d' }}" data-search="{{ post.title | strip_html | escape }} {{ post.content | strip_html | strip_newlines | escape }} {{ post.tags | join: ' ' | escape }}"></div>
{% endfor %}
</div>

<script>
(() => {
  const input = document.getElementById('home-search-input');
  const status = document.getElementById('home-search-status');
  const results = document.getElementById('home-search-results');
  const sources = Array.from(document.querySelectorAll('.home-search-source'));
  if (!input || !results) return;

  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g, ' ').trim();

  input.addEventListener('input', () => {
    const query = normalize(input.value);
    results.innerHTML = '';
    if (!query) {
      status.textContent = '';
      return;
    }

    const terms = query.split(' ').filter(Boolean);
    const matches = sources.filter((source) => {
      const text = normalize(source.dataset.search || '');
      return terms.every((term) => text.includes(term));
    });

    status.textContent = `${matches.length}件の記事が見つかりました`;
    matches.slice(0, 20).forEach((source) => {
      const li = document.createElement('li');
      li.style.margin = '.75rem 0';
      const date = document.createElement('span');
      date.textContent = `${source.dataset.date} — `;
      date.style.color = 'var(--color-text-muted)';
      date.style.fontSize = '.9rem';
      const link = document.createElement('a');
      link.href = source.dataset.url;
      link.textContent = source.dataset.title;
      li.append(date, link);
      results.appendChild(li);
    });

    if (matches.length > 20) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `/archives/?q=${encodeURIComponent(input.value)}`;
      link.textContent = `残り${matches.length - 20}件も見る →`;
      li.appendChild(link);
      results.appendChild(li);
    }
  });
})();
</script>

<hr style="border: none; border-top: 1px solid rgba(0,0,0,0.05); margin: 3rem 0;">

<h2 class="section-title">最初に読む記事</h2>
<div class="grid-3col">
  <a href="/2026/06/03/tuned-margins-underpass-and-retail/" class="glass-card card-article bg-post01">
    <span class="card-num">01</span>
    <h3>高架下と量販店、あらかじめ配置された余白の調律について</h3>
    <span class="card-more">読む &rarr;</span>
  </a>
  <a href="/2026/06/04/unexpressed-contours-and-solidified-arrangements/" class="glass-card card-article bg-post02">
    <span class="card-num">02</span>
    <h3>未発の輪郭と、街の隅に凝固する配置の記録</h3>
    <span class="card-more">読む &rarr;</span>
  </a>
  <a href="/2026/06/05/juutakugai-rinkaku-douki/" class="glass-card card-article bg-post03">
    <span class="card-num">03</span>
    <h3>並置される輪郭と、同期する夜の足音</h3>
    <span class="card-more">読む &rarr;</span>
  </a>
</div>

<hr style="border: none; border-top: 1px solid rgba(0,0,0,0.05); margin: 3rem 0;">

<div class="section-header">
  <h2 class="section-title">観測主題</h2>
  <a href="/all-themes/" class="view-all">すべて見る &rarr;</a>
</div>

<div class="grid-2col">
  <div class="glass-card card-theme">
    <div class="card-icon icon-reply"></div>
    <div class="card-body">
      <h3>大人の返し方</h3>
      <p>空気を壊さず、自分も壊さない返答の記録。</p>
      <a href="/adult-replies/" class="link-sub">一覧を見る &rarr;</a>
    </div>
  </div>

  <div class="glass-card card-theme">
    <div class="card-icon icon-quiet"></div>
    <div class="card-body">
      <h3>静かな人の観測記録</h3>
      <p>言葉にならない感情の観察。</p>
      <a href="/quiet-people/" class="link-sub">一覧を見る &rarr;</a>
    </div>
  </div>

  <div class="glass-card card-theme">
    <div class="card-icon icon-sns"></div>
    <div class="card-body">
      <h3>SNSと疲労</h3>
      <p>疲れる理由を観測する記録。</p>
      <a href="/sns-fatigue/" class="link-sub">一覧を見る &rarr;</a>
    </div>
  </div>

  <div class="glass-card card-theme">
    <div class="card-icon icon-aesthetic"></div>
    <div class="card-body">
      <h3>小さな美学</h3>
      <p>見過ごしてしまうには少し惜しかったものの記録。</p>
      <a href="/small-aesthetics/" class="link-sub">一覧を見る &rarr;</a>
    </div>
  </div>
</div>

<hr style="border: none; border-top: 1px solid rgba(0,0,0,0.05); margin: 3rem 0;">

<div class="section-header">
  <h2 class="section-title">最新の記録</h2>
  <a href="/archives/" class="view-all">すべての記録を見る &rarr;</a>
</div>

<ul class="timeline">
  {% for post in site.posts limit:7 %}
  <li class="timeline-item">
    <span class="timeline-date">
      {% assign w = post.date | date: "%w" %}
      {{ post.date | date: "%Y.%m.%d" }}（{{ "日月火水木金土" | slice: w, 1 }}）
    </span>
    <a href="{{ post.url }}" class="timeline-link">{{ post.title }}</a>
  </li>
  {% endfor %}
</ul>

<hr style="border: none; border-top: 1px solid rgba(0,0,0,0.05); margin: 3rem 0;">

<div class="blur-reveal">
  たぶん私も“雑なこと”の積み重ねで作られてる。<br>
  そんな気がしてる。
</div>
