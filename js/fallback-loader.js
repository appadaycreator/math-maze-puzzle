/**
 * フォールバックローダー - CDNリソースの読み込み失敗時の対処
 */

class FallbackLoader {
  constructor() {
    this.cdnResources = [
      {
        cdn: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        fallback: 'assets/lib/tailwind/tailwind.min.css',
        type: 'css'
      },
      {
        cdn: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
        fallback: 'assets/lib/fontawesome/all.min.css',
        type: 'css'
      },
      {
        cdn: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
        fallback: 'assets/lib/fonts/noto-sans-jp.css',
        type: 'css'
      }
    ];
    
    this.init();
  }
  
  init() {
    // CDNリソースの読み込み状況をチェック
    this.checkCDNResources();
    
    // フォールバック用のスタイルを読み込み
    this.loadFallbackCSS();
  }
  
  async checkCDNResources() {
    const promises = this.cdnResources.map(async (resource) => {
      return this.testResource(resource);
    });
    
    const results = await Promise.allSettled(promises);
    console.log('[Fallback] CDNリソース確認結果:', results);
  }
  
  async testResource(resource) {
    try {
      // 既存のlink要素を確認
      const existingLink = document.querySelector(`link[href="${resource.cdn}"]`);
      if (existingLink) {
        // 少し待ってからロード状況を確認
        await this.delay(1000);
        
        if (!this.isResourceLoaded(existingLink)) {
          console.warn(`[Fallback] CDNリソースの読み込み失敗: ${resource.cdn}`);
          await this.loadFallbackResource(resource);
        } else {
          console.log(`[Fallback] CDNリソース正常: ${resource.cdn}`);
        }
      }
    } catch (error) {
      console.error(`[Fallback] リソース確認エラー: ${resource.cdn}`, error);
      await this.loadFallbackResource(resource);
    }
  }
  
  isResourceLoaded(linkElement) {
    // CSSが正しく読み込まれているかチェック
    try {
      const sheets = document.styleSheets;
      for (let i = 0; i < sheets.length; i++) {
        if (sheets[i].href === linkElement.href) {
          return sheets[i].cssRules.length > 0;
        }
      }
    } catch (e) {
      // CORS等でアクセスできない場合は読み込み成功と判断
      return true;
    }
    return false;
  }
  
  async loadFallbackResource(resource) {
    console.log(`[Fallback] フォールバックリソースを読み込み: ${resource.fallback}`);
    
    if (resource.type === 'css') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resource.fallback;
      link.onerror = () => {
        console.error(`[Fallback] フォールバックリソースも読み込めません: ${resource.fallback}`);
        this.addFallbackClasses();
      };
      
      document.head.appendChild(link);
    }
  }
  
  loadFallbackCSS() {
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = 'css/fallback.css';
    document.head.appendChild(fallbackLink);
  }
  
  addFallbackClasses() {
    // 最低限のスタイルを直接追加
    if (!document.querySelector('#fallback-emergency-styles')) {
      const style = document.createElement('style');
      style.id = 'fallback-emergency-styles';
      style.textContent = `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 80px 20px 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .btn { 
          padding: 8px 16px; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          margin: 4px;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .text-center { text-align: center; }
        .hidden { display: none; }
        .block { display: block; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .mb-4 { margin-bottom: 1rem; }
        .p-4 { padding: 1rem; }
        .bg-white { background: white; }
        .rounded { border-radius: 4px; }
        .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      `;
      document.head.appendChild(style);
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ページ読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FallbackLoader();
  });
} else {
  new FallbackLoader();
}