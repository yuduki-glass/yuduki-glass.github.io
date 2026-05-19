---
layout: default
---

思ってたより  
“整理されてること”って少ないみたい。


---

## 記録

{% for post in site.posts %}
  {% if post.title %}
- {{ post.date | date: "%Y.%m.%d" }} — [{{ post.title }}]({{ post.url }})
  {% endif %}
{% endfor %}

---

たぶん私も“雑なこと”の積み重ねで作られてる。  
そんな気がしてる。
