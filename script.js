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

function generateBoard() {
  const saved = loadBoardFromStorage(currentUserId);
  if (saved) {
    board = saved.board;
    emptyRow = saved.emptyRow;
    emptyCol = saved.emptyCol;
    moveCount = saved.moveCount || 0;
    startTime = saved.startTime || Date.now();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    alert(`欢迎回来 ${currentUserId}！\n上次操作时间：${saved.lastPlayed || '未知'}\n累计游戏用时：${min}分${sec}秒\n已用步数：${moveCount}`);
    return;
  }
  moveCount = 0;
  startTime = Date.now();
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