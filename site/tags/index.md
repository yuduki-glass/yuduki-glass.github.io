---
layout: default
title: その他の観測
permalink: /tags/
page_type: sub
---

<h1>その他の観測</h1>

<p>まだ名前を与えられていない観測。</p>

{% assign known_tags = site.data.tags | map: "name" %}
{% assign extra_tags = "" | split: "" %}

{% for post in site.posts %}{% for tag in post.tags %}{% unless known_tags contains tag %}{% unless extra_tags contains tag %}{% assign extra_tags = extra_tags | push: tag %}{% endunless %}{% endunless %}{% endfor %}{% endfor %}

{% for tag in extra_tags %}
<section class="tag-block">
<h2>{{ tag }}</h2>

<ul>
{% for post in site.posts %}{% if post.tags contains tag %}
<li>
<a href="{{ post.url }}">{{ post.title }}</a>
</li>
{% endif %}{% endfor %}
</ul>

</section>
{% endfor %}
