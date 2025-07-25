/**
 * 音声生成器 - Web Audio APIを使用してサウンドエフェクトを生成
 */

class AudioGenerator {
  constructor() {
    this.audioContext = null;
    this.init();
  }
  
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('[Audio] Web Audio API not available:', error);
    }
  }
  
  // 正解音（成功音）
  generateCorrectSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // C major chord progression
    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
    
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
    
    return oscillator;
  }
  
  // 不正解音（エラー音）
  generateIncorrectSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
    
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
    
    return oscillator;
  }
  
  // クリック音
  generateClickSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
    
    return oscillator;
  }
  
  // 完了音（レベルクリア音）
  generateCompleteSound() {
    if (!this.audioContext) return null;
    
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C, D, E, F, G
    let time = this.audioContext.currentTime;
    
    notes.forEach((frequency, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      oscillator.start(time);
      oscillator.stop(time + 0.2);
      
      time += 0.15;
    });
  }
  
  // ゲームオーバー音
  generateGameOverSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
    
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1);
    
    return oscillator;
  }
  
  // 通知音
  generateNotificationSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime + 0.2);
    
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
    
    return oscillator;
  }
  
  // ファイル生成用のメソッド（開発用）
  async generateAudioFiles() {
    if (!this.audioContext) {
      console.warn('[Audio] Cannot generate files without Web Audio API');
      return;
    }
    
    const sounds = {
      'correct': () => this.generateCorrectSound(),
      'incorrect': () => this.generateIncorrectSound(),
      'click': () => this.generateClickSound(),
      'complete': () => this.generateCompleteSound(),
      'gameover': () => this.generateGameOverSound(),
      'notification': () => this.generateNotificationSound()
    };
    
    console.log('[Audio] Generated sounds available:', Object.keys(sounds));
  }
}

// グローバルにインスタンスを作成
window.audioGenerator = new AudioGenerator();

// 音声ファイルが存在しない場合のフォールバック関数
window.playFallbackSound = function(soundType) {
  if (!window.audioGenerator) return;
  
  switch(soundType) {
    case 'correct':
      window.audioGenerator.generateCorrectSound();
      break;
    case 'incorrect':
      window.audioGenerator.generateIncorrectSound();
      break;
    case 'click':
      window.audioGenerator.generateClickSound();
      break;
    case 'complete':
      window.audioGenerator.generateCompleteSound();
      break;
    case 'gameover':
      window.audioGenerator.generateGameOverSound();
      break;
    case 'notification':
      window.audioGenerator.generateNotificationSound();
      break;
    default:
      console.warn('[Audio] Unknown sound type:', soundType);
  }
};