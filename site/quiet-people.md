---

layout: default
title: 静かな人の観測記録
permalink: /quiet-people/
page_type: sub
---

# 静かな人の観測記録

言葉にならない感情の観察。

---

{% for post in site.posts %}
{% if post.tags contains "静かな人"
or post.tags contains "言えない本音"
or post.tags contains "空気を読む人"
or post.tags contains "言葉が遅い人"
or post.tags contains "感情を出さない人"
or post.tags contains "反応が薄い人" %}

* [{{ post.title }}]({{ post.url }})
  {% endif %}
  {% endfor %}
