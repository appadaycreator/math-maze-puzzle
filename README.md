# 計算チャレンジ

暗算力を鍛えるシンプルなブラウザゲームです。制限時間内にできるだけ多くの計算問題を解いて、高スコアを目指しましょう！

## デモ
https://appadaycreator.github.io/math-maze-puzzle/

## 特徴
- **シンプルな操作** - 4つの選択肢から正解を選ぶだけ
- **4つの難易度** - 初級、中級、上級、マスターから選択可能
- **連続正解ボーナス** - 連続で正解するとボーナス得点！
- **レスポンシブデザイン** - PC、タブレット、スマートフォンに対応
- **PWA対応** - オフラインでもプレイ可能

## 遊び方
1. 難易度を選択して「ゲームスタート」をクリック
2. 表示される計算問題の答えを4つの選択肢から選ぶ
3. 制限時間（2分間）内にできるだけ多くの問題を解く
4. ゲーム終了後、スコアと正答率が表示されます

## 難易度
- **初級**: 足し算・引き算（20以下の数）
- **中級**: 掛け算・割り算（12以下の数）
- **上級**: 四則演算・小数・分数
- **マスター**: 複合計算・括弧を含む式

## 技術スタック
- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+)
- PWA (Progressive Web App)

## ローカル開発
```bash
# リポジトリをクローン
git clone https://github.com/appadaycreator/math-maze-puzzle.git
cd math-maze-puzzle

# ローカルサーバーを起動
python3 -m http.server 8081
# または
npx http-server -p 8081

# ブラウザで開く
open http://localhost:8081
```

## ライセンス
MITライセンス

## 作者
[@appadaycreator](https://github.com/appadaycreator)