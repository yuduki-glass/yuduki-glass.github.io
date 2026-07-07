function openCollection() {
  const grid = document.getElementById("collectionGrid");
  const view = document.getElementById("collectionView");
  
  // 1. 強制的に前面へ
  view.style.display = "flex";
  view.style.zIndex = "1000";
  view.style.backgroundColor = "rgba(5, 10, 21, 0.99)";
  
  grid.innerHTML = ""; // 初期化

  // 2. 確実にDOMを生成（画像なし）
  for(let i = 0; i < 10; i++) {
    const div = document.createElement("div");
    div.style.border = "1px solid #38bdf8";
    div.style.padding = "10px";
    div.style.margin = "5px";
    div.style.width = "80px";
    div.style.height = "100px";
    div.innerHTML = `<h3 style="color:white; font-size:10px;">硝子片 ${i}</h3>`;
    grid.appendChild(div);
  }
  console.log("グリッド生成完了。これが見えなければCSSの表示状態がおかしい。");
}
