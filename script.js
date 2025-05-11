const gridSize = 6;
let board = [];
let emptyRow = gridSize - 1;
let emptyCol = gridSize - 1;
let currentUserId = null;
let moveCount = 0;
let startTime = null;
let timerInterval = null;
let totalPlayTime = 0;

// 加入当前 ID 到列表（并只保留最多 10 个）
function updateIdList(id) {
  let idList = JSON.parse(localStorage.getItem("puzzle_id_list") || "[]");
  idList = idList.filter(i => i !== id); // 去重
  idList.unshift(id);
  if (idList.length > 10) idList = idList.slice(0, 10);
  localStorage.setItem("puzzle_id_list", JSON.stringify(idList));
}

// 查看已有 ID
function showIdList() {
  const idList = JSON.parse(localStorage.getItem("puzzle_id_list") || "[]");
  if (idList.length === 0) {
    alert("当前无任何存档 ID");
    return;
  }
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>当前设备上的存档 ID 列表</h2>
      <ul style="text-align:left; max-height:200px; overflow:auto;">
        ${idList.map(id => `<li><b>${id}</b></li>`).join("")}
      </ul>
      <button onclick="this.parentElement.parentElement.remove()">关闭</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function showCredits() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <h2>致谢名单</h2>
      <ul style="text-align: left; font-size: 14px; line-height: 1.6;">
        <li><b>bluetide_蓝水</b> - 2024冠军赛照片</li>
        <li><b>老闆我要一根胡蘿蔔🥕</b> - 2023春锦赛照片</li>
        <li><b>凉辰muuuuu_</b> - 2017全运会照片、2023合照</li>
        <li><b>是快乐小熊吗0122</b> - 2025春锦赛照片</li>
        <li><b>爱吃苹果mo、干吃奶盖</b> - 校对</li>
        <li><b>鹤白要开心</b> - 提供美工建议</li>
        <li><b>OpenAI ChatGPT</b> - 编程协助</li>
        <li><b>各大媒体，闫子贝、孙佳俊本人，等其他照片原作者——致以诚挚感谢</b> </li>
      </ul>
      <button onclick="this.parentElement.parentElement.remove()">关闭</button>
    </div>
  `;
  document.body.appendChild(modal);
}


// 初始化棋盘
function generateBoard(fixedPositions = []) {
  const saved = loadBoardFromStorage(currentUserId);

  if (saved) {
    board = saved.board;
    emptyRow = saved.emptyRow;
    emptyCol = saved.emptyCol;
    moveCount = saved.moveCount || 0;
    totalPlayTime = saved.totalPlayTime || 0;
    startTime = Date.now();
    updateStatus();
    document.getElementById("welcomeText").innerText = `欢迎回来 ${currentUserId}`;
    document.getElementById("statsText").innerText = `上次时间: ${saved.lastPlayed || '未知'}\n步数: ${moveCount}`;
    document.getElementById("infoModal").style.display = "flex";
  } else {
    board = [];
    let count = 1;
    for (let i = 0; i < gridSize; i++) {
      board.push([]);
      for (let j = 0; j < gridSize; j++) {
        board[i][j] = count++;
      }
    }
    board[gridSize - 1][gridSize - 1] = 0;
    emptyRow = gridSize - 1;
    emptyCol = gridSize - 1;

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let lastMove = null;

    for (let step = 0; step < 150; step++) {
      const candidates = directions.filter(([dr, dc]) => {
        const nr = emptyRow + dr, nc = emptyCol + dc;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
        if (lastMove && nr === lastMove[0] && nc === lastMove[1]) return false;
        if (fixedPositions.some(([fr, fc]) =>
          (nr === fr && nc === fc) || (emptyRow === fr && emptyCol === fc)
        )) return false;
        
        return true;
      });

      if (candidates.length === 0) break;
      const [dr, dc] = candidates[Math.floor(Math.random() * candidates.length)];
      const nr = emptyRow + dr, nc = emptyCol + dc;

      board[emptyRow][emptyCol] = board[nr][nc];
      board[nr][nc] = 0;
      lastMove = [emptyRow, emptyCol];
      emptyRow = nr;
      emptyCol = nc;
    }

    moveCount = 0;
    totalPlayTime = 0;
    startTime = Date.now();
  }

  // ✅ Always update ID list
  updateIdList(currentUserId);
}

function render() {
  const puzzle = document.getElementById("puzzle");
  puzzle.innerHTML = "";
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const val = board[row][col];
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.row = row;
      tile.dataset.col = col;
      if (val === 0) {
        tile.classList.add("empty");
      } else {
        tile.style.backgroundImage = `url('images/${val}.png')`;
        tile.addEventListener("click", () => tryMove(row, col));
      }
      puzzle.appendChild(tile);
    }
  }
  updateStatus();
  saveBoardToStorage(currentUserId);
}

const winTitles = [
  "结局1: 别跳那个箱子！",
  "结局2: 我的一个省队队友",
  "结局3: 新年快乐",
  "结局4: 不许抢肉肉的猫粮！",
  "结局5: v我50万助我回武汉",
  "结局6: 闫队...闫队呢？",
  "结局7: 我帮你回忆一下",
  "结局8: 现在也不晚",
  "真结局: 好坏都爱你"
];

const winMessages = [
  `孙佳俊在全锦赛后发烧晕了过去，绑定了一个“时间回溯系统”。
他冲进泳馆时，声音几乎是吼出来的。闫子贝起跳动作做了一半，诧异地看向他。
几个月前在大巴后座流过的眼泪至今没有干涸。这次，他不会再让他错过。
他把闫子贝拉下来：“你想游到巴黎，不是吗？听我这一次好吗？”
巴黎奥运会，闫子贝按照计划游了男子混接预赛。决赛当天，电子计时牌照常亮起。孙佳俊恍惚地从最高领奖台上走下来，直到被拥入一个熟悉的怀抱。
“孙佳牛逼！太棒了佳佳！”
听到他胸腔传来的心跳，才终于感觉脚踩在了地上。
“也祝贺你，师哥。”
`,
  `“爸爸我想回家。”
“别怕，来，这位是我以前的省队队友，让他教你蝶泳。”
闫子贝介绍得平静，像在讲一个久远得可以忽略的名字。
孙佳俊站在一旁，点头笑了笑，没多说。闫子贝从身后拽出一个小孩，抬头看他一眼，又很快低下头去。在很多个夏天里，他问“师哥，我动作标准吗？”的时候，他看自己也是这个样子吗？
孙佳看着水里那个新生的身影，忽然想起很多年前，在东京的热浪里，在一次又一次冠军赛结束后，在闫子贝退役的那个晚上，问他：“我们现在去哪儿？”
去吃饭，去更衣室，在酒店楼下等你，闫子贝总是这样回答他，在水池里的日子，目的地总是具体的，如同计时器上的成绩，给他一种虚幻的安全感。
所以呢，我们现在去哪儿呢，师哥。
`,
  `是凌晨零点刚过，孙佳俊躺在床上刷到这条消息。上一条，是去年的同一时间。
他点开那个人的头像看了几秒，没回。
过去两年，老家游泳队发布紧急调令，孙佳俊去了宜昌，闫子贝回了襄阳。
他偶尔还会看到闫子贝的照片，带着学生出征，站在池边，神情比以前更冷静了些。他们不再出现在彼此的合影里，但都还在那条水线上。
后来有一次，孙佳俊无意中在一个青年城市运动会的花名册上看到了熟悉的三个字，同为教练员的位置，就那样静静躺在自己名字旁边。
他盯着那三个字看了很久，然后默默关掉了文件。 
`,
  `闫子贝把袋子抢回来，指着那团正蹲在沙发扶手上的灰白毛球，语气又气又无奈，“不是说好了给你煮三文鱼吗？”
被诅咒的奥运冠军会在25岁变成猫。刚刚被训斥的毛球立马跳上闫子贝的膝盖，在他怀里盘成一小团，喉咙发出咕噜咕噜的声音。
那天是全运会结束后的第二晚。孙佳穿着羽绒服走在回酒店的路上，觉得脖子有点痒，低头一看，手指间全是细软的灰毛。再抬头时一片天旋地转，世界已然放大数倍。
他在游跳中心晃荡两天，躲过十几双企图把他抱走的手，最后跳进闫子贝宿舍的窗户。
每天晚上，闫子贝都会低头拍拍他的膝盖，“过来。”然后给他讲一天训练的见闻。孙佳俊总会很快地跳上去，在他怀里安心地闭上眼睛。
闫子贝总是会说一些他不爱听，却不得不回答的话，比如“佳佳长大了，”比如他的退役计划。
其实当猫也挺好。虽然不能训练让他每日倍感焦虑，但是同时，另一种焦虑被莫名舒缓了。如果一直是猫，是不是就可以不说话，不离开，不长大。
`,
  `“我是游泳运动员闫子贝，v我50万助我回武汉。人命关天！十万火急！”
头像是c罗，备注是“闫队（不接我电话）”，看起来没得错，突然一个视频通话打来，孙佳俊差点没把手机扔泳池里。
画面里，闫子贝被绑在一张塑料椅上，脸上沾着血，朝着屏幕大喊：“孙佳俊……救我，我不能没有你。”
如此煽情的话术，必定不可能是闫子贝。他正要挂断，对面突然抽噎了一下，喊了声“佳佳”。
五分钟后，他转了五十万。
又过了三小时，他接到真正闫子贝的电话：“你为啥把我拉黑？队医说你被人骗了？”
三天后，其他省队都知道了：奥运冠军孙佳俊由于轻信AI合成视频，被骗掉一大半奖金。
湖北游泳一组大群某小队员： “原来冠军也会被骗啊，那我也放心了！”
`,
  `“2023年了，终于，沉寂多年的中国蛙泳终于崛起了。”
那是他在训练馆的音响里听见的，教练放的访谈节目，声音忽远忽近。孙佳愣了一下，没立刻反应过来是哪一年。
“怎么又放以前的节目了……这都多少年前”他嘀咕着摘掉泳帽，水珠顺着额角滑下来，耳机还在重复着，直到听到“蛙王覃海洋。”
他一下子怔住了。
他撑着泳池边站起身，走到更衣室去翻手机，打开通讯录，搜索“闫”。
没有。
他盯着空白一栏，莫名地觉得背后发冷。翻相册，2018，2021，2023，比赛照还在，领奖台还在，但他站在最中间，左右都是不熟悉的脸。
微博打开时手心都是汗。他去找2021东奥名单，没有那个人的名字。他不灰心，又去找百蛙第六名刷新中国最好成绩的微博，没有，再往前翻，出征名单上甚至无人入围百蛙这个项目。
他终于像是被扯掉了什么，抓住一个队友的胳膊：“闫队，闫队呢？”
“谁啊？”队友摘下泳帽，“佳哥你说谁？我们从来没有指定的队长呀。”
孙佳一瞬间说不出话。他低下头，水从他睫毛上滴下来，滴到脚面上，冰凉而真实。
所以那六年呢，那每一次跳发前的击掌，那个总是比他先看向终点的人，那个在福冈对着领奖台上的他说“佳佳，回头”的身影。
都不是真实的吗？
`,
  `闫子贝退役那晚喝醉了，散场后被孙佳俊带回宿舍。刚被放到床上就抱着孙佳俊的腰不撒手，一边哭一边喊 “别走”。 
“睡觉，”他指着床上的人命令道。那人盯着他的手指看了一会儿，盯得快成斗鸡眼了，孙佳终于绷不住，把手撇开，伸手就要给他盖被子，“师哥，该睡了，我求你了。”
第二天清晨，闫子贝因为孙佳俊忘记拉窗帘而早早被弄醒，当他的视线终于聚焦在孙佳俊脸上，说的第一句话就是，“昨天我喝醉了，发生了什么事吗我不记得了嘿嘿。”
孙佳俊打开手机，播放录音，里面是他的鬼哭狼嚎。闫了贝呆若木鸡。 
孙佳俊拍了拍他的肩，语气轻松：“想起来了吧？先去洗漱吧，回头还有事要说。”。
`,
  `孙佳俊发烧了，高烧不退还坚持训练。已经是教练的闫子贝出差途中“顺路”来关怀一下前队友。
“烧成这样还不肯好好休息？”闫子贝皱着眉，把他按回床上，“下午别下水了，听话。”
孙佳俊哑着嗓子哼哼两声：“你来干什么？”
 “我怎么不能来？你还记得小时候你感冒也是我照顾你吗？”
“你那时候比现在还黏人。”闫子贝笑着帮他按压酸痛的手臂，“一发烧就哭。”
“我现在又没哭。”孙佳俊轻哼一声。
第二天孙佳俊醒来收到闫子贝的信息： “别硬撑。下午让队医看了再决定训不训练。”
“你走的时候怎么没叫我？”
“我赶高铁啊，大清早的五点多，你还病着呢多睡会儿，等你回来了又不是见不着。”
孙佳俊打字的手停了。
“有家新开门的川菜馆，等你回来了一起去试试？”
他真的和闫子贝一起吃了川菜，再后来，还一起看了电影，爬了山。一次登闫子贝家后面的小山坡，孙佳俊回头笑着说：“你小时候要是带我来就好了。”
闫子贝站在他身后，轻声道：“现在来也不晚。”
`,
  `比赛结束，泳池恢复平静，观众散去，孙佳俊给闫子贝发信息，跟他说马上弄好了，让他等一下。走出更衣室，闫子贝超他招招手，一如他们遇见的那个清晨。
他们之间从不需要太多言语，一个眼神，就能读懂彼此的疲惫与坚持。精确到零点零几秒的时间和几块奖牌，好像他们的人生也被量化，成功和失败都具象在某个浓缩的瞬间。
这些瞬间如同早上七点的阳光，透过门锁上的小孔落下一道细瘦但炽热的光柱，在漫长的时间中被拉得很长，不断被观摩，不断被赋义。
但是门里面才是他们大部分的人生，成绩与野心也同其他悄然而至的方物一样，需要不断安放，不断自洽，然后种出汗水无法浇灌的花。
不是只有痛苦才值得铭记，也不是非要弱小才配拥有依靠。希望所有曾经独自咽下的情绪，终有一天变得柔软可解。
泳池很小，世界很大。携手共进，各自纷呈。
`

];

function playFinalTileAnimation(callback) {
  const lastTile = document.querySelector(".tile.empty");
  if (lastTile) {
    const rect = lastTile.getBoundingClientRect();
    const finalPiece = document.createElement("div");
    finalPiece.id = "finalPiece";

    finalPiece.style.left = rect.left + "px";
    finalPiece.style.top = rect.top + "px";
    finalPiece.style.width = rect.width + "px";
    finalPiece.style.height = rect.height + "px";
    finalPiece.style.position = "fixed";
    finalPiece.style.backgroundImage = "url('images/36.png')";
    finalPiece.style.backgroundSize = "cover";
    finalPiece.style.backgroundPosition = "center";
    finalPiece.style.zIndex = "9999";
    finalPiece.style.borderRadius = "6px";
    finalPiece.style.pointerEvents = "none";
    finalPiece.style.animation = "shrinkIntoTile 0.5s ease forwards";

    document.body.appendChild(finalPiece);

    setTimeout(() => {
      lastTile.classList.remove("empty");
      lastTile.style.backgroundImage = "url('images/36.png')";
      finalPiece.remove();

      if (typeof callback === "function") callback(); // ✅ 动画结束后执行弹窗
    }, 1500);
  } else {
    if (typeof callback === "function") callback(); // 若没找到空格也继续执行
  }
}


function closeWinModal() {
  document.getElementById('winModal').style.display = 'none';
  playFinalTileAnimation();
}


function tryMove(row, col) {
  if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
    board[emptyRow][emptyCol] = board[row][col];
    board[row][col] = 0;
    emptyRow = row;
    emptyCol = col;
    moveCount++;
    render();
    if (checkWin()) {
      clearInterval(timerInterval);
      totalPlayTime += Date.now() - startTime;
      saveBoardToStorage(currentUserId);
      
      const min = Math.floor(totalPlayTime / 60000);
      const sec = Math.floor((totalPlayTime % 60000) / 1000);
      const i = Math.floor(Math.random() * winMessages.length);
       
      playFinalTileAnimation(() => {
        document.getElementById("winTitle").innerText = winTitles[i];
        document.getElementById("winText").innerText =
          `${winMessages[i]}\n\n总步数：${moveCount}\n累计用时：${min}分${sec}秒`;
        document.getElementById("winModal").style.display = "flex";
      });

    
    }
    
    
  }
}

// [TESTING]

function checkWin() {
  let count = 1;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (i === gridSize - 1 && j === gridSize - 1) return board[i][j] === 0;
      if (board[i][j] !== count) return false;
      count++;
    }
  }
  return true;
}

function updateStatus() {
  const now = Date.now();
  const elapsed = now - startTime;
  const total = totalPlayTime + elapsed;
  const min = Math.floor(total / 60000);
  const sec = Math.floor((total % 60000) / 1000);
  document.getElementById("statusBar").innerText = `ID: ${currentUserId} ｜ 步数: ${moveCount} ｜ 用时: ${min}分${sec}秒`;
}

function saveBoardToStorage(id) {
  if (!id) return;
  const data = {
    board,
    emptyRow,
    emptyCol,
    moveCount,
    totalPlayTime: totalPlayTime + (Date.now() - startTime),
    lastPlayed: new Date().toLocaleString()
  };
  localStorage.setItem("puzzle_" + id, JSON.stringify(data));
}

function loadBoardFromStorage(id) {
  if (!id) return null;
  const saved = localStorage.getItem("puzzle_" + id);
  return saved ? JSON.parse(saved) : null;
}

function setupTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(updateStatus, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.createElement("div");
  modal.id = "idModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>请输入你的ID</h2>
      <input type="text" id="userIdInput" placeholder="例如：alo123">
      <button id="startGameBtn">开始游戏</button>
    </div>
  `;

  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.className = "modal";
  infoModal.innerHTML = `
  <div class="modal-content">
    <h3 id="welcomeText"></h3>
    <pre id="statsText"></pre>
    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
      <button onclick="document.getElementById('infoModal').style.display='none'; setupTimer(); render();">继续游戏</button>
      <button onclick="showIdList()">查看已有 ID</button>
      <button onclick="showCredits()">cr&致谢</button>
    </div>
  </div>
`;

  const winModal = document.createElement("div");
  winModal.id = "winModal";
  winModal.className = "modal";
  winModal.style.display = "none"; // hidden by default
  winModal.innerHTML = `
    <div class="modal-content win-modal-content">
      <h2 id="winTitle"> </h2>
      <p id="winText" style="white-space: pre-line; font-size: 16px; margin-top: 10px;"></p>
      <button onclick="closeWinModal()">关闭</button>
    </div>
  `;
  document.body.appendChild(winModal);
  
  const style = document.createElement("style");
  style.textContent = `
    .modal {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    #userIdInput {
      padding: 10px;
      font-size: 1em;
      margin-top: 10px;
      width: 200px;
    }
    .modal-content button {
      margin-top: 15px;
      padding: 10px 20px;
      font-size: 1em;
      background-color: #ff90c2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    #statusBar {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(255,255,255,0.6);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
    }
  `;

  const status = document.createElement("div");
  status.id = "statusBar";
  document.body.appendChild(status);
  document.head.appendChild(style);
  document.body.appendChild(modal);
  document.body.appendChild(infoModal);

  document.getElementById("startGameBtn").onclick = () => {
    const input = document.getElementById("userIdInput").value.trim();
    if (input) {
      currentUserId = input;
      document.getElementById("idModal").style.display = "none";
      generateBoard([[3,2], [0,0], [5,0], [0,5]]);
      render();
      setupTimer();
    } else {
      alert("请输入有效的 ID");
    }
  };
});
