// ===============================
// 硝子片収集管理（純和風・泥沼仕様）
// ===============================

// 稀少度分類: 'C'=常融(並) / 'R'=希硝(稀) / 'L'=幻晶(極めて稀)
const collectionItems = [
  { id: 1, name: "灰色の器", image: "assets/items/item001.svg", description: "静かに沈黙する欠片", weight: "38g", opacity: "14%", rarity: "C", weightValue: 100 },
  { id: 2, name: "青い残響", image: "assets/items/item002.svg", description: "光をわずかに返す硝子", weight: "24g", opacity: "65%", rarity: "C", weightValue: 100 },
  { id: 3, name: "忘れられた輪郭", image: "assets/items/item003.svg", description: "誰かが見落とした形", weight: "51g", opacity: "3%", rarity: "R", weightValue: 30 },
  { id: 4, name: "琥珀の微睡み", image: "assets/items/item004.svg", description: "夕刻の熱を閉じ込めた結晶", weight: "42g", opacity: "40%", rarity: "C", weightValue: 100 },
  { id: 5, name: "深海の底流", image: "assets/items/item005.svg", description: "圧せられて深く、昏い青", weight: "68g", opacity: "8%", rarity: "R", weightValue: 30 },
  { id: 6, name: "微細な亀裂", image: "assets/items/item006.svg", description: "何かが生まれる直前の線", weight: "15g", opacity: "88%", rarity: "C", weightValue: 100 },
  { id: 7, name: "水面の記憶", image: "assets/items/item007.svg", description: "揺らぎだけが定着した面", weight: "29g", opacity: "92%", rarity: "C", weightValue: 100 },
  { id: 8, name: "凍てつく吐息", image: "assets/items/item008.svg", description: "熱を拒絶する、鋭利な白", weight: "33g", opacity: "50%", rarity: "C", weightValue: 100 },
  { id: 9, name: "煤けた星屑", image: "assets/items/item009.svg", description: "輝きを忘れた夜の残骸", weight: "47g", opacity: "R", weightValue: 30 },
  { id: 10, name: "透明な境界", image: "assets/items/item010.svg", description: "在る事すら見失うほどの無", weight: "12g", opacity: "99%", rarity: "L", weightValue: 5 },
  { id: 11, name: "新緑の脈絡", image: "assets/items/item011.svg", description: "未だ瑞々しさを偽る偽物の葉", weight: "21g", opacity: "73%", rarity: "C", weightValue: 100 },
  { id: 12, name: "薄明の残光", image: "assets/items/item012.svg", description: "夜が満ちる前の、最後の抵抗", weight: "45g", opacity: "C", weightValue: 100 },
  { id: 13, name: "微熱の不在", image: "assets/items/item013.svg", description: "かつて誰かが触れていた名残", weight: "19g", opacity: "82%", rarity: "C", weightValue: 100 },
  { id: 14, name: "濁った祈り", image: "assets/items/item014.svg", description: "無数の願いが沈殿した結晶", weight: "55g", opacity: "11%", rarity: "R", weightValue: 30 },
  { id: 15, name: "白夜の迷子", image: "assets/items/item015.svg", description: "影を奪われ、立ち尽くす白", weight: "31g", opacity: "60%", rarity: "C", weightValue: 100 },
  { id: 16, name: "乾いた涙痕", image: "assets/items/item016.svg", description: "悲しみだけが蒸発したあとの塩", weight: "14g", opacity: "90%", rarity: "C", weightValue: 100 },
  { id: 17, name: "虚構の地平", image: "assets/items/item017.svg", description: "平坦であることだけを許された線", weight: "62g", opacity: "5%", rarity: "R", weightValue: 30 },
  { id: 18, name: "徒花の影", image: "assets/items/item018.svg", description: "咲くことなく、ただそこに落ちた黒", weight: "40g", opacity: "18%", rarity: "C", weightValue: 100 },
  { id: 19, name: "秒針の摩耗", image: "assets/items/item019.svg", description: "切り捨てられた時間の破片", weight: "27g", opacity: "47%", rarity: "C", weightValue: 100 },
  { id: 20, name: "煉獄の残り火", image: "assets/items/item020.svg", description: "燻り続ける、鈍い熱の記憶", weight: "50g", opacity: "25%", rarity: "R", weightValue: 30 },
  { id: 21, name: "深紅 of 沈黙", image: "assets/items/item021.svg", description: "言葉になるのを拒んだ激昂", weight: "43g", opacity: "30%", rarity: "R", weightValue: 30 },
  { id: 22, name: "迷宮の調律", image: "assets/items/item022.svg", description: "狂った世界の帳尻を合わせる楔", weight: "36g", opacity: "55%", rarity: "C", weightValue: 100 },
  { id: 23, name: "形骸化した約束", image: "assets/items/item023.svg", description: "意味を失ってもなお、形だけ残ったもの", weight: "58g", opacity: "7%", rarity: "L", weightValue: 5 },
  { id: 24, name: "朧月夜の惑い", image: "assets/items/item024.svg", description: "輪郭を曖昧にぼかす、淡い光", weight: "22g", opacity: "78%", rarity: "C", weightValue: 100 },
  { id: 25, name: "残響の墓標", image: "assets/items/item025.svg", description: "音が死に絶えた場所の、静かな証", weight: "65g", opacity: "2%", rarity: "L", weightValue: 5 },
  { id: 26, name: "微小な鼓動", image: "assets/items/item026.svg", description: "耳を澄ませても、おそらく聴こえない", weight: "11g", opacity: "95%", rarity: "C", weightValue: 100 },
  { id: 27, name: "黄昏の砂時計", image: "assets/items/item027.svg", description: "終わりへと滑り落ちる砂の輝き", weight: "39g", opacity: "42%", rarity: "C", weightValue: 100 },
  { id: 28, name: "紺碧の呪縛", image: "assets/items/item028.svg", description: "逃れることのできない、冷たい深み", weight: "72g", opacity: "4%", rarity: "R", weightValue: 30 },
  { id: 29, name: "剥離する夜", image: "assets/items/item029.svg", description: "朝に耐えかねて、千切れた闇", weight: "48g", opacity: "15%", rarity: "R", weightValue: 30 },
  { id: 30, name: "終焉の結晶", image: "assets/items/item030.svg", description: "全ての光が収束し、何も映さなくなった果て", weight: "85g", opacity: "0%", rarity: "L", weightValue: 5 }
];

let collectedItems = [];
let collectionStats = {};

function loadCollection(){
  const data = localStorage.getItem("glassCollection");
  if(data) collectedItems = JSON.parse(data);
  const statsData = localStorage.getItem("glassCollectionStats");
  if(statsData) collectionStats = JSON.parse(statsData);
}
function saveCollection(){
  localStorage.setItem("glassCollection", JSON.stringify(collectedItems));
  localStorage.setItem("glassCollectionStats", JSON.stringify(collectionStats));
}

// 総重量の表示更新（ここも日本語表記に連動できるように要素の更新だけ担保）
function updateTotalWeightDisplay() {
  let total = 0;
  collectionItems.forEach(item => {
    if (collectedItems.includes(Number(item.id))) {
      total += (parseInt(item.weight) || 0);
    }
  });
  const titleWeightEl = document.getElementById("titleTotalWeight");
  if (titleWeightEl) titleWeightEl.textContent = `総重量: ${total}g`;
  const clearWeightEl = document.getElementById("clearTotalWeight");
  if (clearWeightEl) clearWeightEl.textContent = `総重量: ${total}g`;
  return total;
}

// 取得（重み付きランダム抽選）
function addCollectionItem(level){
  const totalWeight = collectionItems.reduce((sum, item) => sum + item.weightValue, 0);
  let randomValue = Math.random() * totalWeight;
  let selectedItem = collectionItems[0];

  for (const item of collectionItems) {
    if (randomValue < item.weightValue) {
      selectedItem = item;
      break;
    }
    randomValue -= item.weightValue;
  }

  if(!selectedItem) return;

  if(!collectedItems.includes(selectedItem.id)){
    collectedItems.push(selectedItem.id);
  }

  if(!collectionStats[selectedItem.id]){
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    
    collectionStats[selectedItem.id] = {
      date: `${yyyy}.${mm}.${dd} ${hh}:${mi}`,
      count: 1
    };
  } else {
    collectionStats[selectedItem.id].count += 1;
  }

  saveCollection();
  updateTotalWeightDisplay();
  showCollectionGet(selectedItem);
}

function showCollectionGet(item){
  console.log("採取:", item.name);
}

// コレクション画面表示
function openCollection(){
  const grid = document.getElementById("collectionGrid");
  grid.innerHTML="";

  collectionItems.forEach(item=>{
    const div = document.createElement("div");
    
    // 稀少度の日本語表記化
    let rarityText = "常融";
    if(item.rarity === "R") rarityText = "希硝";
    if(item.rarity === "L") rarityText = "幻晶";

    if(collectedItems.includes(Number(item.id))){
      // 【観測済み】
      div.innerHTML=`
        <span class="rarity-badge rarity-${item.rarity.toLowerCase()}">${rarityText}</span>
        <img src="${item.image}" style="cursor: pointer; pointer-events: none;">
        <h3 style="pointer-events: none;">${item.name}</h3>
      `;
      div.style.cursor = "pointer";

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
                <tr><td>稀少度</td><td>${rarityText}</td></tr>
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
      // 【未観測】
      div.innerHTML=`
        <span class="rarity-badge rarity-${item.rarity.toLowerCase()}">${rarityText}</span>
        <div class="unknown">?</div>
        <h3>未観測</h3>
      `;
    }

    grid.appendChild(div);
  });

  document.getElementById("collectionView").style.display = "flex";
}

// ── 以下、制御処理（変更なし） ──
if (typeof itemPopup === 'undefined') { var itemPopup = document.getElementById("itemPopup"); }
if (itemPopup) {
  const closePopupAction = (e) => {
    if (e.target === itemPopup) { e.preventDefault(); e.stopPropagation(); itemPopup.style.display = "none"; }
  };
  itemPopup.addEventListener("touchstart", closePopupAction, { passive: false });
  itemPopup.addEventListener("click", closePopupAction);
}
if (typeof collectionBtn === 'undefined') { var collectionBtn = document.getElementById("collectionBtn"); }
if (collectionBtn) {
  const handleOpenCollection = (e) => {
    e.preventDefault(); e.stopPropagation(); loadCollection(); updateTotalWeightDisplay(); openCollection();
  };
  collectionBtn.addEventListener("touchstart", handleOpenCollection, { passive: false });
  collectionBtn.addEventListener("click", handleOpenCollection);
}
if (typeof closeCollection === 'undefined') { var closeCollection = document.getElementById("closeCollection"); }
if (closeCollection) {
  const handleCloseCollection = (e) => {
    e.preventDefault(); e.stopPropagation(); document.getElementById("collectionView").style.display = "none";
  };
  closeCollection.addEventListener("touchstart", handleCloseCollection, { passive: false });
  closeCollection.addEventListener("click", handleCloseCollection);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { loadCollection(); updateTotalWeightDisplay(); });
} else {
  loadCollection(); updateTotalWeightDisplay();
}
