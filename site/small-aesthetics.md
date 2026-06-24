---
layout: default
title: 小さな美学
permalink: /small-aesthetics/
page_type: sub
---

# 小さな美学

小さな美学は、
誰かに説明するほどではないけれど、

なぜか気になってしまう光景や、
少しだけ心が動いた瞬間の記録です。

役に立つわけではありません。

正しいわけでもありません。

ただ、見過ごしてしまうには少し惜しかったものを残しています。

---

## 記録

{% for post in site.posts %}
  {% if post.tags contains "小さな美学"
    or post.tags contains "観察"
    or post.tags contains "観察ログ"
    or post.tags contains "観測記録"
    or post.tags contains "光"
    or post.tags contains "静寂"
    or post.tags contains "都市"
    or post.tags contains "生活の変化"
    or post.tags contains "普通の違和感" %}

* {{ post.date | date: "%Y.%m.%d" }} — [{{ post.title }}]({{ post.url }})
    {% endif %}
  {% endfor %}

