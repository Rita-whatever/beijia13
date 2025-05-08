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

// 初始化棋盘（若有存档则加载，否则滑动打乱，固定 2,2 位置）
function generateBoard(fixedRow = null, fixedCol = null) {
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
        if (fixedRow !== null && fixedCol !== null) {
          if ((nr === fixedRow && nc === fixedCol) || (emptyRow === fixedRow && emptyCol === fixedCol)) return false;
        }
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
        tile.style.backgroundImage = `url('images/${val}.jpg')`;
        tile.addEventListener("click", () => tryMove(row, col));
      }
      puzzle.appendChild(tile);
    }
  }
  updateStatus();
  saveBoardToStorage(currentUserId);
}

const winTitles = [
  "🎉 恭喜完成拼图！",
  "🏆 胜利属于你！",
  "🎯 拼图达成！",
  "🔥 你做到了！",
  "👏 成功收官！",
  "🧩 杰出表现！",
  "✨ 无懈可击！",
  "🌈 拼图王者诞生！"
];

const winMessages = [
  `🎉 你做到了！在无数次移动与尝试中，你一步步逼近最终目标，就像人生旅途中我们不断修正方向，终于抵达心中的远方。每一块拼图的移动都是坚持与智慧的结晶，而你已成功将它们归位。请记住这个时刻，你不仅完成了一次游戏，更完成了一次小小的自我挑战。继续前行吧，接下来的每一次努力都不会被辜负。`,
  `👏 拼图完成啦！这不仅仅是一局游戏的胜利，更是一次思维与耐心的考验。过程或许有些曲折，但你用巧思与决心打败了混乱与随机。也许生活中也正是如此：看似杂乱无章的碎片，最终会在你的努力下拼出一副完整的画面。庆祝这一刻，也期待你下次的精彩表现！`,
  `🏆 恭喜你！你用智慧驾驭了混乱，用坚持击败了不确定。当那最后一块拼图归位的瞬间，不只是格子的整齐，更是一种秩序感的回归。或许游戏只是短暂的体验，但它带来的满足感却绵延悠长。再接再厉，未来的挑战等你征服！`,
  `🎯 太棒了！你把所有碎片安放得井井有条，就像把思绪梳理得清清楚楚。在这个看似简单却充满策略的游戏中，你表现得游刃有余。成功往往不是偶然，而是一个个细节中蕴藏的判断与行动的总和。期待你继续刷新记录，迎接更高难度的挑战！`,
  `✨ 完美达成！这场挑战仿佛是生活的缩影：一开始混乱不堪，几经尝试后终见光明。你选择了坚持，没有放弃，每一次滑动都迈向成功一步。也许下次你会更快，但此刻的成就已经值得喝彩。愿你带着这种成就感，迎接每一个明天。`,
  `🔥 你完成了这个看似不可能的拼图！或许你曾想放弃，或许你曾怀疑是否能完成，但你坚持了下来，并最终成功了。这说明：只要你愿意努力，任何混乱都可以被理清，任何挑战都能被征服。别停下脚步，下一个目标在等你！`,
  `🌈 成功啦！你已将混乱的碎片重组为完美的画面，像极了人生中那些努力后收获成果的瞬间。过程充满波折，却也因此更加值得铭记。愿这份胜利的喜悦伴你前行，在未来的每一局拼图、每一次挑战中继续闪耀。`,
  `🧩 所有方块就位，你就是这局游戏的王者！在混乱的格子中找出规律，在错综复杂中理出思路，这是思维的盛宴，更是毅力的磨砺。你没有被困扰打败，反而从中寻得突破之道。未来还会有更难的挑战，相信你也一样可以征服！`
];


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
      document.getElementById("winTitle").innerText = winTitles[i];
      document.getElementById("winText").innerText = `${winMessages[i]}\n\n总步数：${moveCount}\n累计用时：${min}分${sec}秒`;
      document.getElementById("winModal").style.display = "flex";

    }
  }
}

// [TESTING]

function checkWin() {
  // let count = 1;
  // for (let i = 0; i < gridSize; i++) {
  //   for (let j = 0; j < gridSize; j++) {
  //     if (i === gridSize - 1 && j === gridSize - 1) return board[i][j] === 0;
  //     if (board[i][j] !== count) return false;
  //     count++;
  //   }
  // }
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
      <button onclick="document.getElementById('winModal').style.display='none'">关闭</button>
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
      generateBoard(2, 2);
      render();
      setupTimer();
    } else {
      alert("请输入有效的 ID");
    }
  };
});
