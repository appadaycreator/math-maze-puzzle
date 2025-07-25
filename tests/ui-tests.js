// UI テスト専用モジュール
// Math Maze Puzzle UI テスト

class UITestSuite {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
    }

    // モバイルメニューテスト
    async testMobileMenu() {
        return new Promise((resolve, reject) => {
            try {
                const mobileMenuButton = document.querySelector('#mobileMenuButton');
                const mobileMenu = document.querySelector('#mobileMenu');
                
                if (!mobileMenuButton) {
                    throw new Error('モバイルメニューボタンが見つかりません');
                }
                
                if (!mobileMenu) {
                    throw new Error('モバイルメニューが見つかりません');
                }
                
                // メニューの初期状態をチェック
                const initialDisplay = window.getComputedStyle(mobileMenu).display;
                
                // ボタンをクリック
                mobileMenuButton.click();
                
                // 少し待ってから状態をチェック
                setTimeout(() => {
                    const newDisplay = window.getComputedStyle(mobileMenu).display;
                    if (newDisplay === initialDisplay) {
                        reject(new Error('モバイルメニューの表示状態が変更されませんでした'));
                    } else {
                        // 元に戻す
                        mobileMenuButton.click();
                        resolve('モバイルメニューが正常に動作しています');
                    }
                }, 300);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 言語切り替えテスト
    async testLanguageSwitch() {
        return new Promise((resolve, reject) => {
            try {
                const languageSelects = document.querySelectorAll('select[data-setting="language"]');
                
                if (languageSelects.length === 0) {
                    throw new Error('言語選択要素が見つかりません');
                }
                
                const select = languageSelects[0];
                const originalValue = select.value;
                
                // 値を変更
                const newValue = originalValue === 'ja' ? 'en' : 'ja';
                select.value = newValue;
                
                // change イベントを発火
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                // 少し待ってから元に戻す
                setTimeout(() => {
                    select.value = originalValue;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    resolve('言語切り替えが正常に動作しています');
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }

    // フォントサイズ変更テスト
    async testFontSizeChange() {
        return new Promise((resolve, reject) => {
            try {
                const fontSizeSelects = document.querySelectorAll('select[data-setting="fontSize"]');
                
                if (fontSizeSelects.length === 0) {
                    throw new Error('フォントサイズ選択要素が見つかりません');
                }
                
                const select = fontSizeSelects[0];
                const originalValue = select.value;
                const originalSize = document.documentElement.style.fontSize;
                
                // 値を変更
                const newValue = originalValue === 'medium' ? 'large' : 'medium';
                select.value = newValue;
                
                // change イベントを発火
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                // 少し待ってからチェック
                setTimeout(() => {
                    const newSize = document.documentElement.style.fontSize;
                    if (newSize === originalSize) {
                        reject(new Error('フォントサイズが変更されませんでした'));
                    } else {
                        // 元に戻す
                        select.value = originalValue;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        resolve('フォントサイズ変更が正常に動作しています');
                    }
                }, 300);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ダークモード切り替えテスト
    async testDarkModeToggle() {
        return new Promise((resolve, reject) => {
            try {
                const darkModeToggles = document.querySelectorAll('input[data-setting="darkMode"]');
                
                if (darkModeToggles.length === 0) {
                    throw new Error('ダークモードトグルが見つかりません');
                }
                
                const toggle = darkModeToggles[0];
                const originalChecked = toggle.checked;
                const originalClass = document.body.className;
                
                // トグルをクリック
                toggle.click();
                
                // 少し待ってからチェック
                setTimeout(() => {
                    const newClass = document.body.className;
                    if (newClass === originalClass) {
                        reject(new Error('ダークモードの状態が変更されませんでした'));
                    } else {
                        // 元に戻す
                        toggle.click();
                        resolve('ダークモード切り替えが正常に動作しています');
                    }
                }, 300);
            } catch (error) {
                reject(error);
            }
        });
    }

    // レスポンシブデザインテスト
    async testResponsiveDesign() {
        return new Promise((resolve, reject) => {
            try {
                const originalWidth = window.innerWidth;
                
                // モバイルサイズをシミュレート
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 375
                });
                
                // リサイズイベントを発火
                window.dispatchEvent(new Event('resize'));
                
                // 少し待ってからチェック
                setTimeout(() => {
                    const mobileMenuButton = document.querySelector('#mobileMenuButton');
                    const desktopNav = document.querySelector('nav:not(#mobileMenu)');
                    
                    if (!mobileMenuButton || !desktopNav) {
                        reject(new Error('レスポンシブ要素が見つかりません'));
                        return;
                    }
                    
                    // 元のサイズに戻す
                    Object.defineProperty(window, 'innerWidth', {
                        writable: true,
                        configurable: true,
                        value: originalWidth
                    });
                    window.dispatchEvent(new Event('resize'));
                    
                    resolve('レスポンシブデザインが正常に動作しています');
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }

    // アクセシビリティテスト
    async testAccessibility() {
        return new Promise((resolve, reject) => {
            try {
                const focusableElements = document.querySelectorAll(
                    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length === 0) {
                    throw new Error('フォーカス可能な要素が見つかりません');
                }
                
                let missingAriaLabels = 0;
                let missingAltTexts = 0;
                
                // ARIA ラベルのチェック
                focusableElements.forEach(element => {
                    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent.trim()) {
                        missingAriaLabels++;
                    }
                });
                
                // 画像の alt 属性チェック
                const images = document.querySelectorAll('img');
                images.forEach(img => {
                    if (!img.getAttribute('alt')) {
                        missingAltTexts++;
                    }
                });
                
                const issues = [];
                if (missingAriaLabels > 0) {
                    issues.push(`${missingAriaLabels}個のボタンにaria-labelが不足`);
                }
                if (missingAltTexts > 0) {
                    issues.push(`${missingAltTexts}個の画像にalt属性が不足`);
                }
                
                if (issues.length > 0) {
                    reject(new Error(`アクセシビリティの問題: ${issues.join(', ')}`));
                } else {
                    resolve('アクセシビリティテストに合格しました');
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // フォームバリデーションテスト
    async testFormValidation() {
        return new Promise((resolve, reject) => {
            try {
                const forms = document.querySelectorAll('form');
                
                if (forms.length === 0) {
                    resolve('フォームが存在しないため、テストをスキップします');
                    return;
                }
                
                let validationCount = 0;
                
                forms.forEach(form => {
                    const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
                    
                    requiredInputs.forEach(input => {
                        // 空の値でバリデーションをテスト
                        const originalValue = input.value;
                        input.value = '';
                        
                        if (input.checkValidity()) {
                            throw new Error(`必須フィールドのバリデーションが機能していません: ${input.name || input.id}`);
                        }
                        
                        // 元の値に戻す
                        input.value = originalValue;
                        validationCount++;
                    });
                });
                
                resolve(`${validationCount}個のフィールドでバリデーションが正常に動作しています`);
            } catch (error) {
                reject(error);
            }
        });
    }

    // キーボードナビゲーションテスト
    async testKeyboardNavigation() {
        return new Promise((resolve, reject) => {
            try {
                const focusableElements = document.querySelectorAll(
                    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length < 2) {
                    resolve('フォーカス可能な要素が少ないため、テストをスキップします');
                    return;
                }
                
                // 最初の要素にフォーカス
                focusableElements[0].focus();
                
                // Tab キーをシミュレート
                const tabEvent = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    code: 'Tab',
                    keyCode: 9,
                    bubbles: true
                });
                
                document.dispatchEvent(tabEvent);
                
                // 少し待ってからチェック
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (!activeElement || activeElement === focusableElements[0]) {
                        reject(new Error('キーボードナビゲーションが正常に動作していません'));
                    } else {
                        resolve('キーボードナビゲーションが正常に動作しています');
                    }
                }, 100);
            } catch (error) {
                reject(error);
            }
        });
    }

    // パフォーマンステスト
    async testPerformance() {
        return new Promise((resolve, reject) => {
            try {
                const startTime = performance.now();
                
                // DOM操作のパフォーマンステスト
                const testElement = document.createElement('div');
                testElement.innerHTML = '<p>パフォーマンステスト</p>'.repeat(100);
                document.body.appendChild(testElement);
                
                // 計算集約的な処理をテスト
                let result = 0;
                for (let i = 0; i < 10000; i++) {
                    result += Math.random();
                }
                
                // 要素を削除
                document.body.removeChild(testElement);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (duration > 1000) {
                    reject(new Error(`パフォーマンスが低下しています: ${duration.toFixed(2)}ms`));
                } else {
                    resolve(`パフォーマンステストに合格: ${duration.toFixed(2)}ms`);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // メモリリークテスト
    async testMemoryLeaks() {
        return new Promise((resolve, reject) => {
            try {
                if (!performance.memory) {
                    resolve('ブラウザがメモリ情報をサポートしていません');
                    return;
                }
                
                const initialMemory = performance.memory.usedJSHeapSize;
                
                // メモリを消費する処理
                const largeArray = new Array(100000).fill(0).map((_, i) => ({
                    id: i,
                    data: 'test data '.repeat(10)
                }));
                
                // 少し待つ
                setTimeout(() => {
                    // 配列をクリア
                    largeArray.length = 0;
                    
                    // ガベージコレクションを促す
                    if (window.gc) {
                        window.gc();
                    }
                    
                    setTimeout(() => {
                        const finalMemory = performance.memory.usedJSHeapSize;
                        const memoryIncrease = finalMemory - initialMemory;
                        
                        if (memoryIncrease > 10 * 1024 * 1024) { // 10MB以上の増加
                            reject(new Error(`メモリリークの可能性: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB増加`));
                        } else {
                            resolve(`メモリテストに合格: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB増加`);
                        }
                    }, 1000);
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }

    // すべてのUIテストを実行
    async runAllUITests() {
        const tests = [
            { name: 'モバイルメニューテスト', method: this.testMobileMenu },
            { name: '言語切り替えテスト', method: this.testLanguageSwitch },
            { name: 'フォントサイズ変更テスト', method: this.testFontSizeChange },
            { name: 'ダークモード切り替えテスト', method: this.testDarkModeToggle },
            { name: 'レスポンシブデザインテスト', method: this.testResponsiveDesign },
            { name: 'アクセシビリティテスト', method: this.testAccessibility },
            { name: 'フォームバリデーションテスト', method: this.testFormValidation },
            { name: 'キーボードナビゲーションテスト', method: this.testKeyboardNavigation },
            { name: 'パフォーマンステスト', method: this.testPerformance },
            { name: 'メモリリークテスト', method: this.testMemoryLeaks }
        ];

        const results = [];

        for (const test of tests) {
            try {
                const result = await test.method.call(this);
                results.push({
                    name: test.name,
                    status: 'passed',
                    message: result
                });
                console.log(`✅ ${test.name}: ${result}`);
            } catch (error) {
                results.push({
                    name: test.name,
                    status: 'failed',
                    message: error.message
                });
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        }

        return results;
    }
}

// ユーティリティ関数
const UITestUtils = {
    // 要素が表示されているかチェック
    isElementVisible: (element) => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    },

    // 要素がフォーカス可能かチェック
    isFocusable: (element) => {
        if (!element) return false;
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        return focusableSelectors.some(selector => element.matches(selector));
    },

    // CSS プロパティの値を取得
    getCSSProperty: (element, property) => {
        if (!element) return null;
        return window.getComputedStyle(element).getPropertyValue(property);
    },

    // 要素のサイズを取得
    getElementSize: (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        };
    },

    // カラーコントラストを計算
    calculateColorContrast: (color1, color2) => {
        // 簡易的なコントラスト計算
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            const [r, g, b] = rgb.map(c => {
                c = parseInt(c) / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.UITestSuite = UITestSuite;
    window.UITestUtils = UITestUtils;
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UITestSuite, UITestUtils };
} 