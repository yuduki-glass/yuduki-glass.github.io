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
      // 獲得済み：画像と名前
      div.innerHTML=`
        <img src="${item.image}" style="cursor: pointer;">
        <h3>${item.name}</h3>
      `;

      // 獲得済みアイテムをクリックした時にポップアップを開く
      div.addEventListener('click', (e) => {
        // グリッドクリックのイベントが外（collectionViewなど）に漏れるのを防ぐ
        e.stopPropagation();
        
        const itemPopup = document.getElementById("itemPopup");
        if (itemPopup) {
          document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}">`;
          document.getElementById("popupName").textContent = item.name;
          document.getElementById("popupDesc").textContent = item.description;
          itemPopup.style.display = "flex";
        }
      });

    }else{
      // 未獲得：？マーク
      div.innerHTML=`
        <div class="unknown">?</div>
        <h3>未観測</h3>
      `;
    }

    grid.appendChild(div);
  });

  document.getElementById("collectionView").style.display = "flex";
}

// ── 【修正】ポップアップの枠外（背景）をクリックしたら閉じる処理 ──
// 最初からイベントを張るのではなく、安全なガード（ifチェックとstopPropagation）を入れる
// ── 【修正】ポップアップの枠外（背景）をクリックしたら閉じる処理（判定をより確実に） ──
const itemPopup = document.getElementById("itemPopup");
if (itemPopup) {
  itemPopup.addEventListener("click", (e) => {
    // イベントの伝播をここで完全にストップ
    e.stopPropagation();

    // ポップアップが「非表示（none）」ではなく、かつクリックされたのが背景（itemPopup自身）のとき
    if (itemPopup.style.display !== "none" && e.target === itemPopup) {
      itemPopup.style.display = "none";
    }
  });
}
document.getElementById("collectionBtn").addEventListener("click", ()=>{
  loadCollection();
  openCollection();
});

document.getElementById("closeCollection").addEventListener("click", (e)=>{
  // 念のためここにも伝播防止を入れておく
  e.stopPropagation();
  document.getElementById("collectionView").style.display = "none";
});
