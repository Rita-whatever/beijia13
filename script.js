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
    updateIdList(currentUserId);
    document.getElementById("welcomeText").innerText = `欢迎回来 ${currentUserId}`;
    document.getElementById("statsText").innerText = `上次时间: ${saved.lastPlayed || '未知'}\n步数: ${moveCount}`;
    document.getElementById("infoModal").style.display = "flex";
    return;
  }

  // 初始完成状态
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
      alert(`🎉 恭喜您完成拼图！\n总步数：${moveCount}\n累计用时：${min}分${sec}秒`);
    }
  }
}

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
      </div>
    </div>
  `;

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

