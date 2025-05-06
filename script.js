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

function generateBoard() {
  const saved = loadBoardFromStorage(currentUserId);
  if (saved) {
    board = saved.board;
    emptyRow = saved.emptyRow;
    emptyCol = saved.emptyCol;
    moveCount = saved.moveCount || 0;
    alert(`欢迎回来 ${currentUserId}！\n上次操作时间：${saved.lastPlayed || '未知'}\n已用步数：${moveCount}`);
    return;
  }
  moveCount = 0;
  let nums = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
  nums = nums.sort(() => Math.random() - 0.5);
  nums.push(0);
  board = [];
  for (let i = 0; i < gridSize; i++) {
    board.push(nums.slice(i * gridSize, (i + 1) * gridSize));
  }
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j] === 0) {
        emptyRow = i;
        emptyCol = j;
      }
    }
  }
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
  saveBoardToStorage(currentUserId);
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.createElement("div");
  modal.id = "idModal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>请输入你的ID</h2>
      <input type="text" id="userIdInput" placeholder="例如：rita123">
      <button id="startGameBtn">开始游戏</button>
      <br><br>
      <button id="listIDsBtn">查看已保存的ID</button>
      <button id="deleteIDBtn">删除指定ID</button>
    </div>
  `;
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  modal.style.zIndex = 1000;

  const style = document.createElement("style");
  style.textContent = `
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
    #startGameBtn, #listIDsBtn, #deleteIDBtn {
      margin-top: 10px;
      padding: 10px 20px;
      font-size: 1em;
      background-color: #ff90c2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    #listIDsBtn, #deleteIDBtn {
      background-color: #888;
    }
    #startGameBtn:hover {
      background-color: #e360a0;
    }
    #listIDsBtn:hover, #deleteIDBtn:hover {
      background-color: #666;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  document.getElementById("startGameBtn").onclick = () => {
    const input = document.getElementById("userIdInput").value.trim();
    if (input) {
      currentUserId = input;
      document.getElementById("idModal").style.display = "none";
      generateBoard();
      render();
    } else {
      alert("请输入有效的 ID");
    }
  };

  document.getElementById("listIDsBtn").onclick = () => {
    let ids = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("puzzle_")) {
        ids.push(key.replace("puzzle_", ""));
      }
    }
    if (ids.length === 0) {
      alert("没有找到任何保存的ID。");
    } else {
      alert("已保存的ID：\n" + ids.join("\n"));
    }
  };

  document.getElementById("deleteIDBtn").onclick = () => {
    const targetID = prompt("请输入你想删除的ID：");
    if (targetID) {
      localStorage.removeItem("puzzle_" + targetID.trim());
      alert(`已删除 ${targetID} 的存档。`);
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

    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (
      targetRow >= 0 && targetRow < gridSize &&
      targetCol >= 0 && targetCol < gridSize &&
      board[targetRow][targetCol] === 0
    ) {
      tryMove(targetRow, targetCol);
    }
  }, { passive: false });
});

function tryMove(row, col) {
  if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
    board[emptyRow][emptyCol] = board[row][col];
    board[row][col] = 0;
    emptyRow = row;
    emptyCol = col;
    moveCount++;
    render();
    if (checkWin()) alert("🎉 恭喜您完成拼图！\n总步数：" + moveCount);
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

function saveBoardToStorage(id) {
  if (!id) return;
  const data = {
    board,
    emptyRow,
    emptyCol,
    moveCount,
    lastPlayed: new Date().toLocaleString()
  };
  localStorage.setItem("puzzle_" + id, JSON.stringify(data));
}

function loadBoardFromStorage(id) {
  if (!id) return null;
  const saved = localStorage.getItem("puzzle_" + id);
  return saved ? JSON.parse(saved) : null;
}
