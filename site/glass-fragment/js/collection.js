// ===============================
// 硝子片コレクション管理
// ===============================

const collectionItems = [
  { id: 1, name: "灰色の器", image: "assets/items/item001.svg", description: "静かに沈黙する欠片", weight: "38g", opacity: "14%" },
  { id: 2, name: "青い残響", image: "assets/items/item002.svg", description: "光をわずかに返す硝子", weight: "24g", opacity: "65%" },
  { id: 3, name: "忘れられた輪郭", image: "assets/items/item003.svg", description: "誰かが見落とした形", weight: "51g", opacity: "3%" },
  { id: 4, name: "琥珀の微睡み", image: "assets/items/item004.svg", description: "夕刻の熱を閉じ込めた結晶", weight: "42g", opacity: "40%" },
  { id: 5, name: "深海の底流", image: "assets/items/item005.svg", description: "圧せられて深く、昏い青", weight: "68g", opacity: "8%" },
  { id: 6, name: "微細な亀裂", image: "assets/items/item006.svg", description: "何かが生まれる直前の線", weight: "15g", opacity: "88%" },
  { id: 7, name: "水面の記憶", image: "assets/items/item007.svg", description: "揺らぎだけが定着した面", weight: "29g", opacity: "92%" },
  { id: 8, name: "凍てつく吐息", image: "assets/items/item008.svg", description: "熱を拒絶する、鋭利な白", weight: "33g", opacity: "50%" },
  { id: 9, name: "煤けた星屑", image: "assets/items/item009.svg", description: "輝きを忘れた夜の残骸", weight: "47g", opacity: "1%" },
  { id: 10, name: "透明な境界", image: "assets/items/item010.svg", description: "在る事すら見失うほどの無", weight: "12g", opacity: "99%" }, // ←ここにカンマを追加
  { id: 11, name: "新緑の脈絡", image: "assets/items/item011.svg", description: "未だ瑞々しさを偽る偽物の葉", weight: "21g", opacity: "73%" },
  { id: 12, name: "薄明の残光", image: "assets/items/item012.svg", description: "夜が満ちる前の、最後の抵抗", weight: "45g", opacity: "35%" },
  { id: 13, name: "微熱の不在", image: "assets/items/item013.svg", description: "かつて誰かが触れていた名残", weight: "19g", opacity: "82%" },
  { id: 14, name: "濁った祈り", image: "assets/items/item014.svg", description: "無数の願いが沈殿した結晶", weight: "55g", opacity: "11%" },
  { id: 15, name: "白夜の迷子", image: "assets/items/item015.svg", description: "影を奪われ、立ち尽くす白", weight: "31g", opacity: "60%" },
  { id: 16, name: "乾いた涙痕", image: "assets/items/item016.svg", description: "悲しみだけが蒸発したあとの塩", weight: "14g", opacity: "90%" },
  { id: 17, name: "虚構の地平", image: "assets/items/item017.svg", description: "平坦であることだけを許された線", weight: "62g", opacity: "5%" },
  { id: 18, name: "徒花の影", image: "assets/items/item018.svg", description: "咲くことなく、ただそこに落ちた黒", weight: "40g", opacity: "18%" },
  { id: 19, name: "秒針の摩耗", image: "assets/items/item019.svg", description: "切り捨てられた時間の破片", weight: "27g", opacity: "47%" },
  { id: 20, name: "煉獄の残り火", image: "assets/items/item020.svg", description: "燻り続ける、鈍い熱の記憶", weight: "50g", opacity: "25%" },
  { id: 21, name: "深紅の沈黙", image: "assets/items/item021.svg", description: "言葉になるのを拒んだ激昂", weight: "43g", opacity: "30%" },
  { id: 22, name: "迷宮の調律", image: "assets/items/item022.svg", description: "狂った世界の帳尻を合わせる楔", weight: "36g", opacity: "55%" },
  { id: 23, name: "形骸化した約束", image: "assets/items/item023.svg", description: "意味を失ってもなお、形だけ残ったもの", weight: "58g", opacity: "7%" },
  { id: 24, name: "朧月夜の惑い", image: "assets/items/item024.svg", description: "輪郭を曖昧にぼかす、淡い光", weight: "22g", opacity: "78%" },
  { id: 25, name: "残響の墓標", image: "assets/items/item025.svg", description: "音が死に絶えた場所の、静かな証", weight: "65g", opacity: "2%" },
  { id: 26, name: "微小な鼓動", image: "assets/items/item026.svg", description: "耳を澄ませても、おそらく聴こえない", weight: "11g", opacity: "95%" },
  { id: 27, name: "黄昏の砂時計", image: "assets/items/item027.svg", description: "終わりへと滑り落ちる砂の輝き", weight: "39g", opacity: "42%" },
  { id: 28, name: "紺碧の呪縛", image: "assets/items/item028.svg", description: "逃れることのできない、冷たい深み", weight: "72g", opacity: "4%" },
  { id: 29, name: "剥離する夜", image: "assets/items/item029.svg", description: "朝に耐えかねて、千切れた闇", weight: "48g", opacity: "15%" },
  { id: 30, name: "終焉の結晶", image: "assets/items/item030.svg", description: "全ての光が収束し、何も映さなくなった果て", weight: "85g", opacity: "0%" }
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

// 取得（被る確率20% / 新規確率80% 調整版）
function addCollectionItem(level){
  // 1. 未取得と既取得のリストを分ける
  const uncollectedItems = collectionItems.filter(item => !collectedItems.includes(item.id));
  const collectedItemsList = collectionItems.filter(item => collectedItems.includes(item.id));
  
  let item;

  // 2. 確率の抽選（0.0 〜 1.0 のランダムな数）
  const isDuplicateDrop = Math.random() < 0.20; // 20%の確率でtrue

  if (isDuplicateDrop && collectedItemsList.length > 0) {
    // 【20%の運命】かつ「すでに持っているアイテム」が存在する場合、そこから抽選（被り発生）
    const randomIndex = Math.floor(Math.random() * collectedItemsList.length);
    item = collectedItemsList[randomIndex];
  } else if (uncollectedItems.length > 0) {
    // 【80%の運命】または「まだ何も持っていない最初期」は、未取得から抽選（新規獲得）
    const randomIndex = Math.floor(Math.random() * uncollectedItems.length);
    item = uncollectedItems[randomIndex];
  } else {
    // すでに全部コンプリートしている場合は、全アイテムから均等にランダム（再観測）
    const randomIndex = Math.floor(Math.random() * collectionItems.length);
    item = collectionItems[randomIndex];
  }

  if(!item) return;

  // 所持リストに未登録なら追加
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

// ==========================================
// ── 【修正版】競合を完全に回避する処理 ──
// ==========================================

// ポップアップの枠外（背景）を触ったら確実に閉じる処理
if (typeof itemPopup === 'undefined') {
  var itemPopup = document.getElementById("itemPopup");
}
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
if (typeof collectionBtn === 'undefined') {
  var collectionBtn = document.getElementById("collectionBtn");
}
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
if (typeof closeCollection === 'undefined') {
  var closeCollection = document.getElementById("closeCollection");
}
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
