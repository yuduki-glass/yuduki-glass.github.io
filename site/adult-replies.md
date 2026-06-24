---

layout: default
title: 大人の返し方
permalink: /adult-replies/
page_type: sub
---

# 大人の返し方

空気を壊さず、
自分も壊さない返答の記録。

---

{% for post in site.posts %}
{% if post.tags contains "大人の返し方"
or post.tags contains "上品な切り返し"
or post.tags contains "空気を壊さない返答"
or post.tags contains "角が立たない返し"
or post.tags contains "柔らかい断り方" %}

* [{{ post.title }}]({{ post.url }})
  {% endif %}
  {% endfor %}
