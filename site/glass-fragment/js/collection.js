// ===============================
// 硝子片収集管理（純和風・泥沼仕様・30個完全版・構造修復・完全同期版）
// ===============================

const collectionItems = [
  { id: 1, name: "灰色の器", image: "assets/items/item001.svg", description: "静かに沈黙する欠片", weight: "38g", opacity: "14%", rarity: "C", weightValue: 100 },
  { id: 2, name: "青い残響", image: "assets/items/item002.svg", description: "光をわずかに返す硝子", weight: "24g", opacity: "65%", rarity: "C", weightValue: 100 },
  { id: 3, name: "忘れられた輪郭", image: "assets/items/item003.svg", description: "誰かが見落とした形", weight: "51g", opacity: "3%", rarity: "R", weightValue: 30 },
  { id: 4, name: "琥珀の微睡み", image: "assets/items/item004.svg", description: "夕刻の熱を閉じ込めた結晶", weight: "42g", opacity: "40%", rarity: "C", weightValue: 100 },
  { id: 5, name: "深海の底流", image: "assets/items/item005.svg", description: "圧せられて深く、昏い青", weight: "66g", opacity: "8%", rarity: "R", weightValue: 30 },
  { id: 6, name: "微細な亀裂", image: "assets/items/item006.svg", description: "何かが生まれる直前の線", weight: "15g", opacity: "88%", rarity: "C", weightValue: 100 },
  { id: 7, name: "水面の記憶", image: "assets/items/item007.svg", description: "揺らぎだけが定着した面", weight: "29g", opacity: "92%", rarity: "C", weightValue: 100 },
  { id: 8, name: "凍てつく吐息", image: "assets/items/item008.svg", description: "熱を拒絶する、鋭利な白", weight: "33g", opacity: "50%", rarity: "C", weightValue: 100 },
  { id: 9, name: "煤けた星屑", image: "assets/items/item009.svg", description: "輝きを忘れた夜の残骸", weight: "47g", opacity: "10%", rarity: "R", weightValue: 30 }, 
  { id: 10, name: "透明な境界", image: "assets/items/item010.svg", description: "在る事すら見失うほどの無", weight: "12g", opacity: "99%", rarity: "L", weightValue: 5 },
  { id: 11, name: "新緑の脈絡", image: "assets/items/item011.svg", description: "未だ瑞々しさを偽る偽物の葉", weight: "21g", opacity: "73%", rarity: "C", weightValue: 100 },
  { id: 12, name: "薄明の残光", image: "assets/items/item012.svg", description: "夜が満ちる前の、最後の抵抗", weight: "45g", opacity: "20%", rarity: "C", weightValue: 100 }, 
  { id: 13, name: "微熱の不在", image: "assets/items/item013.svg", description: "かつて誰かが触れていた名残", weight: "19g", opacity: "82%", rarity: "C", weightValue: 100 },
  { id: 14, name: "濁った祈り", image: "assets/items/item014.svg", description: "無数の願いが沈殿した結晶", weight: "55g", opacity: "11%", rarity: "R", weightValue: 30 },
  { id: 15, name: "白夜の迷子", image: "assets/items/item015.svg", description: "影を奪われ、立ち尽くす白", weight: "31g", opacity: "60%", rarity: "C", weightValue: 100 },
  { id: 16, name: "乾いた涙痕", image: "assets/items/item016.svg", description: "悲しみだけが蒸発したあとの塩", weight: "14g", opacity: "90%", rarity: "C", weightValue: 100 },
  { id: 17, name: "虚構の地平", image: "assets/items/item017.svg", description: "平坦であることだけを許された線", weight: "62g", opacity: "5%", rarity: "R", weightValue: 30 },
  { id: 18, name: "徒花の影", image: "assets/items/item018.svg", description: "咲くことなく、ただそこに落ちた黒", weight: "40g", opacity: "18%", rarity: "C", weightValue: 100 },
  { id: 19, name: "秒針の摩耗", image: "assets/items/item019.svg", description: "切り捨てられた時間の破片", weight: "27g", opacity: "47%", rarity: "C", weightValue: 100 },
  { id: 20, name: "煉獄の残り火", image: "assets/items/item020.svg", description: "燻り続ける、鈍い熱の記憶", weight: "50g", opacity: "25%", rarity: "R", weightValue: 30 },
  { id: 21, name: "深紅の沈黙", image: "assets/items/item021.svg", description: "言葉になるのを拒んだ激昂", weight: "43g", opacity: "30%", rarity: "R", weightValue: 30 },
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

function loadCollection() {
  const data = localStorage.getItem("glassCollection");
  if (data) collectedItems = JSON.parse(data);
  const statsData = localStorage.getItem("glassCollectionStats");
  if (statsData) collectionStats = JSON.parse(statsData);
}

function saveCollection() {
  localStorage.setItem("glassCollection", JSON.stringify(collectedItems));
  localStorage.setItem("glassCollectionStats", JSON.stringify(collectionStats));
}

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

function addCollectionItem(clearedLevel) {
  const uncollectedItems = collectionItems.filter(item => !collectedItems.includes(Number(item.id)));
  
  if (uncollectedItems.length === 0) {
    return { name: "全硝子片 観測完了" };
  }

  const totalWeightOfUncollected = uncollectedItems.reduce((sum, item) => sum + item.weightValue, 0);
  let randomValue = Math.random() * totalWeightOfUncollected;
  let selectedItem = uncollectedItems[0];

  for (const item of uncollectedItems) {
    if (randomValue < item.weightValue) {
      selectedItem = item;
      break;
    }
    randomValue -= item.weightValue;
  }

  if (!collectedItems.includes(selectedItem.id)) collectedItems.push(selectedItem.id);
  
  if (!collectionStats[selectedItem.id]) {
    const now = new Date();
    collectionStats[selectedItem.id] = {
      date: `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
      count: 1
    };
  } else {
    collectionStats[selectedItem.id].count += 1;
  }

  saveCollection();
  updateTotalWeightDisplay();

  return selectedItem;
}

// ── 【新規・改修】新SPEC準拠 コレクション画面構築ロジック ──
function openCollection() {
  const collectionView = document.getElementById("collectionView");
  if (!collectionView) return;

  // 古いグリッドを直接クリアするのではなく、まずは表示エリア全体のコンテナを探すか作る
  let container = document.getElementById("collectionSectionsContainer");
  if (!container) {
    // 初回のみ：既存の #collectionGrid をコンテナとして流用するか、新しく挿入する
    const oldGrid = document.getElementById("collectionGrid");
    if (oldGrid) {
      // 既存のグリッドのラッパーとして再定義
      oldGrid.style.display = "none"; // 古いフラットグリッドは非表示
      container = document.createElement("div");
      container.id = "collectionSectionsContainer";
      container.style.width = "100%";
      container.style.maxWidth = "800px";
      oldGrid.parentNode.insertBefore(container, oldGrid);
    } else {
      return;
    }
  }
  container.innerHTML = ""; // 毎回完全に初期化

// ── 【修正版】左上の戻るボタン（下のボタンと完全同期） ──
const backBtnWrap = document.createElement("div");
backBtnWrap.className = "collection-back-btn-wrap";
backBtnWrap.innerHTML = `
  <button class="collection-top-back-btn" onclick="const bottomBtn = document.getElementById('closeCollection'); if(bottomBtn) { bottomBtn.click(); } else { document.getElementById('collectionView').style.display='none'; }">
    <span>←</span> 戻る
  </button>
`;
container.appendChild(backBtnWrap);
  
  // 1. レア度マッピング定義（SPEC順、ラベル同期）
  const raritySpecs = [
    { key: "L", label: "幻晶", badgeClass: "rarity-l", borderClass: "rarity-border-l", textClass: "rarity-text-l" },
    { key: "R", label: "希有", badgeClass: "rarity-r", borderClass: "rarity-border-r", textClass: "rarity-text-r" },
    { key: "C", label: "常触", badgeClass: "rarity-c", borderClass: "rarity-border-c", textClass: "rarity-text-c" }
  ];

  // 2. レア度ごとにセクションを確定論的にループ生成
  raritySpecs.forEach(spec => {
    // このレア度に属する全アイテムを抽出
    const itemsInRarity = collectionItems.filter(item => item.rarity === spec.key);
    if (itemsInRarity.length === 0) return; // 該当データがなければスキップ

    // 各アイテムの獲得フラグを付与
    const processedItems = itemsInRarity.map(item => ({
      ...item,
      obtained: collectedItems.includes(Number(item.id))
    }));

    // SPEC準拠ソート: 1. 獲得済みが前(true->false) / 2. ID昇順(ASC)
    processedItems.sort((a, b) => {
      if (a.obtained !== b.obtained) {
        return a.obtained ? -1 : 1; // obtained == true が先
      }
      return a.id - b.id; // display_id ASC
    });

    // 獲得カウント計算 (RARITY_PROGRESS)
    const obtainedCount = processedItems.filter(item => item.obtained).length;
    const totalCount = processedItems.length;

    // セクション全体のHTML構造を作成
    const sectionEl = document.createElement("section");
    sectionEl.className = "collection-section";

    // ヘッダー（レア度名 ＆ 進捗表示）
    const headerEl = document.createElement("div");
    headerEl.className = "collection-section-header";
    headerEl.innerHTML = `
      <span>${spec.label}</span>
      <span class="collection-section-progress">${obtainedCount}/${totalCount}</span>
    `;
    sectionEl.appendChild(headerEl);

    // アイテムを並べるためのグリッドラッパー（CSSで定義した新しいクラス名）
    const gridEl = document.createElement("div");
    gridEl.className = "collection-grid-wrap";

    // ソート済みのアイテムをカード化して流し込む
    processedItems.forEach(item => {
      const div = document.createElement("div");
      
      if (item.obtained) {
        // ── 獲得済み（obtained == true）の表示 ──
        div.className = `collection-item-box ${spec.borderClass} item-obtained`;
        div.style.cursor = "pointer";
        div.innerHTML = `
          <span class="rarity-badge ${spec.badgeClass}">${spec.label}</span>
          <img src="${item.image}" onerror="this.style.display='none'; this.parentNode.classList.add('img-error');">
          <h3>${item.name}</h3>
        `;
        
        // 詳細ポップアップのイベントリスナー
        div.addEventListener('click', () => {
          const itemPopup = document.getElementById("itemPopup");
          if (!itemPopup) return;
          
          const stats = collectionStats[item.id] || { date: "----.--.-- --:--", count: 1 };
          document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}" onerror="this.style.display='none';">`;
          document.getElementById("popupName").textContent = item.name;
          document.getElementById("popupDesc").innerHTML =
            `${item.description}<div class="popup-stats">
              <table>
                <tr><td>稀少度</td><td><span class="${spec.textClass}">${spec.label}</span></td></tr>
                <tr><td>重量</td><td>${item.weight}</td></tr>
                <tr><td>採取日時</td><td>${stats.date}</td></tr>
                <tr><td>再観測</td><td>${stats.count}回</td></tr>
              </table>
            </div>
          `;
          itemPopup.style.display = "flex";
        });

      } else {
        // ── 未観測（obtained == false）の表示 ──
        div.className = `collection-item-box item-unobtained`;
        div.innerHTML = `
          <span class="rarity-badge ${spec.badgeClass}">${spec.label}</span>
          <div class="unknown">?</div>
          <h3>未観測</h3>
        `;
      }
      gridEl.appendChild(div);
    });

    sectionEl.appendChild(gridEl);
    container.appendChild(sectionEl);
  });

  // 最後に表示を flex に切り替えて開く
  collectionView.style.display = "flex";
}

// 初期化・イベント設定
window.resetCollectionMemory = function() {
  localStorage.removeItem("glassCollection");
  localStorage.removeItem("glassCollectionStats");
  collectedItems = [];
  collectionStats = {};
};

document.addEventListener("DOMContentLoaded", () => {
  loadCollection();
  updateTotalWeightDisplay();
  
  const closePopup = document.getElementById("itemPopup");
  if (closePopup) {
    closePopup.addEventListener("click", (e) => { 
      if(e.target === closePopup) closePopup.style.display = "none"; 
    });
  }
  
  const btn = document.getElementById("collectionBtn");
  if (btn) btn.addEventListener("click", openCollection);
});
