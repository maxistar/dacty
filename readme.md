# Dacty - split keyboard with unified layouts

## Clone

```bash
git clone https://github.com/maxistar/dacty.git
cd dacty
```

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)

## Setup

```bash
cd dacty
npm install
```

## Generate stickers

```bash
node legends/index.js
```

Outputs `legends/stickers_a4.png` — a 600 DPI A4 sticker sheet ready for a print shop (CMYK TIFF).

## Unified Layouts

Before:

![](docs/default/default.png)

After:

![](docs/optimized/optimized.png)
