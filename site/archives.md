---

layout: default
title: 記録一覧
permalink: /archives/
page_type: sub

---

# 記録一覧

これまでの観測記録です。

---

{% for post in site.posts %}

{% assign w = post.date | date: "%w" %}
* {{ post.date | date: "%Y.%m.%d" }}（{{ "日月火水木金土" | slice: w, 1 }}） — [{{ post.title }}]({{ post.url }})

{% endfor %}

---

[← 表紙へ戻る](/)
