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

  const data =
    localStorage.getItem(
      "glassCollection"
    );

  if(data){
    collectedItems = JSON.parse(data);
  }

}


// 保存
function saveCollection(){

  localStorage.setItem(
    "glassCollection",
    JSON.stringify(collectedItems)
  );

}



// 取得
function addCollectionItem(level){

  const item =
    collectionItems[level-1];


  if(!item) return;


  if(!collectedItems.includes(item.id)){

    collectedItems.push(item.id);

    saveCollection();


    showCollectionGet(item);

  }

}



// 獲得演出
function showCollectionGet(item){

  console.log(
    "獲得:",
    item.name
  );

}

function openCollection(){

  const grid =
    document.getElementById(
      "collectionGrid"
    );

  grid.innerHTML="";


  collectionItems.forEach(item=>{

    const div=document.createElement("div");

    // item.id が数値でも文字列でも正しく判定できるように型を統一
    if(collectedItems.includes(Number(item.id))){

      // ── 【変更】獲得済み：グリッド側は画像と名前だけにして、クリックできるようにする ──
      div.innerHTML=`
        <img src="${item.image}" style="cursor: pointer;">
        <h3>${item.name}</h3>
      `;

      // ── 【追加】獲得済みアイテムをクリックした時にポップアップを開く ──
      div.addEventListener('click', () => {
        document.getElementById("popupImageWrap").innerHTML = `<img src="${item.image}">`;
        document.getElementById("popupName").textContent = item.name;
        document.getElementById("popupDesc").textContent = item.description;
        document.getElementById("itemPopup").style.display = "flex";
      });

    }else{

      // ── 未獲得：？マークと、名前を「未観測」にして表示（こちらはクリック不可） ──
      div.innerHTML=`
        <div class="unknown">
          ?
        </div>
        <h3>未観測</h3>
      `;

    }


    grid.appendChild(div);

  });


  document.getElementById(
    "collectionView"
  ).style.display="flex";

}

// ── 【追加】ポップアップの枠外（背景）をクリックしたら閉じる処理 ──
document.getElementById("itemPopup").addEventListener("click", (e) => {
  // クリックされたのがポップアップの背景（itemPopup自身）だった場合だけ閉じる
  if (e.target === document.getElementById("itemPopup")) {
    document.getElementById("itemPopup").style.display = "none";
  }
});


document
.getElementById("collectionBtn")
.addEventListener(
"click",
()=>{

  loadCollection();
  openCollection();

});
document
.getElementById("closeCollection")
.addEventListener(
"click",
()=>{

 document.getElementById(
 "collectionView"
 ).style.display="none";

});
