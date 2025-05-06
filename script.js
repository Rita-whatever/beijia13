const gridSize = 6;
let board = [];
let emptyRow = gridSize - 1;
let emptyCol = gridSize - 1;
let touchStartX = 0;
let touchStartY = 0;
let touchStartRow = null;
let touchStartCol = null;

function generateBoard() {
  let nums = [...Array(gridSize * gridSize - 1).keys()].map(n => n + 1);
  nums = nums.sort(() => Math.random() - 0.5);
  nums.push(0); // 0 means empty
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
}

// 监听 touchstart + touchend 在整个 puzzle 区域上
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

function tryMove(row, col) {
  if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
    board[emptyRow][emptyCol] = board[row][col];
    board[row][col] = 0;
    emptyRow = row;
    emptyCol = col;
    render();
    if (checkWin()) alert("恭喜您成功解决华容道！");
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

generateBoard();
render();
