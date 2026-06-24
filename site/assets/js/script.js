document.addEventListener('DOMContentLoaded', () => {
  
  /* ==========================================================================
     1. MOUSE GLOW & MASK（マウス追従・ガラスくり抜きエフェクト）
     ========================================================================== */
  const glassLayer = document.querySelector('.glass-layer');
  const mouseGlow = document.querySelector('.mouse-glow');

if (glassLayer || mouseGlow) {

  const updateGlowPosition = (x, y) => {
    document.documentElement.style.setProperty('--mouse-x', `${x}px`);
    document.documentElement.style.setProperty('--mouse-y', `${y}px`);
  };


  // PC：マウス追従
  window.addEventListener('mousemove', (e) => {
    updateGlowPosition(e.clientX, e.clientY);
  });


  // スマホ：指の移動追従
  window.addEventListener('touchmove', (e) => {

    const touch = e.touches[0];

    updateGlowPosition(
      touch.clientX,
      touch.clientY
    );

  }, {
    passive: true
  });

}

  /* ==========================================================================
     2. INTERSECTION OBSERVER（スクロール連動アニメーション）
     ========================================================================== */
  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // CSS側の「.is-active」に合わせる
        entry.target.classList.add('is-active');
        // aタグや.blur-reveal用に「.is-visible」も同時に付与しておくと安全
        entry.target.classList.add('is-visible'); 
        
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: "0px 0px -33% 0px",
    threshold: 0
  });

  // 監視対象に、CSS側で初期状態を非表示にしている「.glass-card」と「.timeline-item」を追加
  document.querySelectorAll('a, .blur-reveal, .glass-card, .timeline-item').forEach(el => {
    animationObserver.observe(el);
  });

});
