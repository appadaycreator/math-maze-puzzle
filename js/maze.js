/**
 * 計算の迷宮 - 迷路生成・描画
 * 迷路の生成、描画、プレイヤーの移動を管理
 */

'use strict';

// 迷路の設定
const MAZE_CONFIG = {
    CELL_SIZE: 20,
    WALL_WIDTH: 2,
    COLORS: {
        wall: '#2d3748',
        path: '#ffffff',
        player: '#3b82f6',
        goal: '#10b981',
        visited: '#e2e8f0',
        current: '#fbbf24'
    }
};

// 方向定数
const DIRECTIONS = {
    NORTH: { x: 0, y: -1, opposite: 'SOUTH' },
    SOUTH: { x: 0, y: 1, opposite: 'NORTH' },
    EAST: { x: 1, y: 0, opposite: 'WEST' },
    WEST: { x: -1, y: 0, opposite: 'EAST' }
};

// セルクラス
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = {
            NORTH: true,
            SOUTH: true,
            EAST: true,
            WEST: true
        };
        this.visited = false;
        this.isPath = false;
        this.isStart = false;
        this.isGoal = false;
    }

    removeWall(direction) {
        this.walls[direction] = false;
    }

    hasWall(direction) {
        return this.walls[direction];
    }

    getNeighborPosition(direction) {
        const dir = DIRECTIONS[direction];
        return {
            x: this.x + dir.x,
            y: this.y + dir.y
        };
    }
}

// 迷路生成クラス
class MazeGenerator {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.grid = [];
        this.canvas = null;
        this.ctx = null;
        this.playerPosition = null;
        this.goalPosition = null;
        this.path = [];
        this.visitedCells = new Set();
        
        this.initializeCanvas();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('maze-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasEventListeners();
        }
    }

    setupCanvasEventListeners() {
        if (!this.canvas) return;

        // クリック/タッチイベント
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleCanvasClick(e.touches[0]);
        });

        // ホバーエフェクト（デスクトップのみ）
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('mouseleave', () => this.clearHover());
    }

    generateMaze(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.path = [];
        this.visitedCells.clear();

        // グリッドの初期化
        this.initializeGrid();

        // 迷路生成（再帰的バックトラッキング）
        this.generateWithBacktracking();

        // スタートとゴールの設定
        this.setStartAndGoal();

        // 迷路の描画
        this.setupCanvas();
        this.drawMaze();

        console.log(`迷路生成完了: ${width}x${height}`);
    }

    initializeGrid() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = new Cell(x, y);
            }
        }
    }

    generateWithBacktracking() {
        const stack = [];
        let current = this.grid[0][0];
        current.visited = true;

        while (true) {
            const neighbors = this.getUnvisitedNeighbors(current);
            
            if (neighbors.length > 0) {
                const next = Utils.randomChoice(neighbors);
                stack.push(current);
                
                this.removeWallBetween(current, next);
                next.visited = true;
                current = next;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }

        // 全セルの visited フラグをリセット
        this.resetVisited();
    }

    getUnvisitedNeighbors(cell) {
        const neighbors = [];
        
        Object.keys(DIRECTIONS).forEach(direction => {
            const pos = cell.getNeighborPosition(direction);
            if (this.isValidPosition(pos.x, pos.y)) {
                const neighbor = this.grid[pos.y][pos.x];
                if (!neighbor.visited) {
                    neighbors.push({ cell: neighbor, direction });
                }
            }
        });

        return neighbors;
    }

    removeWallBetween(current, next) {
        const dx = next.cell.x - current.x;
        const dy = next.cell.y - current.y;

        if (dx === 1) {
            current.removeWall('EAST');
            next.cell.removeWall('WEST');
        } else if (dx === -1) {
            current.removeWall('WEST');
            next.cell.removeWall('EAST');
        } else if (dy === 1) {
            current.removeWall('SOUTH');
            next.cell.removeWall('NORTH');
        } else if (dy === -1) {
            current.removeWall('NORTH');
            next.cell.removeWall('SOUTH');
        }
    }

    resetVisited() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].visited = false;
            }
        }
    }

    setStartAndGoal() {
        // スタート位置（左上角近く）
        this.playerPosition = { x: 0, y: 0 };
        this.grid[0][0].isStart = true;
        this.grid[0][0].isPath = true;

        // ゴール位置（右下角近く）
        this.goalPosition = { x: this.width - 1, y: this.height - 1 };
        this.grid[this.height - 1][this.width - 1].isGoal = true;

        // スタート位置を訪問済みに設定
        this.visitedCells.add(`${this.playerPosition.x},${this.playerPosition.y}`);
    }

    setupCanvas() {
        if (!this.canvas) return;

        const cellSize = MAZE_CONFIG.CELL_SIZE;
        const canvasWidth = this.width * cellSize;
        const canvasHeight = this.height * cellSize;

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // レスポンシブ対応
        const maxWidth = Math.min(window.innerWidth - 40, 800);
        const maxHeight = Math.min(window.innerHeight - 200, 600);
        
        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
            const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
            this.canvas.style.width = `${canvasWidth * scale}px`;
            this.canvas.style.height = `${canvasHeight * scale}px`;
        } else {
            this.canvas.style.width = `${canvasWidth}px`;
            this.canvas.style.height = `${canvasHeight}px`;
        }
    }

    drawMaze() {
        if (!this.ctx) return;

        const cellSize = MAZE_CONFIG.CELL_SIZE;
        const wallWidth = MAZE_CONFIG.WALL_WIDTH;

        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 背景を白で塗りつぶし
        this.ctx.fillStyle = MAZE_CONFIG.COLORS.path;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // セルの描画
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                this.drawCell(cell, x * cellSize, y * cellSize, cellSize);
            }
        }

        // プレイヤーとゴールの描画
        this.drawPlayer();
        this.drawGoal();
        this.drawVisitedPath();
    }

    drawCell(cell, x, y, size) {
        const wallWidth = MAZE_CONFIG.WALL_WIDTH;
        
        this.ctx.strokeStyle = MAZE_CONFIG.COLORS.wall;
        this.ctx.lineWidth = wallWidth;

        // 壁の描画
        this.ctx.beginPath();
        
        if (cell.walls.NORTH) {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + size, y);
        }
        
        if (cell.walls.SOUTH) {
            this.ctx.moveTo(x, y + size);
            this.ctx.lineTo(x + size, y + size);
        }
        
        if (cell.walls.WEST) {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + size);
        }
        
        if (cell.walls.EAST) {
            this.ctx.moveTo(x + size, y);
            this.ctx.lineTo(x + size, y + size);
        }
        
        this.ctx.stroke();

        // セルの背景色
        if (cell.isStart) {
            this.ctx.fillStyle = `${MAZE_CONFIG.COLORS.player}33`;
            this.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        } else if (cell.isGoal) {
            this.ctx.fillStyle = `${MAZE_CONFIG.COLORS.goal}33`;
            this.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        }
    }

    drawPlayer() {
        if (!this.playerPosition) return;

        const cellSize = MAZE_CONFIG.CELL_SIZE;
        const x = this.playerPosition.x * cellSize + cellSize / 2;
        const y = this.playerPosition.y * cellSize + cellSize / 2;
        const radius = cellSize / 3;

        this.ctx.fillStyle = MAZE_CONFIG.COLORS.player;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        // プレイヤーの輪郭
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawGoal() {
        if (!this.goalPosition) return;

        const cellSize = MAZE_CONFIG.CELL_SIZE;
        const x = this.goalPosition.x * cellSize;
        const y = this.goalPosition.y * cellSize;
        const size = cellSize * 0.8;
        const offset = cellSize * 0.1;

        this.ctx.fillStyle = MAZE_CONFIG.COLORS.goal;
        this.ctx.beginPath();
        this.ctx.roundRect(x + offset, y + offset, size, size, size / 4);
        this.ctx.fill();

        // ゴールのシンボル（星）
        this.drawStar(x + cellSize / 2, y + cellSize / 2, cellSize / 4, '#ffffff');
    }

    drawStar(x, y, radius, color) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const xPos = x + Math.cos(angle) * r;
            const yPos = y + Math.sin(angle) * r;

            if (i === 0) {
                this.ctx.moveTo(xPos, yPos);
            } else {
                this.ctx.lineTo(xPos, yPos);
            }
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    drawVisitedPath() {
        const cellSize = MAZE_CONFIG.CELL_SIZE;
        
        this.visitedCells.forEach(cellKey => {
            const [x, y] = cellKey.split(',').map(Number);
            const drawX = x * cellSize + cellSize / 4;
            const drawY = y * cellSize + cellSize / 4;
            const size = cellSize / 2;

            this.ctx.fillStyle = MAZE_CONFIG.COLORS.visited;
            this.ctx.fillRect(drawX, drawY, size, size);
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const cellX = Math.floor(x / MAZE_CONFIG.CELL_SIZE);
        const cellY = Math.floor(y / MAZE_CONFIG.CELL_SIZE);

        if (this.isValidPosition(cellX, cellY)) {
            this.handleCellClick(cellX, cellY);
        }
    }

    handleCanvasHover(e) {
        // ホバー効果の実装（必要に応じて）
    }

    clearHover() {
        // ホバー効果のクリア
    }

    handleCellClick(cellX, cellY) {
        // プレイヤーの移動可能性をチェック
        if (this.canMoveTo(cellX, cellY)) {
            this.movePlayerTo(cellX, cellY);
        }
    }

    canMoveTo(targetX, targetY) {
        if (!this.playerPosition) return false;

        const dx = Math.abs(targetX - this.playerPosition.x);
        const dy = Math.abs(targetY - this.playerPosition.y);

        // 隣接するセルかチェック
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            return this.hasPathBetween(this.playerPosition.x, this.playerPosition.y, targetX, targetY);
        }

        return false;
    }

    hasPathBetween(x1, y1, x2, y2) {
        const cell1 = this.grid[y1][x1];
        
        if (x2 > x1 && !cell1.walls.EAST) return true;  // 東
        if (x2 < x1 && !cell1.walls.WEST) return true;  // 西
        if (y2 > y1 && !cell1.walls.SOUTH) return true; // 南
        if (y2 < y1 && !cell1.walls.NORTH) return true; // 北

        return false;
    }

    movePlayerTo(x, y) {
        this.playerPosition = { x, y };
        this.visitedCells.add(`${x},${y}`);
        this.drawMaze();

        // プレイヤーが移動した際の処理
        if (gameManager && gameManager.getGameState().isPlaying) {
            gameManager.getGameState().generateNextProblem();
        }
    }

    movePlayer() {
        // ゲームロジックから呼ばれる自動移動
        const availableMoves = this.getAvailableMoves();
        
        if (availableMoves.length > 0) {
            const nextMove = Utils.randomChoice(availableMoves);
            this.movePlayerTo(nextMove.x, nextMove.y);
            return this.playerPosition;
        }
        
        return null;
    }

    getAvailableMoves() {
        if (!this.playerPosition) return [];

        const moves = [];
        const currentCell = this.grid[this.playerPosition.y][this.playerPosition.x];

        Object.keys(DIRECTIONS).forEach(direction => {
            if (!currentCell.walls[direction]) {
                const pos = currentCell.getNeighborPosition(direction);
                if (this.isValidPosition(pos.x, pos.y)) {
                    moves.push(pos);
                }
            }
        });

        return moves;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getStartPosition() {
        return this.playerPosition ? { ...this.playerPosition } : null;
    }

    getGoalPosition() {
        return this.goalPosition ? { ...this.goalPosition } : null;
    }

    resetPlayerPosition() {
        this.playerPosition = { x: 0, y: 0 };
        this.visitedCells.clear();
        this.visitedCells.add('0,0');
        this.drawMaze();
    }

    // デバッグ用メソッド
    solveMaze() {
        // A*アルゴリズムで迷路を解く
        const path = this.findPath(this.playerPosition, this.goalPosition);
        if (path) {
            this.highlightPath(path);
        }
        return path;
    }

    findPath(start, goal) {
        // A*アルゴリズムの実装
        const openList = [start];
        const closedList = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, this.heuristic(start, goal));

        while (openList.length > 0) {
            // 最小のfScoreを持つノードを選択
            let current = openList.reduce((min, node) => {
                const nodeKey = `${node.x},${node.y}`;
                const minKey = `${min.x},${min.y}`;
                return fScore.get(nodeKey) < fScore.get(minKey) ? node : min;
            });

            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }

            openList.splice(openList.indexOf(current), 1);
            closedList.add(`${current.x},${current.y}`);

            // 隣接ノードを評価
            const neighbors = this.getAvailableMovesFrom(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedList.has(neighborKey)) continue;

                const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;

                if (!openList.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openList.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighborKey)) {
                    continue;
                }

                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));
            }
        }

        return null; // パスが見つからない
    }

    getAvailableMovesFrom(position) {
        const moves = [];
        const cell = this.grid[position.y][position.x];

        Object.keys(DIRECTIONS).forEach(direction => {
            if (!cell.walls[direction]) {
                const pos = cell.getNeighborPosition(direction);
                if (this.isValidPosition(pos.x, pos.y)) {
                    moves.push(pos);
                }
            }
        });

        return moves;
    }

    heuristic(a, b) {
        // マンハッタン距離
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }

        return path;
    }

    highlightPath(path) {
        const cellSize = MAZE_CONFIG.CELL_SIZE;
        
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let i = 0; i < path.length; i++) {
            const x = path[i].x * cellSize + cellSize / 2;
            const y = path[i].y * cellSize + cellSize / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }
}

// グローバルインスタンス
let mazeGenerator;

document.addEventListener('DOMContentLoaded', () => {
    mazeGenerator = new MazeGenerator();
    
    // グローバル参照（デバッグ用）
    window.mazeGenerator = mazeGenerator;
    
    console.log('迷路ジェネレーターが初期化されました');
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MazeGenerator, Cell, MAZE_CONFIG, DIRECTIONS };
} 