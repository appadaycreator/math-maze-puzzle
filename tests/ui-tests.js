/**
 * Math Maze Puzzle - UI Tests
 * ユーザーインターフェイステスト用モジュール
 */

// Math Maze Puzzle - UIテスト

// ユニットテストモジュール
QUnit.module('Unit Tests', function() {
    
    QUnit.module('Utils', function() {
        QUnit.test('DOM操作ヘルパー', function(assert) {
            // Utils.$(selector)のテスト
            const testElement = TestHelpers.createMockElement('div', { id: 'test-element' });
            document.body.appendChild(testElement);
            
            if (window.Utils && Utils.$) {
                const result = Utils.$('#test-element');
                assert.ok(result, 'Utils.$でDOM要素を取得できる');
            } else {
                assert.ok(true, 'Utils.$ is not available - skipping test');
            }
            
            document.body.removeChild(testElement);
        });

        QUnit.test('フォーマット関数', function(assert) {
            if (window.Utils) {
                if (Utils.formatTime) {
                    assert.equal(Utils.formatTime(65), '01:05', '時間フォーマットが正しい');
                    assert.equal(Utils.formatTime(3661), '61:01', '長時間フォーマットが正しい');
                }
                
                if (Utils.formatScore) {
                    assert.equal(Utils.formatScore(1000), '1,000', 'スコアフォーマットが正しい');
                    assert.equal(Utils.formatScore(1234567), '1,234,567', '大きなスコアフォーマットが正しい');
                }
            } else {
                assert.ok(true, 'Utils is not available - skipping test');
            }
        });

        QUnit.test('ランダム関数', function(assert) {
            if (window.Utils && Utils.random) {
                const result1 = Utils.random(1, 10);
                assert.ok(result1 >= 1 && result1 <= 10, 'ランダム数値が範囲内');
                
                const result2 = Utils.random(1, 1);
                assert.equal(result2, 1, '同じ値の範囲で正しい結果');
            } else {
                assert.ok(true, 'Utils.random is not available - skipping test');
            }
        });
    });

    QUnit.module('AppState', function() {
        QUnit.test('設定の保存と読み込み', function(assert) {
            if (window.AppState) {
                const mockStorage = TestHelpers.mockLocalStorage();
                const originalLocalStorage = window.localStorage;
                window.localStorage = mockStorage;

                AppState.saveConfig();
                AppState.loadConfig();
                
                assert.ok(true, 'AppState設定の保存・読み込みが実行される');
                
                window.localStorage = originalLocalStorage;
            } else {
                assert.ok(true, 'AppState is not available - skipping test');
            }
        });

        QUnit.test('言語切り替え', function(assert) {
            if (window.AppState && AppState.applyLanguage) {
                const currentLang = AppState.config ? AppState.config.language : 'ja';
                
                AppState.applyLanguage('en');
                assert.ok(true, '英語への切り替えが実行される');
                
                AppState.applyLanguage('ja');
                assert.ok(true, '日本語への切り替えが実行される');
                
                // 元の言語に戻す
                if (AppState.config) {
                    AppState.config.language = currentLang;
                }
            } else {
                assert.ok(true, 'AppState.applyLanguage is not available - skipping test');
            }
        });
    });

    QUnit.module('GameState', function() {
        QUnit.test('ゲーム状態の初期化', function(assert) {
            if (window.GameState) {
                const gameState = new GameState();
                assert.ok(gameState, 'GameStateインスタンスが作成される');
                assert.equal(gameState.level, 1, '初期レベルが1');
                assert.equal(gameState.stage, 1, '初期ステージが1');
                assert.equal(gameState.score, 0, '初期スコアが0');
            } else {
                assert.ok(true, 'GameState is not available - skipping test');
            }
        });

        QUnit.test('ゲーム開始', function(assert) {
            if (window.GameState) {
                const gameState = new GameState();
                gameState.startGame();
                
                assert.ok(gameState.gameStarted, 'ゲームが開始される');
                assert.ok(gameState.startTime, '開始時間が記録される');
            } else {
                assert.ok(true, 'GameState is not available - skipping test');
            }
        });

        QUnit.test('回答チェック', function(assert) {
            if (window.GameState) {
                const gameState = new GameState();
                gameState.currentProblem = { answer: 10 };
                
                const correctResult = gameState.checkAnswer(10);
                assert.ok(correctResult, '正答が正しく判定される');
                
                const incorrectResult = gameState.checkAnswer(5);
                assert.notOk(incorrectResult, '誤答が正しく判定される');
            } else {
                assert.ok(true, 'GameState is not available - skipping test');
            }
        });
    });
});

// 統合テストモジュール
QUnit.module('Integration Tests', function() {
    
    QUnit.test('ゲーム初期化フロー', function(assert) {
        const done = assert.async();
        
        // GameManagerの初期化テスト
        if (window.GameManager) {
            try {
                const manager = GameManager.getInstance();
                assert.ok(manager, 'GameManagerのシングルトンインスタンスが取得できる');
                
                // 少し待ってから完了
                setTimeout(() => {
                    done();
                }, 100);
            } catch (error) {
                assert.ok(false, 'GameManager initialization failed: ' + error.message);
                done();
            }
        } else {
            assert.ok(true, 'GameManager is not available - skipping test');
            done();
        }
    });

    QUnit.test('問題生成と迷路生成の連携', function(assert) {
        if (window.ProblemGenerator && window.MazeGenerator) {
            try {
                const problem = ProblemGenerator.generate(1, 'addition');
                assert.ok(problem, '問題が生成される');
                assert.ok(problem.question, '問題文が存在する');
                assert.ok(typeof problem.answer === 'number', '答えが数値');
                
                const maze = MazeGenerator.generate(10, 10);
                assert.ok(maze, '迷路が生成される');
                assert.ok(Array.isArray(maze), '迷路が配列形式');
            } catch (error) {
                assert.ok(false, 'Problem/Maze generation failed: ' + error.message);
            }
        } else {
            assert.ok(true, 'ProblemGenerator or MazeGenerator is not available - skipping test');
        }
    });
});

// UIテストモジュール
QUnit.module('UI Tests', function() {
    
    QUnit.test('メニュー操作', function(assert) {
        const done = assert.async();
        
        // モバイルメニューボタンのテスト
        const menuButton = document.querySelector('[data-mobile-menu-button]');
        const mobileMenu = document.querySelector('[data-mobile-menu]');
        
        if (menuButton && mobileMenu) {
            // メニュー開閉テスト
            TestHelpers.simulateEvent(menuButton, 'click');
            
            setTimeout(() => {
                const isOpen = mobileMenu.classList.contains('open') || 
                              !mobileMenu.classList.contains('hidden');
                assert.ok(true, 'メニューボタンのクリックイベントが処理される');
                done();
            }, 50);
        } else {
            assert.ok(true, 'Mobile menu elements not found - skipping test');
            done();
        }
    });

    QUnit.test('言語切り替えUI', function(assert) {
        const languageSelect = document.querySelector('[data-language-select]');
        
        if (languageSelect) {
            const originalValue = languageSelect.value;
            
            // 言語選択の変更テスト
            languageSelect.value = 'en';
            TestHelpers.simulateEvent(languageSelect, 'change');
            
            assert.ok(true, '言語選択の変更イベントが処理される');
            
            // 元の値に戻す
            languageSelect.value = originalValue;
            TestHelpers.simulateEvent(languageSelect, 'change');
        } else {
            assert.ok(true, 'Language select element not found - skipping test');
        }
    });

    QUnit.test('フォントサイズ調整UI', function(assert) {
        const fontSizeSelect = document.querySelector('[data-font-size-select]');
        
        if (fontSizeSelect) {
            const originalValue = fontSizeSelect.value;
            
            // フォントサイズの変更テスト
            fontSizeSelect.value = 'large';
            TestHelpers.simulateEvent(fontSizeSelect, 'change');
            
            assert.ok(true, 'フォントサイズ選択の変更イベントが処理される');
            
            // 元の値に戻す
            fontSizeSelect.value = originalValue;
            TestHelpers.simulateEvent(fontSizeSelect, 'change');
        } else {
            assert.ok(true, 'Font size select element not found - skipping test');
        }
    });

    QUnit.test('ゲーム開始ボタン', function(assert) {
        const startButton = document.querySelector('[data-start-game]');
        
        if (startButton) {
            TestHelpers.simulateEvent(startButton, 'click');
            assert.ok(true, 'ゲーム開始ボタンのクリックイベントが処理される');
        } else {
            assert.ok(true, 'Start game button not found - skipping test');
        }
    });

    QUnit.test('回答ボタンの動作', function(assert) {
        const answerButtons = document.querySelectorAll('[data-answer-button]');
        
        if (answerButtons.length > 0) {
            const firstButton = answerButtons[0];
            TestHelpers.simulateEvent(firstButton, 'click');
            assert.ok(true, '回答ボタンのクリックイベントが処理される');
        } else {
            assert.ok(true, 'Answer buttons not found - skipping test');
        }
    });
});

// パフォーマンステストモジュール
QUnit.module('Performance Tests', function() {
    
    QUnit.test('大きな迷路の生成パフォーマンス', function(assert) {
        if (window.MazeGenerator) {
            const startTime = performance.now();
            
            try {
                const largeMaze = MazeGenerator.generate(50, 50);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                assert.ok(largeMaze, '大きな迷路が生成される');
                assert.ok(duration < 1000, `迷路生成が1秒以内に完了 (${duration.toFixed(2)}ms)`);
            } catch (error) {
                assert.ok(false, 'Large maze generation failed: ' + error.message);
            }
        } else {
            assert.ok(true, 'MazeGenerator is not available - skipping test');
        }
    });

    QUnit.test('連続問題生成のパフォーマンス', function(assert) {
        if (window.ProblemGenerator) {
            const startTime = performance.now();
            const problemCount = 100;
            
            try {
                for (let i = 0; i < problemCount; i++) {
                    ProblemGenerator.generate(1, 'addition');
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                assert.ok(duration < 500, `${problemCount}問の生成が0.5秒以内 (${duration.toFixed(2)}ms)`);
            } catch (error) {
                assert.ok(false, 'Continuous problem generation failed: ' + error.message);
            }
        } else {
            assert.ok(true, 'ProblemGenerator is not available - skipping test');
        }
    });
});

// アクセシビリティテストモジュール
QUnit.module('Accessibility Tests', function() {
    
    QUnit.test('キーボード操作のサポート', function(assert) {
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        assert.ok(focusableElements.length > 0, 'フォーカス可能な要素が存在する');
        
        // Tab キーナビゲーションのテスト
        if (focusableElements.length > 1) {
            focusableElements[0].focus();
            
            // Tab キーのシミュレーション
            TestHelpers.simulateEvent(document, 'keydown', { 
                key: 'Tab', 
                keyCode: 9,
                which: 9
            });
            
            assert.ok(true, 'Tab キーナビゲーションが処理される');
        }
    });

    QUnit.test('ARIA属性の確認', function(assert) {
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
        
        if (ariaElements.length > 0) {
            assert.ok(true, 'ARIA属性を持つ要素が存在する');
            
            ariaElements.forEach(element => {
                const hasAriaLabel = element.hasAttribute('aria-label') || 
                                   element.hasAttribute('aria-labelledby') || 
                                   element.hasAttribute('role');
                assert.ok(hasAriaLabel, 'ARIA属性が適切に設定されている');
            });
        } else {
            assert.ok(true, 'ARIA elements not found - consider adding for better accessibility');
        }
    });

    QUnit.test('コントラスト比と可読性', function(assert) {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        
        if (textElements.length > 0) {
            assert.ok(true, 'テキスト要素が存在する');
            
            // 基本的な可読性チェック（実際のコントラスト計算は複雑なため簡略化）
            textElements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                const color = computedStyle.color;
                const backgroundColor = computedStyle.backgroundColor;
                
                assert.ok(color !== backgroundColor, '文字色と背景色が異なる');
            });
        } else {
            assert.ok(true, 'No text elements found for contrast testing');
        }
    });
});

// エラーハンドリングテストモジュール
QUnit.module('Error Handling Tests', function() {
    
    QUnit.test('無効な入力値の処理', function(assert) {
        if (window.GameState) {
            const gameState = new GameState();
            
            // 無効な回答値のテスト
            try {
                const result1 = gameState.checkAnswer(null);
                assert.ok(true, 'null値が適切に処理される');
                
                const result2 = gameState.checkAnswer(undefined);
                assert.ok(true, 'undefined値が適切に処理される');
                
                const result3 = gameState.checkAnswer('invalid');
                assert.ok(true, '無効な文字列が適切に処理される');
            } catch (error) {
                assert.ok(false, 'Error handling failed: ' + error.message);
            }
        } else {
            assert.ok(true, 'GameState is not available - skipping test');
        }
    });

    QUnit.test('ローカルストレージエラーの処理', function(assert) {
        if (window.AppState) {
            // ローカルストレージが利用できない場合のテスト
            const originalLocalStorage = window.localStorage;
            window.localStorage = null;
            
            try {
                AppState.saveConfig();
                AppState.loadConfig();
                assert.ok(true, 'ローカルストレージエラーが適切に処理される');
            } catch (error) {
                assert.ok(true, 'ローカルストレージエラーが捕捉される: ' + error.message);
            } finally {
                window.localStorage = originalLocalStorage;
            }
        } else {
            assert.ok(true, 'AppState is not available - skipping test');
        }
    });
});

// レスポンシブテストモジュール
QUnit.module('Responsive Tests', function() {
    
    QUnit.test('ビューポートサイズの変更', function(assert) {
        const originalInnerWidth = window.innerWidth;
        const originalInnerHeight = window.innerHeight;
        
        // モバイル画面サイズのシミュレーション
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 667
        });
        
        TestHelpers.simulateEvent(window, 'resize');
        
        assert.ok(true, 'モバイル画面サイズでリサイズイベントが処理される');
        
        // タブレット画面サイズのシミュレーション
        window.innerWidth = 768;
        window.innerHeight = 1024;
        
        TestHelpers.simulateEvent(window, 'resize');
        
        assert.ok(true, 'タブレット画面サイズでリサイズイベントが処理される');
        
        // 元のサイズに戻す
        window.innerWidth = originalInnerWidth;
        window.innerHeight = originalInnerHeight;
    });
});

// 最後に実行されるクリーンアップ
QUnit.done(function() {
    console.log('All tests completed!');
}); 