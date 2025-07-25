/**
 * 計算の迷宮 - 問題生成モジュール
 * レベル別の計算問題を生成し、選択肢を提供
 */

'use strict';

// 問題生成の設定
const PROBLEM_CONFIG = {
    CHOICE_COUNT: 4,
    DECIMAL_PLACES: 2,
    FRACTION_DENOMINATORS: [2, 3, 4, 5, 6, 8, 10, 12],
    OPERATIONS: {
        '+': { symbol: '+', name: '加算' },
        '-': { symbol: '-', name: '減算' },
        '*': { symbol: '×', name: '乗算' },
        '/': { symbol: '÷', name: '除算' }
    }
};

// 問題生成クラス
class ProblemGenerator {
    constructor() {
        this.problemHistory = [];
        this.maxHistorySize = 50;
    }

    // メイン問題生成メソッド
    generateProblem(level) {
        const config = GAME_CONFIG.LEVELS[level];
        if (!config) {
            throw new Error(`無効なレベル: ${level}`);
        }

        let problem;
        let attempts = 0;
        const maxAttempts = 10;

        // 重複を避けるために複数回試行
        do {
            problem = this.createProblemForLevel(level, config);
            attempts++;
        } while (this.isDuplicate(problem) && attempts < maxAttempts);

        // 問題履歴に追加
        this.addToHistory(problem);

        return problem;
    }

    // レベル別問題作成
    createProblemForLevel(level, config) {
        switch (level) {
            case 1:
                return this.generateBasicProblem(config);
            case 2:
                return this.generateMultiplicationDivisionProblem(config);
            case 3:
                return this.generateDecimalFractionProblem(config);
            case 4:
                return this.generateComplexProblem(config);
            default:
                return this.generateBasicProblem(config);
        }
    }

    // 初級：足し算・引き算
    generateBasicProblem(config) {
        const operation = Utils.randomChoice(config.operations);
        const maxNum = config.maxNumber;
        
        let num1, num2, answer;

        if (operation === '+') {
            num1 = Utils.randomInt(1, maxNum);
            num2 = Utils.randomInt(1, maxNum);
            answer = num1 + num2;
        } else if (operation === '-') {
            // 引き算では答えが負数にならないように調整
            num1 = Utils.randomInt(5, maxNum);
            num2 = Utils.randomInt(1, num1);
            answer = num1 - num2;
        }

        const question = `${num1} ${PROBLEM_CONFIG.OPERATIONS[operation].symbol} ${num2} = ?`;
        const choices = this.generateChoices(answer, 'integer');

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation,
            level: 1,
            difficulty: this.calculateDifficulty(num1, num2, operation)
        };
    }

    // 中級：掛け算・割り算
    generateMultiplicationDivisionProblem(config) {
        const operation = Utils.randomChoice(config.operations);
        const maxNum = config.maxNumber;
        
        let num1, num2, answer;

        if (operation === '*') {
            num1 = Utils.randomInt(2, maxNum);
            num2 = Utils.randomInt(2, maxNum);
            answer = num1 * num2;
        } else if (operation === '/') {
            // 割り算では答えが整数になるように調整
            answer = Utils.randomInt(2, maxNum);
            num2 = Utils.randomInt(2, Math.min(maxNum, 12));
            num1 = answer * num2;
        }

        const question = `${num1} ${PROBLEM_CONFIG.OPERATIONS[operation].symbol} ${num2} = ?`;
        const choices = this.generateChoices(answer, 'integer');

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation,
            level: 2,
            difficulty: this.calculateDifficulty(num1, num2, operation)
        };
    }

    // 上級：小数・分数
    generateDecimalFractionProblem(config) {
        const problemType = Utils.randomChoice(['decimal', 'fraction']);
        
        if (problemType === 'decimal') {
            return this.generateDecimalProblem(config);
        } else {
            return this.generateFractionProblem(config);
        }
    }

    // 小数問題
    generateDecimalProblem(config) {
        const operation = Utils.randomChoice(['+', '-', '*', '/']);
        const precision = Utils.randomChoice([1, 2]);
        
        let num1, num2, answer;

        switch (operation) {
            case '+':
                num1 = this.randomDecimal(1, config.maxNumber, precision);
                num2 = this.randomDecimal(1, config.maxNumber, precision);
                answer = this.roundDecimal(num1 + num2, precision);
                break;
            case '-':
                num1 = this.randomDecimal(5, config.maxNumber, precision);
                num2 = this.randomDecimal(1, num1, precision);
                answer = this.roundDecimal(num1 - num2, precision);
                break;
            case '*':
                num1 = this.randomDecimal(1, Math.min(config.maxNumber, 10), precision);
                num2 = this.randomDecimal(1, Math.min(config.maxNumber, 10), precision);
                answer = this.roundDecimal(num1 * num2, precision);
                break;
            case '/':
                answer = this.randomDecimal(1, config.maxNumber, precision);
                num2 = this.randomDecimal(1, 5, precision);
                num1 = this.roundDecimal(answer * num2, precision);
                break;
        }

        const question = `${num1} ${PROBLEM_CONFIG.OPERATIONS[operation].symbol} ${num2} = ?`;
        const choices = this.generateChoices(answer, 'decimal', precision);

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation,
            level: 3,
            type: 'decimal',
            difficulty: this.calculateDifficulty(num1, num2, operation)
        };
    }

    // 分数問題
    generateFractionProblem(config) {
        const operation = Utils.randomChoice(['+', '-']);
        
        // 分母を統一して計算を簡単に
        const denominator = Utils.randomChoice(PROBLEM_CONFIG.FRACTION_DENOMINATORS);
        const num1 = Utils.randomInt(1, denominator - 1);
        const num2 = Utils.randomInt(1, denominator - 1);
        
        let answerNum, answerDen;
        
        if (operation === '+') {
            answerNum = num1 + num2;
            answerDen = denominator;
        } else {
            // 引き算では答えが正数になるように調整
            if (num1 >= num2) {
                answerNum = num1 - num2;
            } else {
                answerNum = num2 - num1;
            }
            answerDen = denominator;
        }

        // 約分
        const gcd = this.getGCD(answerNum, answerDen);
        answerNum /= gcd;
        answerDen /= gcd;

        const answer = answerDen === 1 ? answerNum.toString() : `${answerNum}/${answerDen}`;
        const question = `${num1}/${denominator} ${PROBLEM_CONFIG.OPERATIONS[operation].symbol} ${num2}/${denominator} = ?`;
        const choices = this.generateFractionChoices(answerNum, answerDen);

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation,
            level: 3,
            type: 'fraction',
            difficulty: this.calculateDifficulty(num1, num2, operation)
        };
    }

    // マスター：複合計算
    generateComplexProblem(config) {
        const problemType = Utils.randomChoice(['parentheses', 'order', 'mixed']);
        
        switch (problemType) {
            case 'parentheses':
                return this.generateParenthesesProblem(config);
            case 'order':
                return this.generateOrderOfOperationsProblem(config);
            case 'mixed':
                return this.generateMixedProblem(config);
            default:
                return this.generateParenthesesProblem(config);
        }
    }

    // 括弧付き問題
    generateParenthesesProblem(config) {
        const a = Utils.randomInt(1, 10);
        const b = Utils.randomInt(1, 10);
        const c = Utils.randomInt(1, 10);
        
        const innerOp = Utils.randomChoice(['+', '-']);
        const outerOp = Utils.randomChoice(['*', '/']);
        
        let innerResult, answer;
        
        if (innerOp === '+') {
            innerResult = a + b;
        } else {
            innerResult = Math.max(a, b) - Math.min(a, b);
        }
        
        if (outerOp === '*') {
            answer = innerResult * c;
        } else {
            // 割り切れるように調整
            answer = innerResult;
            const newC = Utils.randomChoice([2, 3, 4, 5]);
            const newInnerResult = answer * newC;
            innerResult = newInnerResult;
            answer = innerResult / newC;
        }

        const question = `(${Math.max(a, b)} ${PROBLEM_CONFIG.OPERATIONS[innerOp].symbol} ${Math.min(a, b)}) ${PROBLEM_CONFIG.OPERATIONS[outerOp].symbol} ${c} = ?`;
        const choices = this.generateChoices(answer, 'integer');

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation: 'complex',
            level: 4,
            type: 'parentheses',
            difficulty: 'high'
        };
    }

    // 演算順序問題
    generateOrderOfOperationsProblem(config) {
        const a = Utils.randomInt(1, 10);
        const b = Utils.randomInt(1, 10);
        const c = Utils.randomInt(1, 10);
        
        const op1 = Utils.randomChoice(['+', '-']);
        const op2 = Utils.randomChoice(['*', '/']);
        
        // a op1 b op2 c の形式
        let answer;
        if (op2 === '*') {
            if (op1 === '+') {
                answer = a + (b * c);
            } else {
                answer = a - (b * c);
            }
        } else {
            // 割り切れるように調整
            const divisibleB = b * Utils.randomChoice([1, 2, 3, 4, 5]);
            if (op1 === '+') {
                answer = a + (divisibleB / c);
            } else {
                answer = a - (divisibleB / c);
            }
        }

        const question = `${a} ${PROBLEM_CONFIG.OPERATIONS[op1].symbol} ${b} ${PROBLEM_CONFIG.OPERATIONS[op2].symbol} ${c} = ?`;
        const choices = this.generateChoices(answer, Number.isInteger(answer) ? 'integer' : 'decimal');

        return {
            question,
            correctAnswer: answer,
            choices: Utils.shuffle(choices),
            operation: 'complex',
            level: 4,
            type: 'order',
            difficulty: 'high'
        };
    }

    // 混合問題
    generateMixedProblem(config) {
        // レベル1-3からランダムに選択
        const subLevel = Utils.randomInt(1, 3);
        const subConfig = GAME_CONFIG.LEVELS[subLevel];
        
        return this.createProblemForLevel(subLevel, subConfig);
    }

    // 選択肢生成
    generateChoices(correctAnswer, type = 'integer', precision = 2) {
        const choices = [correctAnswer];
        const range = Math.max(Math.abs(correctAnswer) * 0.5, 10);
        
        while (choices.length < PROBLEM_CONFIG.CHOICE_COUNT) {
            let wrongAnswer;
            
            if (type === 'decimal') {
                wrongAnswer = this.roundDecimal(
                    correctAnswer + (Math.random() - 0.5) * range,
                    precision
                );
            } else {
                wrongAnswer = correctAnswer + Utils.randomInt(-range, range);
                if (wrongAnswer <= 0) wrongAnswer = Utils.randomInt(1, 10);
            }
            
            // 重複チェック
            if (!choices.includes(wrongAnswer) && wrongAnswer > 0) {
                choices.push(wrongAnswer);
            }
        }
        
        return choices;
    }

    // 分数選択肢生成
    generateFractionChoices(correctNum, correctDen) {
        const correctAnswer = correctDen === 1 ? correctNum.toString() : `${correctNum}/${correctDen}`;
        const choices = [correctAnswer];
        
        while (choices.length < PROBLEM_CONFIG.CHOICE_COUNT) {
            let wrongAnswer;
            
            if (Math.random() < 0.5) {
                // 分子を変更
                const wrongNum = correctNum + Utils.randomInt(-3, 3);
                if (wrongNum > 0) {
                    wrongAnswer = correctDen === 1 ? wrongNum.toString() : `${wrongNum}/${correctDen}`;
                }
            } else {
                // 分母を変更（分子は維持）
                const wrongDen = correctDen + Utils.randomInt(-2, 2);
                if (wrongDen > 1) {
                    wrongAnswer = `${correctNum}/${wrongDen}`;
                }
            }
            
            if (wrongAnswer && !choices.includes(wrongAnswer)) {
                choices.push(wrongAnswer);
            }
        }
        
        // 不足分を数値で補完
        while (choices.length < PROBLEM_CONFIG.CHOICE_COUNT) {
            const randomNum = Utils.randomInt(1, 10);
            if (!choices.includes(randomNum.toString())) {
                choices.push(randomNum.toString());
            }
        }
        
        return choices;
    }

    // ユーティリティメソッド
    randomDecimal(min, max, precision) {
        const factor = Math.pow(10, precision);
        return Math.round((Math.random() * (max - min) + min) * factor) / factor;
    }

    roundDecimal(num, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(num * factor) / factor;
    }

    getGCD(a, b) {
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    calculateDifficulty(num1, num2, operation) {
        const sum = Math.abs(num1) + Math.abs(num2);
        const product = Math.abs(num1) * Math.abs(num2);
        
        if (operation === '+' || operation === '-') {
            if (sum < 20) return 'easy';
            if (sum < 50) return 'medium';
            return 'hard';
        } else if (operation === '*') {
            if (product < 50) return 'easy';
            if (product < 200) return 'medium';
            return 'hard';
        } else if (operation === '/') {
            if (num1 < 50) return 'easy';
            if (num1 < 200) return 'medium';
            return 'hard';
        }
        
        return 'medium';
    }

    // 重複チェック
    isDuplicate(problem) {
        return this.problemHistory.some(p => 
            p.question === problem.question || 
            (p.operation === problem.operation && 
             Math.abs(p.correctAnswer - problem.correctAnswer) < 0.001)
        );
    }

    // 履歴管理
    addToHistory(problem) {
        this.problemHistory.push({
            question: problem.question,
            correctAnswer: problem.correctAnswer,
            operation: problem.operation,
            timestamp: Date.now()
        });
        
        // 履歴サイズ制限
        if (this.problemHistory.length > this.maxHistorySize) {
            this.problemHistory.shift();
        }
    }

    // 統計取得
    getStatistics() {
        const operations = {};
        const difficulties = {};
        
        this.problemHistory.forEach(problem => {
            operations[problem.operation] = (operations[problem.operation] || 0) + 1;
            difficulties[problem.difficulty] = (difficulties[problem.difficulty] || 0) + 1;
        });
        
        return {
            totalProblems: this.problemHistory.length,
            operations,
            difficulties,
            averageAnswerValue: this.problemHistory.reduce((sum, p) => sum + Math.abs(p.correctAnswer), 0) / this.problemHistory.length || 0
        };
    }

    // 問題履歴クリア
    clearHistory() {
        this.problemHistory = [];
    }

    // 特定レベルの問題をバッチ生成（テスト用）
    generateBatch(level, count = 10) {
        const problems = [];
        for (let i = 0; i < count; i++) {
            try {
                problems.push(this.generateProblem(level));
            } catch (error) {
                console.warn(`問題生成エラー (${i + 1}/${count}):`, error);
            }
        }
        return problems;
    }

    // 問題の妥当性チェック
    validateProblem(problem) {
        const checks = {
            hasQuestion: !!problem.question,
            hasAnswer: problem.correctAnswer !== undefined,
            hasChoices: Array.isArray(problem.choices) && problem.choices.length === PROBLEM_CONFIG.CHOICE_COUNT,
            answerInChoices: problem.choices.includes(problem.correctAnswer),
            uniqueChoices: new Set(problem.choices).size === problem.choices.length
        };
        
        const isValid = Object.values(checks).every(check => check);
        
        return {
            isValid,
            checks,
            errors: Object.entries(checks)
                .filter(([key, value]) => !value)
                .map(([key]) => key)
        };
    }
}

// ヒントシステム
class HintSystem {
    constructor() {
        this.hintTypes = ['operation', 'range', 'step'];
    }

    generateHint(problem, type = null) {
        const hintType = type || Utils.randomChoice(this.hintTypes);
        
        switch (hintType) {
            case 'operation':
                return this.getOperationHint(problem);
            case 'range':
                return this.getRangeHint(problem);
            case 'step':
                return this.getStepHint(problem);
            default:
                return this.getOperationHint(problem);
        }
    }

    getOperationHint(problem) {
        const operationNames = {
            '+': '足し算',
            '-': '引き算',
            '*': '掛け算',
            '/': '割り算'
        };
        
        return `これは${operationNames[problem.operation] || '複合計算'}の問題です。`;
    }

    getRangeHint(problem) {
        const answer = problem.correctAnswer;
        const range = Math.max(Math.abs(answer) * 0.2, 5);
        const min = Math.floor(answer - range);
        const max = Math.ceil(answer + range);
        
        return `答えは${min}から${max}の間にあります。`;
    }

    getStepHint(problem) {
        if (problem.type === 'parentheses') {
            return '括弧の中から先に計算しましょう。';
        } else if (problem.type === 'order') {
            return '掛け算・割り算を先に計算しましょう。';
        } else if (problem.operation === '/') {
            return '割り算は掛け算の逆の操作です。';
        } else if (problem.operation === '-') {
            return '引き算は足し算の逆の操作です。';
        }
        
        return '落ち着いて一歩ずつ計算しましょう。';
    }
}

// グローバルインスタンス
let problemGenerator;
let hintSystem;

document.addEventListener('DOMContentLoaded', () => {
    problemGenerator = new ProblemGenerator();
    hintSystem = new HintSystem();
    
    // グローバル参照（デバッグ用）
    window.problemGenerator = problemGenerator;
    window.hintSystem = hintSystem;
    
    console.log('問題生成システムが初期化されました');
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProblemGenerator, HintSystem, PROBLEM_CONFIG };
} 