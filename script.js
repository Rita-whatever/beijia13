const gridSize = 6;
let board = [];
let emptyRow = gridSize - 1;
let emptyCol = gridSize - 1;
let touchStartX = 0;
let touchStartY = 0;
let touchStartRow = null;
let touchStartCol = null;
let currentUserId = null;
let moveCount = 0;
let startTime = null;
let timerInterval = null;

function generateBoard(fixedRow = null, fixedCol = null) {
  // 初始化为完成状态
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

  const directions = [
    [0, 1], [0, -1],
    [1, 0], [-1, 0]
  ];
  let lastMove = null;

  for (let step = 0; step < 150; step++) {
    const candidates = directions.filter(([dr, dc]) => {
      const nr = emptyRow + dr;
      const nc = emptyCol + dc;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
      if (lastMove && nr === lastMove[0] && nc === lastMove[1]) return false;
      // 禁止空格移入固定块，或将固定块移动走
      if (fixedRow !== null && fixedCol !== null) {
        if ((nr === fixedRow && nc === fixedCol) || (emptyRow === fixedRow && emptyCol === fixedCol)) {
          return false;
        }
      }
      return true;
    });

    if (candidates.length === 0) break; // 无合法方向（防止死锁）

    const [dr, dc] = candidates[Math.floor(Math.random() * candidates.length)];
    const nr = emptyRow + dr;
    const nc = emptyCol + dc;

    // 执行滑动
    board[emptyRow][emptyCol] = board[nr][nc];
    board[nr][nc] = 0;

    lastMove = [emptyRow, emptyCol];
    emptyRow = nr;
    emptyCol = nc;
  }

  moveCount = 0;
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
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      alert(`🎉 恭喜您完成拼图！\n总步数：${moveCount}\n用时：${min}分${sec}秒`);
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
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  document.getElementById("statusBar").innerText = `ID: ${currentUserId} ｜ 步数: ${moveCount} ｜ 用时: ${min}分${sec}秒`;
}

function saveBoardToStorage(id) {
  if (!id) return;
  const data = {
    board,
    emptyRow,
    emptyCol,
    moveCount,
    startTime,
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
  timerInterval = setInterval(updateStatus, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.createElement("div");
  modal.id = "idModal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>请输入你的ID</h2>
      <input type="text" id="userIdInput" placeholder="例如：alo123">
      <button id="startGameBtn">开始游戏</button>
    </div>
  `;
  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.innerHTML = `
    <div class="modal-content">
      <h3 id="welcomeText"></h3>
      <pre id="statsText"></pre>
      <button onclick="document.getElementById('infoModal').style.display='none';setupTimer();render();">继续游戏</button>
    </div>
  `;
  modal.className = infoModal.className = "modal";

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
      generateBoard(2，2); // 固定起点块
      render();
      setupTimer();
    } else {
      alert("请输入有效的 ID");
    }
  };

  const puzzle = document.getElementById("puzzle");
  puzzle.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    const target = document.elementFromPoint(touchStartX, touchStartY);
    if (target && target.classList.contains("tile") && !target.classList.contains("empty")) {
      touchStartRow = parseInt(target.dataset.row);
      touchStartCol = parseInt(target.dataset.col);
    } else {
      touchStartRow = null;
      touchStartCol = null;
    }
  }, { passive: false });

  puzzle.addEventListener("touchend", (e) => {
    if (touchStartRow === null) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    let targetRow = touchStartRow;
    let targetCol = touchStartCol;

    if (
      targetRow >= 0 && targetRow < gridSize &&
      targetCol >= 0 && targetCol < gridSize &&
      board[targetRow][targetCol] === 0
    ) {
      tryMove(targetRow, targetCol);
    }
  }, { passive: false });
});