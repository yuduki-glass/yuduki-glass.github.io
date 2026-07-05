// ===============================
// 硝子片コレクション管理
// ===============================

const collectionItems = [
  {
    id: 1,
    name: "灰色の器",
    image: "assets/items/item001.svg",
    description: "静かに沈黙する欠片",
    // ── 【追加】アイテム固有のステータス ──
    weight: "38g",
    opacity: "14%"
  },
  {
    id: 2,
    name: "青い残響",
    image: "assets/items/item002.svg",
    description: "光をわずかに返す硝子",
    weight: "24g",
    opacity: "65%"
  },
  {
    id: 3,
    name: "忘れられた輪郭",
    image: "assets/items/item003.svg",
    description: "誰かが見落とした形",
    weight: "51g",
    opacity: "3%"
  }
];

// 所持リスト
let collectedItems = [];
// ── 【追加】アイテムごとの詳細記録（日時や回数）を保存するオブジェクト ──
let collectionStats = {};

// 読み込み
function loadCollection(){
  const data = localStorage.getItem("glassCollection");
  if(data){
    collectedItems = JSON.parse(data);
  }
  
  // ── 【追加】追加ステータスの読み込み ──
  const statsData = localStorage.getItem("glassCollectionStats");
  if(statsData){
    collectionStats = JSON.parse(statsData);
  }
}

// 保存
function saveCollection(){
  localStorage.setItem("glassCollection", JSON.stringify(collectedItems));
  // ── 【追加】追加ステータスの保存 ──
  localStorage.setItem("glassCollectionStats", JSON.stringify(collectionStats));
}

// 取得
function addCollectionItem(level){
  const item = collectionItems[level-1];
  if(!item) return;

  // ── 【修正】未所持なら新しく追加、既所持なら観測回数をカウントアップ ──
  if(!collectedItems.includes(item.id)){
    collectedItems.push(item.id);
  }

  // 統計データの更新
  if(!collectionStats[item.id]){
    // 初めて取得した時
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    collectionStats[item.id] = {
      date: `${yyyy}.${mm}.${dd}`,
      count: 1
    };
  } else {
    // 2回目以降の観測（レベルクリア時などに呼ばれたらカウントアップ）
    collectionStats[item.id].count += 1;
  }

  saveCollection();
  showCollectionGet(item);
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
      div.innerHTML=`
        <img src="${item.image}" style="cursor: pointer; pointer-events: none;">
        <h3 style="pointer-events: none;">${item.name}</h3>
      `;
      div.style.cursor = "pointer";

      // アイテム枠をクリックした時に詳細ポップアップを展開
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const itemPopup = document.getElementById("itemPopup");
        if (itemPopup) {
          // 動的に記録データを取得（万が一データがなければデフォルト値を出すガード付き）
          const stats = collectionStats[item.id] || { date: "----.--.--", count: 1 };

          document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}">`;
          document.getElementById("popupName").textContent = item.name;
          
          // ── 【修正】説明文の下に、SFチックなステータスログを合成して流し込む ──
          document.getElementById("popupDesc").innerHTML = `
            ${item.description}
            <div class="popup-stats">
              <table>
                <tr><td>重量</td><td>${item.weight}</td></tr>
                <tr><td>透明度</td><td>${item.opacity}</td></tr>
                <tr><td>採取日時</td><td>${stats.date}</td></tr>
                <tr><td>再観測</td><td>${stats.count}回</td></tr>
              </table>
            </div>
          `;
          
          itemPopup.style.display = "flex";
        }
      });

    } else {
      div.innerHTML=`
        <div class="unknown">?</div>
        <h3>未観測</h3>
      `;
    }

    grid.appendChild(div);
  });

  document.getElementById("collectionView").style.display = "flex";
}

// ポップアップの枠外（背景）を触ったら確実に閉じる処理
const itemPopup = document.getElementById("itemPopup");
if (itemPopup) {
  const closePopupAction = (e) => {
    if (e.target === itemPopup) {
      e.preventDefault();
      e.stopPropagation();
      itemPopup.style.display = "none";
    }
  };
  itemPopup.addEventListener("touchstart", closePopupAction, { passive: false });
  itemPopup.addEventListener("click", closePopupAction);
}

// コレクション画面を開くボタン
document.getElementById("collectionBtn").addEventListener("click", (e)=>{
  e.stopPropagation();
  loadCollection();
  openCollection();
});

// コレクション画面の「戻る」ボタン
document.getElementById("closeCollection").addEventListener("click", (e)=>{
  e.stopPropagation();
  document.getElementById("collectionView").style.display = "none";
});
