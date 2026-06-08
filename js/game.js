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
    DIFFICULTY_MULTIPLIERS: {
        1: 1.0,   // 初級：基本スコア
        2: 1.5,   // 中級：1.5倍
        3: 2.0,   // 上級：2倍
        4: 2.5    // マスター：2.5倍
    },
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

// ポーズ状態を保持
let gamePaused = false;

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
        this.updateScoreHistoryDisplay();
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

        // キーボード入力（1-4キー + ESC）
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && this.currentProblem) {
                // ESC キーでポーズ
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.togglePause();
                    return;
                }

                const num = parseInt(e.key);
                if (num >= 1 && num <= 4 && !gamePaused) {
                    const answerBtns = this.elements.problemDisplay.querySelectorAll('.answer-btn');
                    if (answerBtns[num - 1] && !answerBtns[num - 1].disabled) {
                        this.submitAnswer(answerBtns[num - 1].textContent.trim());
                    }
                }
            }
        });

        // ポーズボタン
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // 再開ボタン
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause());
        }

        // SNS共有ボタン
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.getAttribute('data-platform');
                this.shareResult(platform);
            });
        });

        // URLコピーボタン
        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                this.copyResultUrl();
            });
        }

        // 結果シェアボタン
        const shareResultBtn = document.getElementById('share-result-btn');
        if (shareResultBtn) {
            shareResultBtn.addEventListener('click', () => {
                this.openShareMenu();
            });
        }

        // 進捗リセットボタン
        const resetBtn = document.getElementById('reset-progress-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('ゲーム記録をすべてリセットします。よろしいですか？\n\nこの操作は取り消せません。')) {
                    this.resetProgress();
                    alert('ゲーム記録をリセットしました！');
                }
            });
        }
    }

    loadGameState() {
        if (appState && appState.progress) {
            this.currentLevel = appState.progress.currentLevel || 1;
            const savedTimeLimit = appState.progress.selectedTimeLimit || 2;
            this.selectLevel(this.currentLevel);
            this.selectTimeLimit(savedTimeLimit);
            this.updateUI();
        }
    }

    resetProgress() {
        // ローカルストレージから全データを削除
        if (appState && appState.progress) {
            appState.progress.playCount = 0;
            appState.progress.clearCount = 0;
            appState.progress.highScore = 0;
            appState.progress.currentLevel = 1;
            appState.saveProgress();
        }

        // UI更新
        const playCountEl = document.getElementById('play-count');
        const clearCountEl = document.getElementById('clear-count');
        const highScoreEl = document.getElementById('high-score');

        if (playCountEl) playCountEl.textContent = '0';
        if (clearCountEl) clearCountEl.textContent = '0';
        if (highScoreEl) highScoreEl.textContent = '0';

        this.currentLevel = 1;
        this.updateUI();
    }

    selectLevel(level) {
        if (level >= 1 && level <= 4) {
            this.currentLevel = level;
            // ローカルストレージに保存
            if (appState && appState.progress) {
                appState.progress.currentLevel = level;
                appState.saveProgress();
            }
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
            // ローカルストレージに保存
            if (appState && appState.progress) {
                appState.progress.selectedTimeLimit = preset;
                appState.saveProgress();
            }

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

    togglePause() {
        if (!this.isPlaying) return;

        gamePaused = !gamePaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        const gamePlayArea = this.elements.gamePlayArea;

        if (gamePaused) {
            this.stopTimer();
            if (pauseOverlay) {
                pauseOverlay.style.display = 'flex';
            }
            if (gamePlayArea) {
                gamePlayArea.style.opacity = '0.4';
                gamePlayArea.style.pointerEvents = 'none';
            }
        } else {
            this.startTimer();
            if (pauseOverlay) {
                pauseOverlay.style.display = 'none';
            }
            if (gamePlayArea) {
                gamePlayArea.style.opacity = '1';
                gamePlayArea.style.pointerEvents = 'auto';
            }
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

        // スコア計算（難易度ボーナス付き）
        const basPoints = GAME_CONFIG.SCORE_CORRECT;
        const difficultyMultiplier = GAME_CONFIG.DIFFICULTY_MULTIPLIERS[this.currentLevel] || 1.0;
        let points = Math.round(basPoints * difficultyMultiplier);

        if (this.consecutiveCorrect > 1) {
            const bonusPoints = Math.round(GAME_CONFIG.SCORE_BONUS * (this.consecutiveCorrect - 1) * difficultyMultiplier);
            points += bonusPoints;
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

        if (isCorrect) {
            // 背景フラッシュアニメーション
            if (this.elements.problemDisplay) {
                this.elements.problemDisplay.classList.add('feedback-correct');
                setTimeout(() => {
                    this.elements.problemDisplay.classList.remove('feedback-correct');
                }, 800);
            }
        } else {
            // 背景フラッシュ＋シェイクアニメーション
            if (this.elements.problemDisplay) {
                this.elements.problemDisplay.classList.add('feedback-wrong');
                setTimeout(() => {
                    this.elements.problemDisplay.classList.remove('feedback-wrong');
                }, 500);
            }
        }

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
        const timeUsed = this.selectedTimeLimit - this.timeRemaining;

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

        // スコア履歴に記録（最新5回まで）
        this.recordScoreHistory(this.score);
        this.updateScoreHistoryDisplay();

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

    recordScoreHistory(score) {
        let history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
        history.unshift({ score, timestamp: Date.now() });
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem('scoreHistory', JSON.stringify(history));
    }

    updateScoreHistoryDisplay() {
        const historyEl = document.getElementById('score-history-mini');
        if (!historyEl) return;

        const history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
        if (history.length === 0) {
            historyEl.innerHTML = '<p class="text-xs text-gray-500">まだプレイ結果がありません</p>';
            return;
        }

        const maxScore = Math.max(...history.map(h => h.score), 100);
        const bars = history.map((h, i) => {
            const height = Math.max(20, (h.score / maxScore) * 60);
            return `<div style="display:flex;flex-direction:column;align-items:center;flex:1"><div style="width:100%;height:${height}px;background:#3b82f6;border-radius:4px;margin-bottom:4px"></div><span style="font-size:0.65rem;color:#666">${h.score}</span></div>`;
        }).join('');

        historyEl.innerHTML = `<div style="display:flex;gap:4px;align-items:flex-end;height:100px;justify-content:space-between">${bars}</div><p style="font-size:0.75rem;color:#666;margin-top:4px;text-align:center">過去${history.length}回のスコア</p>`;
    }

    // SNS共有機能
    generateShareText() {
        const levelName = GAME_CONFIG.LEVELS[this.currentLevel]?.name || '不明';
        const accuracy = this.questionCount > 0 ?
            Math.round((this.correctCount / this.questionCount) * 100) : 0;
        return `計算チャレンジで${this.score}点獲得！\n難易度: ${levelName}\n正答率: ${accuracy}%\n\n計算力を鍛えよう！`;
    }

    shareResult(platform) {
        const text = this.generateShareText();
        const url = 'https://appadaycreator.com/math-maze-puzzle/';
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'line':
                shareUrl = `https://line.me/R/msg/text/?${encodedText}%0A${encodedUrl}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }

    copyResultUrl() {
        const url = 'https://appadaycreator.com/math-maze-puzzle/';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                alert('URLをコピーしました！');
            }).catch(() => {
                // フォールバック
                this.fallbackCopy(url);
            });
        } else {
            this.fallbackCopy(url);
        }
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('URLをコピーしました！');
    }

    openShareMenu() {
        const text = this.generateShareText();
        const url = 'https://appadaycreator.com/math-maze-puzzle/';

        if (navigator.share) {
            navigator.share({
                title: '計算チャレンジ',
                text: text,
                url: url
            }).catch(() => {});
        } else {
            // フォールバック：Twitter共有
            const encodedText = encodeURIComponent(text);
            const encodedUrl = encodeURIComponent(url);
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
            window.open(shareUrl, '_blank', 'width=600,height=400');
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
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState, GameManager, GAME_CONFIG };
}