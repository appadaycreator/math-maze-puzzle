/**
 * 計算の迷宮 - ゲームロジック
 * ゲームの状態管理、レベル制御、スコア計算を担当
 */

'use strict';

// ゲーム設定
const GAME_CONFIG = {
    LEVELS: {
        1: { name: '初級', timeLimit: 180, operations: ['+', '-'], maxNumber: 20 },
        2: { name: '中級', timeLimit: 240, operations: ['*', '/'], maxNumber: 12 },
        3: { name: '上級', timeLimit: 300, operations: ['+', '-', '*', '/'], maxNumber: 15, decimals: true },
        4: { name: 'マスター', timeLimit: 360, operations: ['+', '-', '*', '/'], maxNumber: 20, complex: true }
    },
    STAGES_PER_LEVEL: 10,
    MAZE_SIZES: {
        1: { width: 15, height: 15 },
        2: { width: 17, height: 17 },
        3: { width: 19, height: 19 },
        4: { width: 21, height: 21 }
    },
    SCORING: {
        baseScore: 100,
        timeBonus: 10,
        accuracyBonus: 50,
        perfectBonus: 200
    }
};

// ゲーム状態管理クラス
class GameState {
    constructor() {
        this.currentLevel = 1;
        this.currentStage = 1;
        this.score = 0;
        this.timeRemaining = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.startTime = null;
        this.playerPosition = null;
        this.goalPosition = null;
        this.currentProblem = null;
        this.hintsUsed = 0;
        
        this.gameTimer = null;
        
        this.initializeElements();
        this.loadGameState();
    }

    initializeElements() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gamePlayArea: document.getElementById('game-play-area'),
            completeScreen: document.getElementById('complete-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            problemDisplay: document.getElementById('problem-display'),
            mazeCanvas: document.getElementById('maze-canvas'),
            
            // UI elements
            currentLevel: document.getElementById('current-level'),
            currentStage: document.getElementById('current-stage'),
            gameTimer: document.getElementById('game-timer'),
            gameScore: document.getElementById('game-score'),
            
            // Buttons
            startGameBtn: document.getElementById('start-game-btn'),
            retryBtn: document.getElementById('retry-btn'),
            nextStageBtn: document.getElementById('next-stage-btn'),
            
            // Problem elements
            problemText: document.getElementById('problem-text'),
            answerBtns: document.querySelectorAll('.answer-btn'),
            
            // Results
            clearTime: document.getElementById('clear-time'),
            correctRate: document.getElementById('correct-rate'),
            earnedScore: document.getElementById('earned-score')
        };

        this.setupGameControls();
    }

    setupGameControls() {
        // スタートボタン
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        }

        // リトライボタン
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.restartGame());
        }

        // 次のステージボタン
        if (this.elements.nextStageBtn) {
            this.elements.nextStageBtn.addEventListener('click', () => this.nextStage());
        }

        // レベル選択ボタン
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.getAttribute('data-level'));
                this.selectLevel(level);
            });
        });

        // ステージ選択ボタン
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stage = parseInt(e.target.getAttribute('data-stage'));
                this.selectStage(stage);
            });
        });

        // 回答ボタン
        this.elements.answerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = e.target.textContent.trim();
                this.submitAnswer(answer);
            });
        });

        // キーボード入力（1-4キー）
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && this.currentProblem) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 4) {
                    const answerBtn = this.elements.answerBtns[num - 1];
                    if (answerBtn) {
                        this.submitAnswer(answerBtn.textContent.trim());
                    }
                }
            }
        });
    }

    loadGameState() {
        if (appState && appState.progress) {
            this.currentLevel = appState.progress.currentLevel || 1;
            this.currentStage = appState.progress.currentStage || 1;
            this.updateUI();
        }
    }

    saveGameState() {
        if (appState) {
            appState.progress.currentLevel = this.currentLevel;
            appState.progress.currentStage = this.currentStage;
            appState.saveProgress();
        }
    }

    selectLevel(level) {
        if (level >= 1 && level <= 4) {
            this.currentLevel = level;
            this.currentStage = 1;
            this.updateUI();
            this.saveGameState();
            
            // レベルボタンのスタイル更新
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.getAttribute('data-level')) === level) {
                    btn.classList.add('active');
                }
            });
        }
    }

    selectStage(stage) {
        // ステージのロック状態をチェック
        const unlockedStages = appState?.progress?.unlockedStages || [1];
        if (unlockedStages.includes(stage)) {
            this.currentStage = stage;
            this.updateUI();
            this.saveGameState();
        }
    }

    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 0;
        this.hintsUsed = 0;
        this.startTime = Date.now();

        const level = GAME_CONFIG.LEVELS[this.currentLevel];
        this.timeRemaining = level.timeLimit;

        // 迷路の生成
        if (window.mazeGenerator) {
            const size = GAME_CONFIG.MAZE_SIZES[this.currentLevel];
            window.mazeGenerator.generateMaze(size.width, size.height);
            this.playerPosition = window.mazeGenerator.getStartPosition();
            this.goalPosition = window.mazeGenerator.getGoalPosition();
        }

        // 画面切り替え
        Utils.hide(this.elements.startScreen);
        Utils.show(this.elements.gamePlayArea);

        // タイマー開始
        this.startTimer();

        // 進捗更新
        if (appState) {
            appState.progress.playCount++;
            appState.saveProgress();
        }

        this.updateUI();
        console.log(`ゲーム開始: レベル${this.currentLevel} ステージ${this.currentStage}`);
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.gameOver();
            } else if (this.timeRemaining <= 30) {
                this.elements.gameTimer?.classList.add('danger');
            } else if (this.timeRemaining <= 60) {
                this.elements.gameTimer?.classList.add('warning');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    pauseGame() {
        if (this.isPlaying && !this.isPaused) {
            this.isPaused = true;
            this.stopTimer();
            console.log('ゲーム一時停止');
        }
    }

    resumeGame() {
        if (this.isPlaying && this.isPaused) {
            this.isPaused = false;
            this.startTimer();
            console.log('ゲーム再開');
        }
    }

    restartGame() {
        this.stopTimer();
        this.isPlaying = false;
        this.isPaused = false;
        
        // 画面を初期状態に戻す
        Utils.hide(this.elements.gamePlayArea);
        Utils.hide(this.elements.completeScreen);
        Utils.hide(this.elements.gameOverScreen);
        Utils.show(this.elements.startScreen);
        
        this.resetUI();
    }

    nextStage() {
        if (this.currentStage < GAME_CONFIG.STAGES_PER_LEVEL) {
            this.currentStage++;
        } else if (this.currentLevel < 4) {
            this.currentLevel++;
            this.currentStage = 1;
        }
        
        this.saveGameState();
        this.restartGame();
    }

    submitAnswer(answer) {
        console.log('submitAnswer called:', answer, this.currentProblem);
        if (!this.isPlaying || !this.currentProblem) {
            console.log('Game not playing or no current problem');
            return;
        }

        this.totalQuestions++;
        const isCorrect = this.checkAnswer(answer, this.currentProblem.correctAnswer);
        console.log('Answer check:', answer, 'vs', this.currentProblem.correctAnswer, '=', isCorrect);

        if (isCorrect) {
            this.correctAnswers++;
            this.addScore(GAME_CONFIG.SCORING.baseScore);
            this.movePlayer();
            this.playSound('correct');
            
            // 正解エフェクト
            this.showAnswerFeedback(true);
            
            if (this.checkGoalReached()) {
                this.completeStage();
            } else {
                this.generateNextProblem();
            }
        } else {
            this.playSound('incorrect');
            this.showAnswerFeedback(false);
            
            // 間違いの場合は最初からやり直し
            setTimeout(() => {
                this.restartCurrentStage();
            }, 1500);
        }
    }

    checkAnswer(userAnswer, correctAnswer) {
        // 数値として比較（小数点の誤差も考慮）
        const user = parseFloat(userAnswer);
        const correct = parseFloat(correctAnswer);
        
        if (isNaN(user) || isNaN(correct)) {
            return userAnswer.toString() === correctAnswer.toString();
        }
        
        return Math.abs(user - correct) < 0.001;
    }

    movePlayer() {
        // 迷路内でプレイヤーを移動
        if (window.mazeGenerator) {
            const newPosition = window.mazeGenerator.movePlayer();
            this.playerPosition = newPosition;
        }
    }

    checkGoalReached() {
        return this.playerPosition && this.goalPosition &&
               this.playerPosition.x === this.goalPosition.x &&
               this.playerPosition.y === this.goalPosition.y;
    }

    generateNextProblem() {
        console.log('generateNextProblem called');
        if (window.problemGenerator) {
            this.currentProblem = window.problemGenerator.generateProblem(this.currentLevel);
            console.log('Generated problem:', this.currentProblem);
            this.displayProblem(this.currentProblem);
        } else {
            console.error('problemGenerator not found');
        }
    }

    displayProblem(problem) {
        if (this.elements.problemText) {
            this.elements.problemText.textContent = problem.question;
        }

        this.elements.answerBtns.forEach((btn, index) => {
            if (problem.choices[index]) {
                btn.textContent = problem.choices[index];
                btn.style.display = 'block';
                btn.className = 'answer-btn bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-lg';
            } else {
                btn.style.display = 'none';
            }
        });

        Utils.show(this.elements.problemDisplay);
    }

    showAnswerFeedback(isCorrect) {
        const buttons = this.elements.answerBtns;
        
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === this.currentProblem.correctAnswer.toString()) {
                btn.classList.add('correct');
            } else if (!isCorrect && btn.textContent.trim() === 
                      (event.target ? event.target.textContent.trim() : '')) {
                btn.classList.add('incorrect');
            }
        });

        setTimeout(() => {
            Utils.hide(this.elements.problemDisplay);
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect');
            });
        }, 1500);
    }

    restartCurrentStage() {
        // 現在のステージを最初からやり直し
        this.playerPosition = window.mazeGenerator?.getStartPosition();
        this.generateNextProblem();
    }

    completeStage() {
        this.stopTimer();
        this.isPlaying = false;

        // スコア計算
        const completionTime = GAME_CONFIG.LEVELS[this.currentLevel].timeLimit - this.timeRemaining;
        const timeBonus = Math.max(0, this.timeRemaining * GAME_CONFIG.SCORING.timeBonus);
        const accuracyRate = this.totalQuestions > 0 ? this.correctAnswers / this.totalQuestions : 0;
        const accuracyBonus = Math.floor(accuracyRate * GAME_CONFIG.SCORING.accuracyBonus);
        const perfectBonus = accuracyRate === 1 ? GAME_CONFIG.SCORING.perfectBonus : 0;

        this.score += timeBonus + accuracyBonus + perfectBonus;

        // 進捗更新
        if (appState) {
            appState.progress.clearCount++;
            if (this.score > appState.progress.highScore) {
                appState.progress.highScore = this.score;
            }
            
            // 次のステージをアンロック
            const nextStage = this.currentStage + 1;
            if (nextStage <= GAME_CONFIG.STAGES_PER_LEVEL && 
                !appState.progress.unlockedStages.includes(nextStage)) {
                appState.progress.unlockedStages.push(nextStage);
            }
            
            appState.saveProgress();
        }

        // 結果表示
        this.showResults(completionTime, accuracyRate);
        
        // 画面切り替え
        Utils.hide(this.elements.gamePlayArea);
        Utils.show(this.elements.completeScreen);
        
        this.playSound('complete');
    }

    gameOver() {
        this.stopTimer();
        this.isPlaying = false;
        
        Utils.hide(this.elements.gamePlayArea);
        Utils.show(this.elements.gameOverScreen);
        
        this.playSound('gameover');
        console.log('ゲームオーバー');
    }

    showResults(completionTime, accuracyRate) {
        if (this.elements.clearTime) {
            this.elements.clearTime.textContent = Utils.formatTime(completionTime);
        }
        
        if (this.elements.correctRate) {
            this.elements.correctRate.textContent = Math.round(accuracyRate * 100) + '%';
        }
        
        if (this.elements.earnedScore) {
            this.elements.earnedScore.textContent = this.score;
        }
    }

    addScore(points) {
        this.score += points;
        
        // スコア表示にアニメーション
        if (this.elements.gameScore) {
            this.elements.gameScore.textContent = this.score;
            this.elements.gameScore.classList.add('score-animation');
            setTimeout(() => {
                this.elements.gameScore.classList.remove('score-animation');
            }, 800);
        }
    }

    updateUI() {
        if (this.elements.currentLevel) {
            const levelName = GAME_CONFIG.LEVELS[this.currentLevel]?.name || this.currentLevel;
            this.elements.currentLevel.textContent = levelName;
        }
        
        if (this.elements.currentStage) {
            this.elements.currentStage.textContent = this.currentStage;
        }
        
        if (this.elements.gameScore) {
            this.elements.gameScore.textContent = this.score;
        }
        
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        if (this.elements.gameTimer) {
            this.elements.gameTimer.textContent = Utils.formatTime(this.timeRemaining);
            
            // タイマーの色を時間に応じて変更
            this.elements.gameTimer.classList.remove('warning', 'danger');
            if (this.timeRemaining <= 30) {
                this.elements.gameTimer.classList.add('danger');
            } else if (this.timeRemaining <= 60) {
                this.elements.gameTimer.classList.add('warning');
            }
        }
    }

    resetUI() {
        if (this.elements.gameTimer) {
            this.elements.gameTimer.classList.remove('warning', 'danger');
        }
        
        Utils.hide(this.elements.problemDisplay);
    }

    playSound(type) {
        if (appState?.soundEnabled && window.audioManager) {
            window.audioManager.play(type);
        }
    }

    // デバッグ用メソッド
    getGameState() {
        return {
            currentLevel: this.currentLevel,
            currentStage: this.currentStage,
            score: this.score,
            timeRemaining: this.timeRemaining,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.totalQuestions,
            accuracy: this.totalQuestions > 0 ? this.correctAnswers / this.totalQuestions : 0
        };
    }

    // チート機能（開発用）
    skipToGoal() {
        if (this.isPlaying) {
            this.completeStage();
        }
    }

    addTime(seconds) {
        this.timeRemaining += seconds;
        this.updateTimerDisplay();
    }
}

// ゲームマネージャー（シングルトン）
class GameManager {
    constructor() {
        this.gameState = null;
        this.initialize();
    }

    initialize() {
        this.gameState = new GameState();
        
        // デバッグ用のグローバル参照
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.gameDebug = {
                gameState: this.gameState,
                skipToGoal: () => this.gameState.skipToGoal(),
                addTime: (seconds) => this.gameState.addTime(seconds),
                getState: () => this.gameState.getGameState()
            };
        }
    }

    getGameState() {
        return this.gameState;
    }
}

// ゲームマネージャーのインスタンス作成
let gameManager;

document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameManager();
    console.log('ゲームマネージャーが初期化されました');
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, GameManager, GAME_CONFIG };
} 