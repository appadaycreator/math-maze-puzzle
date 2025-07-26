/**
 * 計算の迷宮 - メインスクリプト
 * 共通機能、設定管理、ユーティリティ関数を提供
 */

'use strict';

// グローバル設定
const CONFIG = {
    APP_NAME: '計算チャレンジ',
    VERSION: '1.0.0',
    STORAGE_KEY: 'mathChallengeConfig',
    PROGRESS_KEY: 'mathChallengeProgress',
    SUPPORTED_LANGUAGES: ['ja', 'en'],
    DEFAULT_LANGUAGE: 'ja',
    FONT_SIZES: ['xs', 'sm', 'base', 'lg', 'xl'],
    DEFAULT_FONT_SIZE: 'base'
};

// アプリケーションの状態管理
class AppState {
    constructor() {
        this.config = this.loadConfig();
        this.progress = this.loadProgress();
        this.language = this.config.language || CONFIG.DEFAULT_LANGUAGE;
        this.fontSize = this.config.fontSize || CONFIG.DEFAULT_FONT_SIZE;
        this.soundEnabled = this.config.soundEnabled !== false;
        this.hintsEnabled = this.config.hintsEnabled !== false;
        
        this.initializeApp();
    }

    // 設定の読み込み
    loadConfig() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('設定の読み込みに失敗しました:', error);
            return {};
        }
    }

    // 進捗の読み込み
    loadProgress() {
        try {
            const saved = localStorage.getItem(CONFIG.PROGRESS_KEY);
            return saved ? JSON.parse(saved) : {
                playCount: 0,
                clearCount: 0,
                highScore: 0,
                currentLevel: 1,
                currentStage: 1,
                unlockedStages: [1],
                hintCount: 3,
                achievements: []
            };
        } catch (error) {
            console.warn('進捗の読み込みに失敗しました:', error);
            return {
                playCount: 0,
                clearCount: 0,
                highScore: 0,
                currentLevel: 1,
                currentStage: 1,
                unlockedStages: [1],
                hintCount: 3,
                achievements: []
            };
        }
    }

    // 設定の保存
    saveConfig() {
        try {
            const config = {
                language: this.language,
                fontSize: this.fontSize,
                soundEnabled: this.soundEnabled,
                hintsEnabled: this.hintsEnabled
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
        }
    }

    // 進捗の保存
    saveProgress() {
        try {
            localStorage.setItem(CONFIG.PROGRESS_KEY, JSON.stringify(this.progress));
        } catch (error) {
            console.error('進捗の保存に失敗しました:', error);
        }
    }

    // アプリケーションの初期化
    initializeApp() {
        this.applyFontSize();
        this.initializeLanguage();
        this.setupEventListeners();
        this.updateProgressDisplay();
        
        // PWA関連の初期化
        this.initializePWA();
        
        console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} が初期化されました`);
    }

    // フォントサイズの適用
    applyFontSize() {
        document.body.className = document.body.className.replace(/font-\w+/g, '');
        if (this.fontSize !== 'base') {
            document.body.classList.add(`font-${this.fontSize}`);
        }
    }

    // 言語設定の初期化
    initializeLanguage() {
        this.loadLanguageResources();
    }

    // 言語リソースの読み込み
    async loadLanguageResources() {
        try {
            const response = await fetch(`locales/${this.language}.json`);
            if (response.ok) {
                this.strings = await response.json();
                this.updateLanguageElements();
            } else {
                console.warn(`言語ファイル ${this.language}.json が見つかりません`);
            }
        } catch (error) {
            console.warn('言語リソースの読み込みに失敗しました:', error);
        }
    }

    // 言語要素の更新
    updateLanguageElements() {
        if (!this.strings) return;
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.strings[key]) {
                element.textContent = this.strings[key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (this.strings[key]) {
                element.placeholder = this.strings[key];
            }
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 言語切替ボタン
        this.setupLanguageButtons();
        
        // フォントサイズ調整ボタン
        this.setupFontSizeButtons();
        
        // モバイルメニュー
        this.setupMobileMenu();
        
        // 設定トグル
        this.setupSettingsToggles();
        
        // URL共有
        this.setupShareButtons();
        
        // キーボードショートカット
        this.setupKeyboardShortcuts();
    }

    // 言語切替ボタンの設定
    setupLanguageButtons() {
        ['ja-btn', 'ja-btn-mobile'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.setLanguage('ja'));
            }
        });

        ['en-btn', 'en-btn-mobile'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.setLanguage('en'));
            }
        });

        this.updateLanguageButtons();
    }

    // フォントサイズボタンの設定
    setupFontSizeButtons() {
        const fontButtons = {
            'font-decrease': () => this.adjustFontSize(-1),
            'font-default': () => this.setFontSize('base'),
            'font-increase': () => this.adjustFontSize(1),
            'font-xs': () => this.setFontSize('xs'),
            'font-sm': () => this.setFontSize('sm'),
            'font-md': () => this.setFontSize('base'),
            'font-lg': () => this.setFontSize('lg'),
            'font-xl': () => this.setFontSize('xl')
        };

        Object.entries(fontButtons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    // モバイルメニューの設定
    setupMobileMenu() {
        const menuButton = document.getElementById('mobile-menu-button');
        const closeButton = document.getElementById('close-mobile-menu');
        const menu = document.getElementById('mobile-menu');

        if (menuButton && menu) {
            menuButton.addEventListener('click', () => {
                menu.classList.remove('translate-x-full');
            });
        }

        if (closeButton && menu) {
            closeButton.addEventListener('click', () => {
                menu.classList.add('translate-x-full');
            });
        }

        // メニュー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (menu && !menu.contains(e.target) && !menuButton?.contains(e.target)) {
                menu.classList.add('translate-x-full');
            }
        });
    }

    // 設定トグルの設定
    setupSettingsToggles() {
        const soundToggle = document.getElementById('sound-toggle');
        const hintToggle = document.getElementById('hint-toggle');

        if (soundToggle) {
            soundToggle.checked = this.soundEnabled;
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                this.saveConfig();
                this.updateToggleStyle(soundToggle);
            });
            this.updateToggleStyle(soundToggle);
        }

        if (hintToggle) {
            hintToggle.checked = this.hintsEnabled;
            hintToggle.addEventListener('change', (e) => {
                this.hintsEnabled = e.target.checked;
                this.saveConfig();
                this.updateToggleStyle(hintToggle);
            });
            this.updateToggleStyle(hintToggle);
        }
    }

    // トグルスイッチのスタイル更新
    updateToggleStyle(toggle) {
        const parent = toggle.parentElement;
        const dot = parent.querySelector('.dot');
        const block = parent.querySelector('.block');

        if (toggle.checked) {
            dot?.classList.add('translate-x-4');
            block?.classList.add('bg-blue-600');
            block?.classList.remove('bg-gray-300');
        } else {
            dot?.classList.remove('translate-x-4');
            block?.classList.remove('bg-blue-600');
            block?.classList.add('bg-gray-300');
        }
    }

    // 共有ボタンの設定
    setupShareButtons() {
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.getAttribute('data-platform');
                this.shareToSocialMedia(platform);
            });
        });

        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => this.copyUrlToClipboard());
        }
    }

    // キーボードショートカットの設定
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.adjustFontSize(1);
                        break;
                    case '-':
                        e.preventDefault();
                        this.adjustFontSize(-1);
                        break;
                    case '0':
                        e.preventDefault();
                        this.setFontSize('base');
                        break;
                }
            }
        });
    }

    // 言語設定
    setLanguage(lang) {
        if (CONFIG.SUPPORTED_LANGUAGES.includes(lang)) {
            this.language = lang;
            this.saveConfig();
            this.updateLanguageButtons();
            this.loadLanguageResources();
        }
    }

    // 言語ボタンの更新
    updateLanguageButtons() {
        ['ja-btn', 'ja-btn-mobile'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.className = btn.className.replace(/bg-\w+-\d+|text-\w+-\d+/g, '');
                if (this.language === 'ja') {
                    btn.classList.add('bg-white', 'text-blue-600');
                } else {
                    btn.classList.add('bg-transparent', 'text-white');
                }
            }
        });

        ['en-btn', 'en-btn-mobile'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.className = btn.className.replace(/bg-\w+-\d+|text-\w+-\d+/g, '');
                if (this.language === 'en') {
                    btn.classList.add('bg-white', 'text-blue-600');
                } else {
                    btn.classList.add('bg-transparent', 'text-white');
                }
            }
        });
    }

    // フォントサイズ設定
    setFontSize(size) {
        if (CONFIG.FONT_SIZES.includes(size)) {
            this.fontSize = size;
            this.applyFontSize();
            this.saveConfig();
        }
    }

    // フォントサイズ調整
    adjustFontSize(delta) {
        const currentIndex = CONFIG.FONT_SIZES.indexOf(this.fontSize);
        const newIndex = Math.max(0, Math.min(CONFIG.FONT_SIZES.length - 1, currentIndex + delta));
        this.setFontSize(CONFIG.FONT_SIZES[newIndex]);
    }

    // 進捗表示の更新
    updateProgressDisplay() {
        const elements = {
            'play-count': this.progress.playCount,
            'clear-count': this.progress.clearCount,
            'high-score': this.progress.highScore,
            'hint-count': this.progress.hintCount
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // PWAの初期化
    initializePWA() {
        // Service Worker の登録
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('Service Worker 登録成功:', registration.scope);
                    })
                    .catch(err => {
                        console.log('Service Worker 登録失敗:', err);
                    });
            });
        }

        // インストールプロンプト
        this.setupInstallPrompt();
    }

    // インストールプロンプトの設定
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA がインストールされました');
            this.hideInstallButton();
        });
    }

    // インストールボタンの表示
    showInstallButton() {
        // インストールボタンを表示する実装
        console.log('PWA インストール可能');
    }

    // インストールボタンの非表示
    hideInstallButton() {
        // インストールボタンを非表示にする実装
        console.log('PWA インストール完了');
    }

    // ソーシャルメディア共有
    shareToSocialMedia(platform) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`${CONFIG.APP_NAME}で遊んでいます！`);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            line: `https://line.me/R/msg/text/?${text}%20${url}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    // URL クリップボードにコピー
    async copyUrlToClipboard() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            this.showNotification('URLをコピーしました！', 'success');
        } catch (err) {
            console.error('クリップボードへのコピーに失敗:', err);
            this.showNotification('URLのコピーに失敗しました', 'error');
        }
    }

    // 通知表示
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 alert alert-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // アニメーション
        notification.classList.add('fade-in');
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // エラーハンドリング
    handleError(error, context = '') {
        console.error(`エラーが発生しました ${context}:`, error);
        this.showNotification('エラーが発生しました。ページを再読み込みしてください。', 'error');
    }

    // パフォーマンス監視
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // デバッグ情報の取得
    getDebugInfo() {
        return {
            config: this.config,
            progress: this.progress,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            storage: {
                available: 'localStorage' in window,
                used: JSON.stringify(localStorage).length
            }
        };
    }
}

// ユーティリティ関数
const Utils = {
    // 要素の表示/非表示
    show(element) {
        if (element) element.classList.remove('hidden');
    },

    hide(element) {
        if (element) element.classList.add('hidden');
    },

    toggle(element) {
        if (element) element.classList.toggle('hidden');
    },

    // アニメーション
    fadeIn(element, duration = 300) {
        if (!element) return;
        element.style.opacity = '0';
        element.classList.remove('hidden');
        
        const animation = element.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
        
        animation.onfinish = () => {
            element.style.opacity = '';
        };
    },

    fadeOut(element, duration = 300) {
        if (!element) return;
        
        const animation = element.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
        
        animation.onfinish = () => {
            element.classList.add('hidden');
            element.style.opacity = '';
        };
    },

    // 数値フォーマット
    formatNumber(num) {
        return num.toLocaleString();
    },

    // 時間フォーマット（秒を mm:ss 形式に）
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // ランダム要素選択
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // 配列シャッフル
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // 範囲内の乱数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // デバウンス
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // スロットル
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// グローバルインスタンス
let appState;

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        appState = new AppState();
        
        // グローバルエラーハンドラー
        window.addEventListener('error', (e) => {
            appState.handleError(e.error, 'Global');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            appState.handleError(e.reason, 'Promise');
        });
        
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
    }
});

// モジュールのエクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, Utils, CONFIG };
} 