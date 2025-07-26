/**
 * 計算チャレンジ - ゲームロジック
 * シンプルな計算問題ゲーム
 */

'use strict';

// ゲーム設定
const GAME_CONFIG = {
    TIME_LIMIT: 120, // 2分間
    SCORE_CORRECT: 10,
    SCORE_BONUS: 5, // 連続正解ボーナス
    LEVELS: {
        1: { name: '初級', operations: ['+', '-'], maxNumber: 20 },
        2: { name: '中級', operations: ['*', '/'], maxNumber: 12 },
        3: { name: '上級', operations: ['+', '-', '*', '/'], maxNumber: 15 },
        4: { name: 'マスター', operations: ['+', '-', '*', '/'], maxNumber: 20 }
    }
};

// ゲーム状態管理クラス
class GameState {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.questionCount = 0;
        this.correctCount = 0;
        this.consecutiveCorrect = 0;
        this.timeRemaining = 0;
        this.isPlaying = false;
        this.gameTimer = null;
        this.currentProblem = null;
        
        this.initializeElements();
        this.loadGameState();
    }

    initializeElements() {
        this.elements = {
            // 画面
            startScreen: document.getElementById('start-screen'),
            gamePlayArea: document.getElementById('game-play-area'),
            completeScreen: document.getElementById('complete-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            
            // ゲーム要素
            problemDisplay: document.getElementById('problem-display'),
            problemNumber: document.getElementById('problem-number'),
            problemText: document.getElementById('problem-text'),
            feedbackMessage: document.getElementById('feedback-message'),
            feedbackText: document.getElementById('feedback-text'),
            
            // スコア表示
            questionCountDisplay: document.getElementById('question-count'),
            correctCountDisplay: document.getElementById('correct-count'),
            currentScoreDisplay: document.getElementById('current-score'),
            
            // UI要素
            currentLevel: document.getElementById('current-level'),
            gameTimer: document.getElementById('game-timer'),
            
            // ボタン
            startGameBtn: document.getElementById('start-game-btn'),
            retryBtn: document.getElementById('retry-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            
            // 結果表示
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

        // もう一度プレイボタン
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        }

        // レベル選択
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.getAttribute('data-level'));
                this.selectLevel(level);
            });
        });

        // 回答ボタン（イベント委譲）
        if (this.elements.problemDisplay) {
            this.elements.problemDisplay.addEventListener('click', (e) => {
                if (e.target.classList.contains('answer-btn') && !e.target.disabled) {
                    const answer = e.target.textContent.trim();
                    this.submitAnswer(answer);
                }
            });
        }

        // キーボード入力（1-4キー）
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && this.currentProblem) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 4) {
                    const answerBtns = this.elements.problemDisplay.querySelectorAll('.answer-btn');
                    if (answerBtns[num - 1] && !answerBtns[num - 1].disabled) {
                        this.submitAnswer(answerBtns[num - 1].textContent.trim());
                    }
                }
            }
        });
    }

    loadGameState() {
        if (appState && appState.progress) {
            this.currentLevel = appState.progress.currentLevel || 1;
            this.updateUI();
        }
    }

    selectLevel(level) {
        if (level >= 1 && level <= 4) {
            this.currentLevel = level;
            this.updateUI();
            
            // レベルボタンのスタイル更新
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.getAttribute('data-level')) === level) {
                    btn.classList.add('active');
                }
            });
        }
    }

    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.questionCount = 0;
        this.correctCount = 0;
        this.consecutiveCorrect = 0;
        this.timeRemaining = GAME_CONFIG.TIME_LIMIT;

        // 画面切り替え
        Utils.hide(this.elements.startScreen);
        Utils.show(this.elements.gamePlayArea);

        // スコア表示を初期化
        this.updateScoreDisplay();

        // タイマー開始
        this.startTimer();

        // 最初の問題を生成
        this.generateNextProblem();
        
        console.log(`ゲーム開始: レベル${this.currentLevel}`);
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    generateNextProblem() {
        this.questionCount++;
        
        if (window.problemGenerator) {
            this.currentProblem = window.problemGenerator.generateProblem(this.currentLevel);
            this.displayProblem(this.currentProblem);
        }
    }

    displayProblem(problem) {
        // 問題番号
        if (this.elements.problemNumber) {
            this.elements.problemNumber.textContent = `問題 ${this.questionCount}`;
        }
        
        // 問題文
        if (this.elements.problemText) {
            this.elements.problemText.textContent = problem.question;
        }

        // 選択肢
        const answerBtns = this.elements.problemDisplay.querySelectorAll('.answer-btn');
        answerBtns.forEach((btn, index) => {
            if (problem.choices[index]) {
                btn.textContent = problem.choices[index];
                btn.disabled = false;
                btn.className = 'answer-btn bg-blue-100 hover:bg-blue-200 text-blue-800 py-4 px-6 rounded-lg text-xl font-semibold transition-all';
            }
        });

        // フィードバックメッセージを非表示
        Utils.hide(this.elements.feedbackMessage);
    }

    submitAnswer(answer) {
        if (!this.isPlaying || !this.currentProblem) return;

        const isCorrect = this.checkAnswer(answer, this.currentProblem.correctAnswer);
        
        // ボタンを無効化
        const answerBtns = this.elements.problemDisplay.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => btn.disabled = true);

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer(answer);
        }

        // 次の問題へ
        setTimeout(() => {
            this.generateNextProblem();
        }, 1500);
    }

    handleCorrectAnswer() {
        this.correctCount++;
        this.consecutiveCorrect++;
        
        // スコア計算
        let points = GAME_CONFIG.SCORE_CORRECT;
        if (this.consecutiveCorrect > 1) {
            points += GAME_CONFIG.SCORE_BONUS * (this.consecutiveCorrect - 1);
        }
        this.score += points;

        // フィードバック表示
        this.showFeedback('正解！', 'correct');
        this.showAnswerFeedback(true);
        this.updateScoreDisplay();
        
        // 効果音
        this.playSound('correct');
    }

    handleIncorrectAnswer(userAnswer) {
        this.consecutiveCorrect = 0;
        
        // フィードバック表示
        this.showFeedback('残念...', 'incorrect');
        this.showAnswerFeedback(false, userAnswer);
        
        // 効果音
        this.playSound('incorrect');
    }

    showFeedback(message, type) {
        if (this.elements.feedbackText && this.elements.feedbackMessage) {
            this.elements.feedbackText.textContent = message;
            this.elements.feedbackText.className = type === 'correct' 
                ? 'text-xl font-bold text-green-600' 
                : 'text-xl font-bold text-red-600';
            Utils.show(this.elements.feedbackMessage);
        }
    }

    showAnswerFeedback(isCorrect, userAnswer) {
        const buttons = this.elements.problemDisplay.querySelectorAll('.answer-btn');
        
        buttons.forEach(btn => {
            if (btn.textContent.trim() === this.currentProblem.correctAnswer.toString()) {
                btn.classList.add('correct');
            } else if (!isCorrect && btn.textContent.trim() === userAnswer) {
                btn.classList.add('incorrect');
            }
        });
    }

    checkAnswer(userAnswer, correctAnswer) {
        const userStr = userAnswer.toString().trim();
        const correctStr = correctAnswer.toString().trim();
        
        if (userStr === correctStr) {
            return true;
        }
        
        const user = parseFloat(userStr);
        const correct = parseFloat(correctStr);
        
        if (!isNaN(user) && !isNaN(correct)) {
            return Math.abs(user - correct) < 0.001;
        }
        
        return false;
    }

    updateScoreDisplay() {
        if (this.elements.questionCountDisplay) {
            this.elements.questionCountDisplay.textContent = this.questionCount;
        }
        if (this.elements.correctCountDisplay) {
            this.elements.correctCountDisplay.textContent = this.correctCount;
        }
        if (this.elements.currentScoreDisplay) {
            this.elements.currentScoreDisplay.textContent = this.score;
        }
    }

    gameOver() {
        this.stopTimer();
        this.isPlaying = false;
        
        // 正答率計算
        const accuracyRate = this.questionCount > 0 ? 
            Math.round((this.correctCount / this.questionCount) * 100) : 0;
        
        // 結果表示
        if (this.elements.clearTime) {
            const timeUsed = GAME_CONFIG.TIME_LIMIT - this.timeRemaining;
            this.elements.clearTime.textContent = Utils.formatTime(timeUsed);
        }
        
        if (this.elements.correctRate) {
            this.elements.correctRate.textContent = accuracyRate + '%';
        }
        
        if (this.elements.earnedScore) {
            this.elements.earnedScore.textContent = this.score;
        }
        
        // 画面切り替え
        Utils.hide(this.elements.gamePlayArea);
        
        // タイムアップかゲーム終了かで表示を分ける
        if (this.timeRemaining <= 0) {
            Utils.show(this.elements.gameOverScreen);
        } else {
            Utils.show(this.elements.completeScreen);
        }
        
        // ハイスコア更新
        if (appState && this.score > appState.progress.highScore) {
            appState.progress.highScore = this.score;
            appState.saveProgress();
        }
        
        this.playSound('complete');
    }

    restartGame() {
        this.stopTimer();
        this.isPlaying = false;
        
        // 画面を初期状態に戻す
        Utils.hide(this.elements.gamePlayArea);
        Utils.hide(this.elements.completeScreen);
        Utils.hide(this.elements.gameOverScreen);
        Utils.show(this.elements.startScreen);
        
        this.resetUI();
    }

    updateUI() {
        if (this.elements.currentLevel) {
            const levelName = GAME_CONFIG.LEVELS[this.currentLevel]?.name || this.currentLevel;
            this.elements.currentLevel.textContent = levelName;
        }
    }

    updateTimerDisplay() {
        if (this.elements.gameTimer) {
            this.elements.gameTimer.textContent = Utils.formatTime(this.timeRemaining);
            
            // タイマーの色を時間に応じて変更
            this.elements.gameTimer.classList.remove('warning', 'danger');
            if (this.timeRemaining <= 10) {
                this.elements.gameTimer.classList.add('danger');
            } else if (this.timeRemaining <= 30) {
                this.elements.gameTimer.classList.add('warning');
            }
        }
    }

    resetUI() {
        if (this.elements.gameTimer) {
            this.elements.gameTimer.classList.remove('warning', 'danger');
        }
    }

    playSound(type) {
        if (appState?.soundEnabled && window.audioManager) {
            window.audioManager.play(type);
        }
    }
}

// ゲームマネージャー
class GameManager {
    constructor() {
        this.gameState = null;
        this.initialize();
    }

    initialize() {
        this.gameState = new GameState();
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