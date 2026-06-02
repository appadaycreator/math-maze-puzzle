/**
 * 計算チャレンジ - ゲームロジック
 * シンプルな計算問題ゲーム
 */

'use strict';

// ゲーム設定
const GAME_CONFIG = {
    TIME_LIMIT: 120, // デフォルト2分間
    SCORE_CORRECT: 10,
    SCORE_BONUS: 5, // 連続正解ボーナス
    TIME_PRESETS: {
        1: { label: '1分', seconds: 60 },
        2: { label: '2分（推奨）', seconds: 120 },
        3: { label: '3分', seconds: 180 },
        5: { label: '5分', seconds: 300 }
    },
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
        this.selectedTimeLimit = GAME_CONFIG.TIME_LIMIT;
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

        // 制限時間選択
        document.querySelectorAll('.time-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = parseInt(e.target.getAttribute('data-preset'));
                this.selectTimeLimit(preset);
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
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                btn.classList.add('text-gray-700');
                if (parseInt(btn.getAttribute('data-level')) === level) {
                    btn.classList.add('active', 'bg-blue-100', 'text-blue-700');
                    btn.classList.remove('text-gray-700');
                }
            });
        }
    }

    selectTimeLimit(preset) {
        if (GAME_CONFIG.TIME_PRESETS[preset]) {
            this.selectedTimeLimit = GAME_CONFIG.TIME_PRESETS[preset].seconds;

            // ボタンのスタイル更新
            document.querySelectorAll('.time-preset-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                btn.classList.add('text-gray-700');
                if (parseInt(btn.getAttribute('data-preset')) === preset) {
                    btn.classList.add('active', 'bg-blue-100', 'text-blue-700');
                    btn.classList.remove('text-gray-700');
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
        this.timeRemaining = this.selectedTimeLimit;

        // プレイカウント更新
        if (appState && appState.progress) {
            appState.progress.playCount++;
            appState.saveProgress();
            const playCountEl = document.getElementById('play-count');
            if (playCountEl) playCountEl.textContent = appState.progress.playCount;
        }

        // 画面切り替え
        Utils.hide(this.elements.startScreen);
        Utils.show(this.elements.gamePlayArea);

        // プログレスバー初期化
        const progressBar = document.getElementById('timer-progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.className = 'bg-green-500 h-3 rounded-full transition-all duration-1000';
        }

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
        this.showComboFeedback(points);
        this.updateScoreDisplay();

        // 効果音
        this.playSound('correct');
    }

    showComboFeedback(points) {
        const comboEl = document.getElementById('combo-display');
        if (!comboEl) return;

        if (this.consecutiveCorrect >= 2) {
            comboEl.textContent = `🔥 ${this.consecutiveCorrect}連続！ +${points}pt`;
            comboEl.className = 'text-center text-orange-500 font-bold text-lg';
        } else {
            comboEl.textContent = `+${points}pt`;
            comboEl.className = 'text-center text-green-600 font-bold text-base';
        }
        Utils.show(comboEl);
        clearTimeout(this._comboTimer);
        this._comboTimer = setTimeout(() => Utils.hide(comboEl), 1200);
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
        const timeUsed = GAME_CONFIG.TIME_LIMIT - this.timeRemaining;

        // completeScreen 結果セット
        if (this.elements.clearTime) this.elements.clearTime.textContent = Utils.formatTime(timeUsed);
        if (this.elements.correctRate) this.elements.correctRate.textContent = accuracyRate + '%';
        if (this.elements.earnedScore) this.elements.earnedScore.textContent = this.score;

        // game-over-screen 結果セット
        const goScore = document.getElementById('game-over-score');
        const goRate = document.getElementById('game-over-correct-rate');
        const goQuestions = document.getElementById('game-over-questions');
        if (goScore) goScore.textContent = this.score;
        if (goRate) goRate.textContent = accuracyRate + '%';
        if (goQuestions) goQuestions.textContent = `${this.correctCount} / ${this.questionCount}問`;

        // ハイスコア更新
        let isNewRecord = false;
        if (appState && this.score > (appState.progress.highScore || 0)) {
            appState.progress.highScore = this.score;
            appState.saveProgress();
            isNewRecord = true;
            const highScoreEl = document.getElementById('high-score');
            if (highScoreEl) highScoreEl.textContent = this.score;
        }

        // 新記録バッジ
        ['new-record-badge', 'new-record-badge-go'].forEach(id => {
            const el = document.getElementById(id);
            if (el) isNewRecord ? Utils.show(el) : Utils.hide(el);
        });

        // 画面切り替え
        Utils.hide(this.elements.gamePlayArea);
        if (this.timeRemaining <= 0) {
            Utils.show(this.elements.gameOverScreen);
        } else {
            Utils.show(this.elements.completeScreen);
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

        // プログレスバー更新
        const progressBar = document.getElementById('timer-progress-bar');
        if (progressBar) {
            const pct = (this.timeRemaining / this.selectedTimeLimit) * 100;
            progressBar.style.width = pct + '%';
            progressBar.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');
            if (this.timeRemaining <= 10) {
                progressBar.classList.add('bg-red-500');
            } else if (this.timeRemaining <= 30) {
                progressBar.classList.add('bg-yellow-500');
            } else {
                progressBar.classList.add('bg-green-500');
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