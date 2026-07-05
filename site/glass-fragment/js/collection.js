// ===============================
// 硝子片コレクション管理
// ===============================

const collectionItems = [
  {
    id: 1,
    name: "灰色の器",
    image: "assets/items/item001.svg",
    description: "静かに沈黙する欠片",
    // ── アイテム固有のステータス ──
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
// アイテムごとの詳細記録（日時や回数）を保存するオブジェクト
let collectionStats = {};

// 読み込み
function loadCollection(){
  const data = localStorage.getItem("glassCollection");
  if(data){
    collectedItems = JSON.parse(data);
  }
  
  const statsData = localStorage.getItem("glassCollectionStats");
  if(statsData){
    collectionStats = JSON.parse(statsData);
  }
}

// 保存
function saveCollection(){
  localStorage.setItem("glassCollection", JSON.stringify(collectedItems));
  localStorage.setItem("glassCollectionStats", JSON.stringify(collectionStats));
}

// ── 【追加】集めた硝子片の総重量を計算して各画面に反映する関数 ──
function updateTotalWeightDisplay() {
  let total = 0;

  collectionItems.forEach(item => {
    if (collectedItems.includes(Number(item.id))) {
      // "38g" から数値部分だけを抽出して加算
      const weightNum = parseInt(item.weight) || 0;
      total += weightNum;
    }
  });

  // トップ画面（タイトル）の数値を更新
  const titleWeightEl = document.getElementById("titleTotalWeight");
  if (titleWeightEl) {
    titleWeightEl.textContent = `収集した硝子の重量: ${total}g`;
  }

  // クリア画面（ポーズ画面）の数値を更新
  const clearWeightEl = document.getElementById("clearTotalWeight");
  if (clearWeightEl) {
    clearWeightEl.textContent = `収集した硝子の重量: ${total}g`;
  }

  return total;
}

// 取得
function addCollectionItem(level){
  const item = collectionItems[level-1];
  if(!item) return;

  if(!collectedItems.includes(item.id)){
    collectedItems.push(item.id);
  }

  // 統計データの更新
  if(!collectionStats[item.id]){
    // 初めて取得した時（現在の年・月・日・時・分をゼロ埋めで取得）
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    
    // フォーマット「YYYY.MM.DD HH:MI」で格納
    collectionStats[item.id] = {
      date: `${yyyy}.${mm}.${dd} ${hh}:${mi}`,
      count: 1
    };
  } else {
    // 2回目以降の観測
    collectionStats[item.id].count += 1;
  }

  saveCollection();
  // ── 【追加】新しく取得、またはカウントアップした瞬間に総重量表示も再計算 ──
  updateTotalWeightDisplay();
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
          const stats = collectionStats[item.id] || { date: "----.--.-- --:--", count: 1 };

          document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}">`;
          document.getElementById("popupName").textContent = item.name;
          
          // 説明文の下に、固有ステータスと動的ログを合成して流し込む
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

// ── 【追加】起動時にデータを読み込んで総重量の初期表示を機能させる ──
document.addEventListener("DOMContentLoaded", () => {
  loadCollection();
  updateTotalWeightDisplay();
});
