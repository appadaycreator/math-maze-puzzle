/**
 * 計算の迷宮 - Service Worker
 * PWA機能、オフラインサポート、キャッシュ管理
 */

const CACHE_NAME = 'math-maze-v1.0.0';
const STATIC_CACHE_NAME = 'math-maze-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'math-maze-dynamic-v1.0.0';

// キャッシュするファイルリスト
const STATIC_FILES = [
  '/',
  '/index.html',
  '/about.html',
  '/terms.html',
  '/privacy.html',
  '/contact.html',
  '/lp.html',
  '/css/style.css',
  '/css/game.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/game.js',
  '/js/maze.js',
  '/js/problems.js',
  '/js/ui.js',
  '/assets/icons/favicon.svg',
  '/locales/ja.json',
  '/locales/en.json',
  '/manifest.json',
  // 外部リソース
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap'
];

// キャッシュしないファイルのパターン
const EXCLUDE_PATTERNS = [
  /\/api\//,
  /\/admin\//,
  /\/__debug__\//,
  /\.map$/,
  /^chrome-extension:/,
  /^moz-extension:/,
  /^extension:/
];

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker インストール中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 静的ファイルをキャッシュ中...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] 静的ファイルのキャッシュ完了');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] キャッシュエラー:', error);
      })
  );
});

// Service Worker アクティベート
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker アクティベート中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 古いキャッシュを削除
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] 古いキャッシュを削除:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker アクティベート完了');
        return self.clients.claim();
      })
  );
});

// フェッチイベント（ネットワークリクエストの処理）
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // 除外パターンをチェック（URLスキームも含む）
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(requestUrl.href) || pattern.test(requestUrl.pathname))) {
    return;
  }
  
  // GET リクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    cacheFirst(event.request)
      .catch(() => networkFirst(event.request))
      .catch(() => fallbackResponse(event.request))
  );
});

// キャッシュファーストストラテジー
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] キャッシュから提供:', request.url);
    return cachedResponse;
  }
  
  throw new Error('キャッシュに見つかりません');
}

// ネットワークファーストストラテジー
async function networkFirst(request) {
  try {
    const requestUrl = new URL(request.url);
    
    // Chrome拡張のリクエストは処理しない
    if (requestUrl.protocol === 'chrome-extension:' || 
        requestUrl.protocol === 'moz-extension:') {
      throw new Error('拡張機能のリクエストはスキップ');
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Chrome拡張のリクエストはキャッシュしない
      if (requestUrl.protocol !== 'chrome-extension:' && 
          requestUrl.protocol !== 'moz-extension:') {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.warn('[SW] キャッシュ保存エラー:', cacheError);
        }
      }
      console.log('[SW] ネットワークから提供:', request.url);
      return networkResponse;
    }
    
    throw new Error('ネットワークレスポンスが無効');
  } catch (error) {
    console.log('[SW] ネットワークエラー:', error);
    
    // 動的キャッシュから試行
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] 動的キャッシュから提供:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// フォールバックレスポンス
async function fallbackResponse(request) {
  const url = new URL(request.url);
  
  // HTMLページの場合はオフラインページを提供
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const fallback = await cache.match('/index.html');
    
    if (fallback) {
      console.log('[SW] フォールバックページを提供');
      return fallback;
    }
  }
  
  // その他のリソースには基本的なレスポンスを返す
  return new Response('オフラインです', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

// メッセージ処理
self.addEventListener('message', (event) => {
  console.log('[SW] メッセージ受信:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_CACHE_SIZE':
        getCacheSize().then(size => {
          event.ports[0].postMessage({ cacheSize: size });
        });
        break;
        
      case 'CLEAR_CACHE':
        clearCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
        
      default:
        console.log('[SW] 不明なメッセージタイプ:', event.data.type);
    }
  }
});

// キャッシュサイズ取得
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// キャッシュクリア
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] 全キャッシュをクリアしました');
}

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('[SW] バックグラウンド同期:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // バックグラウンドで実行する処理
    console.log('[SW] バックグラウンド同期実行');
    
    // 例: 保留中のデータを送信
    const pendingData = await getPendingData();
    if (pendingData.length > 0) {
      await sendPendingData(pendingData);
    }
  } catch (error) {
    console.error('[SW] バックグラウンド同期エラー:', error);
  }
}

// プッシュ通知
self.addEventListener('push', (event) => {
  console.log('[SW] プッシュ通知受信');
  
  const options = {
    body: event.data ? event.data.text() : '新しい情報があります',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '確認する',
        icon: '/assets/icons/check.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/assets/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('計算の迷宮', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 通知クリック:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// エラーハンドリング
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker エラー:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] 未処理のPromise拒否:', event.reason);
});

// ユーティリティ関数
async function getPendingData() {
  // IndexedDBから保留中のデータを取得する実装
  return [];
}

async function sendPendingData(data) {
  // サーバーにデータを送信する実装
  console.log('[SW] 保留データ送信:', data);
}

console.log('[SW] Service Worker スクリプト読み込み完了'); 