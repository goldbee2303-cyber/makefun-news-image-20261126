[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/goldbee2303-cyber/makefun-news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/goldbee2303-cyber/makefun-news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

# 26 November 2026 — The World in One Day

Entry for the make.fun bounty [Sum up 26 November's world news in one image](https://make.fun/bounty/news-image-20261126).

A dense newspaper-style image summing up the world's news of Thursday 26 November 2026 — 30 stories on one page: 3 leads, 10 cards and 17 briefs, each with its own source, plus a 6-stat strip under the masthead, region-coloured brief numbers, a dark-navy map, and a DATE CHECK strip so every story is verifiably from 26 November.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, no dependencies) validates `entry.png` — PNG signature, 1024×1024 IHDR, bit depth 8, colour type 2–6, at most 1 MiB, IEND present — and copies it unchanged to `MAKEFUN_OUTPUT_DIR/entry.png`.

## Files

- `entry.png` — the finished one-page newspaper image (1024×1024).
- `main.ts` — validator + copier, as above.
- `LICENSE` — MIT.
