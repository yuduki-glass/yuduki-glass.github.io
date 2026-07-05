// ===============================
// 硝子片コレクション管理
// ===============================

const collectionItems = [
  { id: 1, name: "灰色の器", image: "assets/items/item001.svg", description: "静かに沈黙する欠片", weight: "38g", opacity: "14%" },
  { id: 2, name: "青い残響", image: "assets/items/item002.svg", description: "光をわずかに返す硝子", weight: "24g", opacity: "65%" },
  { id: 3, name: "忘れられた輪郭", image: "assets/items/item003.svg", description: "誰かが見落とした形", weight: "51g", opacity: "3%" },
  // ── 【追加】4〜10個目のアイテム ──
  { id: 4, name: "琥珀の微睡み", image: "assets/items/item004.svg", description: "夕刻の熱を閉じ込めた結晶", weight: "42g", opacity: "40%" },
  { id: 5, name: "深海の底流", image: "assets/items/item005.svg", description: "圧せられて深く、昏い青", weight: "68g", opacity: "8%" },
  { id: 6, name: "微細な亀裂", image: "assets/items/item006.svg", description: "何かが生まれる直前の線", weight: "15g", opacity: "88%" },
  { id: 7, name: "水面の記憶", image: "assets/items/item007.svg", description: "揺らぎだけが定着した面", weight: "29g", opacity: "92%" },
  { id: 8, name: "凍てつく吐息", image: "assets/items/item008.svg", description: "熱を拒絶する、鋭利な白", weight: "33g", opacity: "50%" },
  { id: 9, name: "煤けた星屑", image: "assets/items/item009.svg", description: "輝きを忘れた夜の残骸", weight: "47g", opacity: "1%" },
  { id: 10, name: "透明な境界", image: "assets/items/item010.svg", description: "在る事すら見失うほどの無", weight: "12g", opacity: "99%" }
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

// 集めた硝子片の総重量を計算して各画面に反映する関数
function updateTotalWeightDisplay() {
  let total = 0;

  collectionItems.forEach(item => {
    if (collectedItems.includes(Number(item.id))) {
      const weightNum = parseInt(item.weight) || 0;
      total += weightNum;
    }
  });

  const titleWeightEl = document.getElementById("titleTotalWeight");
  if (titleWeightEl) {
    titleWeightEl.textContent = `TOTAL WEIGHT: ${total}g`;
  }

  const clearWeightEl = document.getElementById("clearTotalWeight");
  if (clearWeightEl) {
    clearWeightEl.textContent = `TOTAL WEIGHT: ${total}g`;
  }

  return total;
}

// 取得
function addCollectionItem(level){
  // レベルに対応するアイテムを探索（IDで探す方が安全）
  const item = collectionItems.find(i => i.id === Number(level));
  if(!item) return;

  if(!collectedItems.includes(item.id)){
    collectedItems.push(item.id);
  }

  // 統計データの更新
  if(!collectionStats[item.id]){
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    
    collectionStats[item.id] = {
      date: `${yyyy}.${mm}.${dd} ${hh}:${mi}`,
      count: 1
    };
  } else {
    collectionStats[item.id].count += 1;
  }

  saveCollection();
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

// コレクション画面を開くボタン（PC・スマホ両対応）
const collectionBtn = document.getElementById("collectionBtn");
if (collectionBtn) {
  const handleOpenCollection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadCollection();
    updateTotalWeightDisplay();
    openCollection();
  };
  collectionBtn.addEventListener("touchstart", handleOpenCollection, { passive: false });
  collectionBtn.addEventListener("click", handleOpenCollection);
}

// コレクション画面の「戻る」ボタン
const closeCollection = document.getElementById("closeCollection");
if (closeCollection) {
  const handleCloseCollection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("collectionView").style.display = "none";
  };
  closeCollection.addEventListener("touchstart", handleCloseCollection, { passive: false });
  closeCollection.addEventListener("click", handleCloseCollection);
}

// 起動時の初期化処理（タイミングの安全ガード付き）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadCollection();
    updateTotalWeightDisplay();
  });
} else {
  loadCollection();
  updateTotalWeightDisplay();
}
/* ── 【修正】10個対応：グリッドのレイアウト崩れ防止 ── */
#collectionGrid {
  display: grid;
  /* スマホなら2列、PCなら自動で綺麗に並ぶように幅を制限 */
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 16px;
  padding: 15px;
  max-height: 60vh; /* 縦に伸びすぎて画面を突き抜けないようにスクロール枠をつける */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* スマホでのスクロールを滑らかに */
}

/* グリッド内の各アイテム枠の調整 */
#collectionGrid > div {
  background: rgba(6, 11, 20, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 4px;
  padding: 12px 8px;
  text-align: center;
  box-sizing: border-box;
}

#collectionGrid img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-bottom: 8px;
}

#collectionGrid h3 {
  font-size: 11px;
  margin: 0;
  color: rgba(56, 189, 248, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 文字が長すぎても崩れないように三点リーダーにする */
}

/* 未観測（？）の枠 */
.unknown {
  width: 50px;
  height: 50px;
  line-height: 50px;
  margin: 0 auto 8px;
  background: rgba(56, 189, 248, 0.05);
  color: rgba(56, 189, 248, 0.3);
  font-size: 20px;
  border: 1px dashed rgba(56, 189, 248, 0.2);
}

/* ── 【修正】詳細ポップアップのサイズ溢れ防止 ── */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(3, 7, 18, 0.85); /* 背景をしっかり暗く */
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: #060b14;
  border: 1px solid #38bdf8;
  padding: 24px;
  width: 85%;
  max-width: 290px;
  text-align: center;
  box-sizing: border-box;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
}

/* ステータス表をさらに見やすく整列 */
.popup-stats {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed rgba(56, 189, 248, 0.2);
  display: flex;
  justify-content: center;
}

.popup-stats table {
  width: 100%;
  font-size: 12px;
  color: rgba(56, 189, 248, 0.7);
  border-collapse: collapse;
}

.popup-stats td {
  padding: 5px 0;
  text-align: left;
}

.popup-stats td:last-child {
  text-align: right;
  color: #ffffff;
  font-family: 'Share Tech Mono', monospace;
  text-shadow: 0 0 4px rgba(56, 189, 248, 0.5);
}

.popup-hint {
  display: block;
  margin-top: 16px;
  font-size: 11px;
  color: rgba(56, 189, 248, 0.4);
}
