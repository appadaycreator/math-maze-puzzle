/**
 * 計算の迷宮 - UI操作関連
 * ユーザーインターフェースの制御、アニメーション、音響効果
 */

'use strict';

// UI設定
const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    TOOLTIP_DELAY: 500,
    NOTIFICATION_DURATION: 3000,
    MODAL_Z_INDEX: 1000,
    SOUND_VOLUME: 0.7,
    PARTICLE_COUNT: 20
};

// アニメーションマネージャー
class AnimationManager {
    constructor() {
        this.activeAnimations = new Map();
        this.animationId = 0;
    }

    // フェードイン
    fadeIn(element, duration = UI_CONFIG.ANIMATION_DURATION) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            element.style.opacity = '0';
            element.classList.remove('hidden');
            
            const animation = element.animate([
                { opacity: 0 },
                { opacity: 1 }
            ], {
                duration,
                easing: 'ease-out',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                element.style.opacity = '';
                resolve();
            };

            this.trackAnimation(`fadeIn_${this.animationId++}`, animation);
        });
    }

    // フェードアウト
    fadeOut(element, duration = UI_CONFIG.ANIMATION_DURATION) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const animation = element.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration,
                easing: 'ease-in',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                element.classList.add('hidden');
                element.style.opacity = '';
                resolve();
            };

            this.trackAnimation(`fadeOut_${this.animationId++}`, animation);
        });
    }

    // スライドイン
    slideIn(element, direction = 'up', duration = UI_CONFIG.ANIMATION_DURATION) {
        if (!element) return Promise.resolve();

        const directions = {
            up: { from: 'translateY(20px)', to: 'translateY(0)' },
            down: { from: 'translateY(-20px)', to: 'translateY(0)' },
            left: { from: 'translateX(20px)', to: 'translateX(0)' },
            right: { from: 'translateX(-20px)', to: 'translateX(0)' }
        };

        const { from, to } = directions[direction] || directions.up;

        return new Promise(resolve => {
            element.classList.remove('hidden');
            
            const animation = element.animate([
                { transform: from, opacity: 0 },
                { transform: to, opacity: 1 }
            ], {
                duration,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                element.style.transform = '';
                resolve();
            };

            this.trackAnimation(`slideIn_${this.animationId++}`, animation);
        });
    }

    // バウンス
    bounce(element, intensity = 1) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const scale = 1 + (0.1 * intensity);
            
            const animation = element.animate([
                { transform: 'scale(1)' },
                { transform: `scale(${scale})` },
                { transform: 'scale(1)' }
            ], {
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            });

            animation.onfinish = resolve;
            this.trackAnimation(`bounce_${this.animationId++}`, animation);
        });
    }

    // シェイク
    shake(element, intensity = 1) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const distance = 5 * intensity;
            
            const animation = element.animate([
                { transform: 'translateX(0)' },
                { transform: `translateX(-${distance}px)` },
                { transform: `translateX(${distance}px)` },
                { transform: `translateX(-${distance}px)` },
                { transform: 'translateX(0)' }
            ], {
                duration: 500,
                easing: 'ease-in-out'
            });

            animation.onfinish = resolve;
            this.trackAnimation(`shake_${this.animationId++}`, animation);
        });
    }

    // パルス
    pulse(element, color = '#3b82f6') {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const animation = element.animate([
                { boxShadow: `0 0 0 0 ${color}80` },
                { boxShadow: `0 0 0 10px ${color}00` }
            ], {
                duration: 600,
                easing: 'ease-out'
            });

            animation.onfinish = resolve;
            this.trackAnimation(`pulse_${this.animationId++}`, animation);
        });
    }

    // アニメーション追跡
    trackAnimation(name, animation) {
        this.activeAnimations.set(name, animation);
        animation.onfinish = () => {
            this.activeAnimations.delete(name);
        };
    }

    // 全アニメーション停止
    stopAllAnimations() {
        this.activeAnimations.forEach(animation => {
            animation.cancel();
        });
        this.activeAnimations.clear();
    }
}

// モーダルマネージャー
class ModalManager {
    constructor() {
        this.activeModals = [];
        this.overlay = null;
        this.setupOverlay();
    }

    setupOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-40';
        this.overlay.addEventListener('click', () => this.closeTopModal());
        document.body.appendChild(this.overlay);
    }

    show(modalElement, options = {}) {
        if (!modalElement) return;

        const config = {
            closable: true,
            backdrop: true,
            ...options
        };

        // オーバーレイ表示
        if (config.backdrop) {
            this.overlay.classList.remove('hidden');
        }

        // モーダル表示
        modalElement.classList.remove('hidden');
        modalElement.style.zIndex = UI_CONFIG.MODAL_Z_INDEX + this.activeModals.length;

        // アニメーション
        animationManager.slideIn(modalElement, 'up');

        // スタックに追加
        this.activeModals.push({
            element: modalElement,
            config
        });

        // ESCキーでクローズ
        if (config.closable) {
            document.addEventListener('keydown', this.handleEscKey);
        }

        // フォーカス管理
        this.manageFocus(modalElement);
    }

    close(modalElement) {
        const index = this.activeModals.findIndex(m => m.element === modalElement);
        if (index === -1) return;

        const modal = this.activeModals[index];
        
        // アニメーション
        animationManager.fadeOut(modalElement).then(() => {
            modalElement.classList.add('hidden');
        });

        // スタックから削除
        this.activeModals.splice(index, 1);

        // オーバーレイ管理
        if (this.activeModals.length === 0) {
            this.overlay.classList.add('hidden');
            document.removeEventListener('keydown', this.handleEscKey);
        }

        // フォーカス復帰
        this.restoreFocus();
    }

    closeTopModal() {
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            if (topModal.config.closable) {
                this.close(topModal.element);
            }
        }
    }

    handleEscKey = (e) => {
        if (e.key === 'Escape') {
            this.closeTopModal();
        }
    }

    manageFocus(modalElement) {
        // フォーカス可能要素を取得
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    restoreFocus() {
        // 前のモーダルまたは本体にフォーカスを戻す
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            this.manageFocus(topModal.element);
        } else {
            document.body.focus();
        }
    }
}

// 通知システム
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        container.id = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = UI_CONFIG.NOTIFICATION_DURATION) {
        const notification = this.createNotification(message, type);
        
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // アニメーション
        animationManager.slideIn(notification, 'right');

        // 自動削除
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `
            p-4 rounded-lg shadow-lg max-w-sm border-l-4 
            ${this.getTypeClasses(type)}
        `;

        const icon = this.getTypeIcon(type);
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="${icon} mr-3"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="notificationSystem.remove(this.closest('.p-4'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return notification;
    }

    getTypeClasses(type) {
        const classes = {
            success: 'bg-green-50 border-green-400 text-green-800',
            error: 'bg-red-50 border-red-400 text-red-800',
            warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
            info: 'bg-blue-50 border-blue-400 text-blue-800'
        };
        return classes[type] || classes.info;
    }

    getTypeIcon(type) {
        const icons = {
            success: 'fas fa-check-circle text-green-400',
            error: 'fas fa-exclamation-circle text-red-400',
            warning: 'fas fa-exclamation-triangle text-yellow-400',
            info: 'fas fa-info-circle text-blue-400'
        };
        return icons[type] || icons.info;
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;

        animationManager.slideOut(notification, 'right').then(() => {
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
            
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// ツールチップシステム
class TooltipSystem {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        
        this.init();
    }

    init() {
        // ツールチップ要素を作成
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'absolute bg-gray-800 text-white px-2 py-1 rounded text-sm pointer-events-none z-50 hidden';
        document.body.appendChild(this.tooltip);

        // イベントリスナー設定
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseEnter(e) {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        this.currentTarget = target;
        const message = target.getAttribute('data-tooltip');
        
        this.showTimeout = setTimeout(() => {
            this.show(message, e.clientX, e.clientY);
        }, UI_CONFIG.TOOLTIP_DELAY);
    }

    handleMouseLeave(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target === this.currentTarget) {
            this.hide();
        }
    }

    handleMouseMove(e) {
        if (this.tooltip && !this.tooltip.classList.contains('hidden')) {
            this.updatePosition(e.clientX, e.clientY);
        }
    }

    show(message, x, y) {
        if (!message) return;

        this.tooltip.textContent = message;
        this.tooltip.classList.remove('hidden');
        this.updatePosition(x, y);
        
        animationManager.fadeIn(this.tooltip, 150);
    }

    hide() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        if (!this.tooltip.classList.contains('hidden')) {
            animationManager.fadeOut(this.tooltip, 150);
        }

        this.currentTarget = null;
    }

    updatePosition(x, y) {
        const rect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 画面外に出ないように調整
        let left = x + 10;
        let top = y - rect.height - 10;

        if (left + rect.width > viewportWidth) {
            left = x - rect.width - 10;
        }

        if (top < 0) {
            top = y + 10;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
}

// パーティクルシステム
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'fixed top-0 left-0 w-full h-full pointer-events-none z-30';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');

        // リサイズ対応
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    createParticle(x, y, color = '#3b82f6', type = 'circle') {
        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            size: Math.random() * 4 + 2,
            color,
            type,
            life: 1,
            decay: Math.random() * 0.02 + 0.01
        };
    }

    explode(x, y, color = '#3b82f6', count = UI_CONFIG.PARTICLE_COUNT) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y, color));
        }
        
        if (!this.animationFrame) {
            this.animate();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 重力
            particle.life -= particle.decay;
            
            // 描画
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (particle.type === 'circle') {
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            } else if (particle.type === 'star') {
                this.drawStar(particle.x, particle.y, particle.size);
            }
            
            this.ctx.fill();
            
            // 削除
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.animationFrame = null;
        }
    }

    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;

        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const xPos = x + Math.cos(angle) * radius;
            const yPos = y + Math.sin(angle) * radius;

            if (i === 0) {
                this.ctx.moveTo(xPos, yPos);
            } else {
                this.ctx.lineTo(xPos, yPos);
            }
        }
        this.ctx.closePath();
    }
}

// 音響システム
class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = UI_CONFIG.SOUND_VOLUME;
        this.enabled = true;
        
        this.loadSounds();
    }

    loadSounds() {
        const soundFiles = {
            correct: 'assets/sounds/correct.mp3',
            incorrect: 'assets/sounds/incorrect.mp3',
            complete: 'assets/sounds/complete.mp3',
            gameover: 'assets/sounds/gameover.mp3',
            click: 'assets/sounds/click.mp3',
            notification: 'assets/sounds/notification.mp3'
        };

        Object.entries(soundFiles).forEach(([key, src]) => {
            this.sounds[key] = new Audio(src);
            this.sounds[key].volume = this.volume;
            this.sounds[key].preload = 'auto';
            
            // エラーハンドリング
            this.sounds[key].addEventListener('error', () => {
                console.warn(`音声ファイルの読み込みに失敗: ${src}`);
                // フォールバック音声を使用
                this.sounds[key] = null;
            });
        });
    }

    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        
        if (sound && sound.src) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`音声再生エラー (${soundName}):`, error);
                this.playFallback(soundName);
            });
        } else {
            this.playFallback(soundName);
        }
    }
    
    playFallback(soundName) {
        // Web Audio APIを使用したフォールバック音声
        if (window.playFallbackSound) {
            window.playFallbackSound(soundName);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// UIイベントハンドラー
class UIEventHandler {
    constructor() {
        this.setupGlobalEvents();
    }

    setupGlobalEvents() {
        // クリック音
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, [role="button"]')) {
                audioManager.play('click');
            }
        });

        // フォーカス管理
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // 長押し検出
        this.setupLongPressDetection();
    }

    setupLongPressDetection() {
        let pressTimer;
        const longPressDelay = 500;

        document.addEventListener('mousedown', (e) => {
            if (e.target.hasAttribute('data-long-press')) {
                pressTimer = setTimeout(() => {
                    this.handleLongPress(e.target);
                }, longPressDelay);
            }
        });

        document.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
        });

        document.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
        });
    }

    handleLongPress(element) {
        const action = element.getAttribute('data-long-press');
        
        // カスタムイベント発火
        element.dispatchEvent(new CustomEvent('longpress', {
            detail: { action }
        }));

        // バイブレーション（対応デバイス）
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// グローバルインスタンス
let animationManager;
let modalManager;
let notificationSystem;
let tooltipSystem;
let particleSystem;
let audioManager;
let uiEventHandler;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    animationManager = new AnimationManager();
    modalManager = new ModalManager();
    notificationSystem = new NotificationSystem();
    tooltipSystem = new TooltipSystem();
    particleSystem = new ParticleSystem();
    audioManager = new AudioManager();
    uiEventHandler = new UIEventHandler();

    // グローバル参照
    window.animationManager = animationManager;
    window.modalManager = modalManager;
    window.notificationSystem = notificationSystem;
    window.tooltipSystem = tooltipSystem;
    window.particleSystem = particleSystem;
    window.audioManager = audioManager;

    console.log('UIシステムが初期化されました');
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnimationManager,
        ModalManager,
        NotificationSystem,
        TooltipSystem,
        ParticleSystem,
        AudioManager,
        UIEventHandler,
        UI_CONFIG
    };
} 