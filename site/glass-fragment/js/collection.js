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
