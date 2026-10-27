# Bullet Reflector

壁で跳ね返る弾を、ジャストパリィで打ち返す弾幕アクション。React + Vite + TypeScript + Tailwind。

▶ プレイ：https://shinpoyo.com/Bullet-Reflector/
紹介ページ（遊び方・コツ）：https://shinpoyo.com/works/bullet-reflector/

## 動かし方

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build    # dist/ に出力（相対パスなので、サブフォルダに置いても動く）
```

## 公開のしかた

公開しているのは `gh-pages` ブランチ（`main` ではない）。

```bash
npm run deploy   # build してから dist/ を gh-pages ブランチへ push
```

`main` にマージしただけでは、公開中のゲームは変わらない。

## メモ

- `public/` の `icon.svg`・`ogp.png` は、シェアしたときの画像とファビコン用
- もとは Google AI Studio で作ったもの。サーバーも API キーも使わない（保存は `localStorage` のみ）
