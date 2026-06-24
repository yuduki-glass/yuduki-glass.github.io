---

layout: default
title: SNSと疲労
permalink: /sns-fatigue/
page_type: sub
---

# SNSと疲労

疲れる理由を観測する記録。

---

{% for post in site.posts %}
{% if post.tags contains "SNS疲れ"
or post.tags contains "SNS向いてない"
or post.tags contains "生活と回復" %}

* [{{ post.title }}]({{ post.url }})
  {% endif %}
  {% endfor %}
