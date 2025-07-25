// UI Tests for Math Maze Puzzle
class UITests {
    static registerTests(testSuite) {
        // ユニットテスト
        this.registerUnitTests(testSuite);
        
        // 統合テスト
        this.registerIntegrationTests(testSuite);
        
        // UIテスト
        this.registerUITests(testSuite);
        
        // パフォーマンステスト
        this.registerPerformanceTests(testSuite);
    }

    static registerUnitTests(testSuite) {
        // Utils関数のテスト
        testSuite.addTest(
            'Utils.formatTime() - 正常系',
            'unit',
            () => {
                if (typeof Utils === 'undefined') throw new Error('Utils is not defined');
                const result = Utils.formatTime(125);
                if (result !== '02:05') throw new Error(`Expected "02:05", got "${result}"`);
            },
            'Utils.formatTime()が正しく時間をフォーマットするかテスト'
        );

        testSuite.addTest(
            'Utils.generateRandomId() - 一意性',
            'unit',
            () => {
                if (typeof Utils === 'undefined') throw new Error('Utils is not defined');
                const id1 = Utils.generateRandomId();
                const id2 = Utils.generateRandomId();
                if (id1 === id2) throw new Error('Generated IDs are not unique');
                if (typeof id1 !== 'string') throw new Error('ID should be a string');
            },
            'Utils.generateRandomId()が一意のIDを生成するかテスト'
        );

        testSuite.addTest(
            'AppState.saveConfig() - ローカルストレージ',
            'unit',
            () => {
                if (typeof AppState === 'undefined') throw new Error('AppState is not defined');
                const testConfig = { language: 'en', fontSize: 'large' };
                AppState.config = testConfig;
                AppState.saveConfig();
                
                const saved = JSON.parse(localStorage.getItem('math-maze-config') || '{}');
                if (saved.language !== 'en') throw new Error('Config not saved correctly');
            },
            'AppState.saveConfig()がローカルストレージに正しく保存するかテスト'
        );

        // ゲーム設定のテスト
        testSuite.addTest(
            'GAME_CONFIG - レベル設定の整合性',
            'unit',
            () => {
                if (typeof GAME_CONFIG === 'undefined') throw new Error('GAME_CONFIG is not defined');
                if (!Array.isArray(GAME_CONFIG.levels)) throw new Error('levels should be an array');
                if (GAME_CONFIG.levels.length === 0) throw new Error('No levels defined');
                
                GAME_CONFIG.levels.forEach((level, index) => {
                    if (!level.name) throw new Error(`Level ${index} has no name`);
                    if (!Array.isArray(level.stages)) throw new Error(`Level ${index} stages should be an array`);
                });
            },
            'ゲーム設定のレベル構造が正しいかテスト'
        );
    }

    static registerIntegrationTests(testSuite) {
        testSuite.addTest(
            'GameManager - ゲーム初期化',
            'integration',
            async () => {
                if (typeof GameManager === 'undefined') throw new Error('GameManager is not defined');
                
                const gameManager = GameManager.getInstance();
                await gameManager.initialize();
                
                if (!gameManager.state) throw new Error('Game state not initialized');
                if (gameManager.state.currentLevel !== 0) throw new Error('Initial level should be 0');
            },
            'GameManagerが正しく初期化されるかテスト'
        );

        testSuite.addTest(
            'ローカライゼーション - 言語切り替え',
            'integration',
            async () => {
                if (typeof AppState === 'undefined') throw new Error('AppState is not defined');
                
                // 日本語に設定
                await AppState.setLanguage('ja');
                if (AppState.config.language !== 'ja') throw new Error('Language not set to ja');
                
                // 英語に設定
                await AppState.setLanguage('en');
                if (AppState.config.language !== 'en') throw new Error('Language not set to en');
            },
            '言語切り替えが正常に動作するかテスト'
        );

        testSuite.addTest(
            'ゲームフロー - レベル進行',
            'integration',
            async () => {
                if (typeof GameManager === 'undefined') throw new Error('GameManager is not defined');
                
                const gameManager = GameManager.getInstance();
                await gameManager.initialize();
                
                const initialLevel = gameManager.state.currentLevel;
                const initialStage = gameManager.state.currentStage;
                
                // ステージクリアをシミュレート
                gameManager.state.completeStage();
                
                if (gameManager.state.currentStage <= initialStage && gameManager.state.currentLevel <= initialLevel) {
                    throw new Error('Stage/Level progression not working');
                }
            },
            'ゲームの進行（レベル・ステージ）が正常に動作するかテスト'
        );
    }

    static registerUITests(testSuite) {
        testSuite.addTest(
            'DOM要素 - 必須要素の存在確認',
            'ui',
            () => {
                const requiredElements = [
                    'header', 'nav', 'main', 'footer',
                    'game-container', 'start-screen', 'game-screen'
                ];
                
                requiredElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (!element) throw new Error(`Required element #${id} not found`);
                });
            },
            '必要なDOM要素が存在するかテスト'
        );

        testSuite.addTest(
            'レスポンシブデザイン - ビューポート',
            'ui',
            () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (!viewport) throw new Error('Viewport meta tag not found');
                
                const content = viewport.getAttribute('content');
                if (!content.includes('width=device-width')) {
                    throw new Error('Viewport not set for responsive design');
                }
            },
            'レスポンシブデザインのためのビューポート設定をテスト'
        );

        testSuite.addTest(
            'アクセシビリティ - 基本要素',
            'ui',
            () => {
                // alt属性のチェック
                const images = document.querySelectorAll('img:not([alt])');
                if (images.length > 0) throw new Error(`${images.length} images without alt attribute found`);
                
                // ボタンのアクセシブルネーム
                const buttons = document.querySelectorAll('button');
                buttons.forEach((button, index) => {
                    const hasAccessibleName = button.textContent.trim() || 
                                            button.getAttribute('aria-label') || 
                                            button.getAttribute('aria-labelledby');
                    if (!hasAccessibleName) {
                        throw new Error(`Button ${index} has no accessible name`);
                    }
                });
            },
            '基本的なアクセシビリティ要件をテスト'
        );

        testSuite.addTest(
            'フォーム - バリデーション',
            'ui',
            () => {
                const forms = document.querySelectorAll('form');
                forms.forEach((form, index) => {
                    const requiredFields = form.querySelectorAll('[required]');
                    requiredFields.forEach((field, fieldIndex) => {
                        if (!field.getAttribute('aria-describedby') && !field.closest('label')) {
                            console.warn(`Form ${index} field ${fieldIndex} might need better labeling`);
                        }
                    });
                });
                
                // 少なくとも警告なしで完了
                return true;
            },
            'フォームのバリデーションとラベリングをテスト'
        );
    }

    static registerPerformanceTests(testSuite) {
        testSuite.addTest(
            'DOM操作 - 要素検索パフォーマンス',
            'performance',
            () => {
                const startTime = performance.now();
                
                // 100回の要素検索を実行
                for (let i = 0; i < 100; i++) {
                    document.getElementById('header');
                    document.querySelector('.game-container');
                    document.querySelectorAll('button');
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (duration > 50) {
                    throw new Error(`DOM queries too slow: ${duration}ms`);
                }
            },
            'DOM要素検索のパフォーマンスをテスト'
        );

        testSuite.addTest(
            'メモリ使用量 - オブジェクト生成',
            'performance',
            () => {
                const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                // 大量のオブジェクトを生成
                const objects = [];
                for (let i = 0; i < 1000; i++) {
                    objects.push({
                        id: i,
                        data: new Array(100).fill(Math.random())
                    });
                }
                
                const afterMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                // オブジェクトをクリア
                objects.length = 0;
                
                // ガベージコレクションの実行（ブラウザ依存）
                if (window.gc) {
                    window.gc();
                }
                
                if (performance.memory && (afterMemory - initialMemory) > 10000000) { // 10MB
                    console.warn(`Memory usage increased by ${(afterMemory - initialMemory) / 1000000}MB`);
                }
            },
            'メモリ使用量の増加をテスト'
        );

        testSuite.addTest(
            'アニメーション - フレームレート',
            'performance',
            () => {
                return new Promise((resolve, reject) => {
                    let frames = 0;
                    const startTime = performance.now();
                    
                    function animate() {
                        frames++;
                        const currentTime = performance.now();
                        const elapsed = currentTime - startTime;
                        
                        if (elapsed >= 1000) { // 1秒間測定
                            const fps = frames / (elapsed / 1000);
                            if (fps < 30) {
                                reject(new Error(`Low FPS detected: ${fps.toFixed(1)}`));
                            } else {
                                resolve();
                            }
                        } else {
                            requestAnimationFrame(animate);
                        }
                    }
                    
                    requestAnimationFrame(animate);
                });
            },
            'アニメーションのフレームレートをテスト'
        );

        testSuite.addTest(
            'ローカルストレージ - 読み書きパフォーマンス',
            'performance',
            () => {
                const testData = {
                    largeArray: new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() }))
                };
                
                const startWrite = performance.now();
                localStorage.setItem('performance-test', JSON.stringify(testData));
                const writeTime = performance.now() - startWrite;
                
                const startRead = performance.now();
                const readData = JSON.parse(localStorage.getItem('performance-test') || '{}');
                const readTime = performance.now() - startRead;
                
                // クリーンアップ
                localStorage.removeItem('performance-test');
                
                if (writeTime > 100) {
                    throw new Error(`localStorage write too slow: ${writeTime}ms`);
                }
                
                if (readTime > 50) {
                    throw new Error(`localStorage read too slow: ${readTime}ms`);
                }
                
                if (!readData.largeArray || readData.largeArray.length !== 1000) {
                    throw new Error('Data integrity check failed');
                }
            },
            'ローカルストレージの読み書きパフォーマンスをテスト'
        );
    }

    // ヘルパーメソッド
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    static simulateClick(element) {
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    static simulateKeyPress(element, key) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// グローバルに公開
window.UITests = UITests; 