// ===============================
// 硝子片コレクション管理
// ===============================

const collectionItems = [
  {
    id:1,
    name:"灰色の器",
    image:"assets/items/item001.svg",
    description:"静かに沈黙する欠片"
  },
  {
    id:2,
    name:"青い残響",
    image:"assets/items/item002.svg",
    description:"光をわずかに返す硝子"
  },
  {
    id:3,
    name:"忘れられた輪郭",
    image:"assets/items/item003.svg",
    description:"誰かが見落とした形"
  }
];

// 所持リスト
let collectedItems = [];

// 読み込み
function loadCollection(){
  const data = localStorage.getItem("glassCollection");
  if(data){
    collectedItems = JSON.parse(data);
  }
}

// 保存
function saveCollection(){
  localStorage.setItem("glassCollection", JSON.stringify(collectedItems));
}

// 取得
function addCollectionItem(level){
  const item = collectionItems[level-1];
  if(!item) return;

  if(!collectedItems.includes(item.id)){
    collectedItems.push(item.id);
    saveCollection();
    showCollectionGet(item);
  }
}

// 獲得演出
function showCollectionGet(item){
  console.log("獲得:", item.name);
}

function openCollection(){
  const grid = document.getElementById("collectionGrid");
  grid.innerHTML="";

  collectionItems.forEach(item=>{
    const div = document.createElement("div");

    if(collectedItems.includes(Number(item.id))){
      // 獲得済み：グリッド側は画像と名前だけ
      div.innerHTML=`
        <img src="${item.image}" style="cursor: pointer; pointer-events: none;">
        <h3 style="pointer-events: none;">${item.name}</h3>
      `;
      div.style.cursor = "pointer";

      // ── 【修正】アイテム枠をクリックした時に詳細ポップアップを展開 ──
      div.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの連鎖をここで完全に断つ
        
        const itemPopup = document.getElementById("itemPopup");
        if (itemPopup) {
          document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}">`;
          document.getElementById("popupName").textContent = item.name;
          document.getElementById("popupDesc").textContent = item.description;
          itemPopup.style.display = "flex";
        }
      });

    } else {
      // 未獲得：？マークと、名前を「未観測」にして表示
      div.innerHTML=`
        <div class="unknown">?</div>
        <h3>未観測</h3>
      `;
    }

    grid.appendChild(div);
  });

  document.getElementById("collectionView").style.display = "flex";
}

// ── 【修正】ポップアップの枠外（背景）を触ったら確実に閉じる処理 ──
const itemPopup = document.getElementById("itemPopup");
if (itemPopup) {
  const closePopupAction = (e) => {
    // クリック/タッチされたのが、中身のコンテンツではなく「背景の黒いエリア（itemPopup自身）」のときだけ閉じる
    if (e.target === itemPopup) {
      e.preventDefault();
      e.stopPropagation();
      itemPopup.style.display = "none";
    }
  };

  // スマホ（タッチ）とPC（クリック）の両方に対応
  itemPopup.addEventListener("touchstart", closePopupAction, { passive: false });
  itemPopup.addEventListener("click", closePopupAction);
}

// ── コレクション画面を開くボタン ──
document.getElementById("collectionBtn").addEventListener("click", (e)=>{
  e.stopPropagation();
  loadCollection();
  openCollection();
});

// ── コレクション画面の「戻る」ボタン ──
document.getElementById("closeCollection").addEventListener("click", (e)=>{
  e.stopPropagation();
  document.getElementById("collectionView").style.display = "none";
});
