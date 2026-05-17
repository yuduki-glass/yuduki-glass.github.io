---
layout: default
---

思ってたより  
“整理されてること”って少ないみたい。

たぶん私も“雑なこと”の積み重ねで作られてる。  
そんな気がしてる。

---

## Records

{% for post in site.posts %}
- {{ post.date | date: "%Y.%m.%d" }} — [{{ post.title }}]({{ post.url }})
{% endfor %}
