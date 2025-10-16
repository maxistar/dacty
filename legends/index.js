// keyboard stickers generator for waterslide paper
// npm i canvas
import fs from "fs";
import { createCanvas, registerFont } from "canvas";

/** ========== CONFIG ========== */
const CONFIG = {
    page: { widthMM: 297, heightMM: 210, dpi: 600 }, // A4
    marginMM: { top: 8, right: 8, bottom: 8, left: 8 },
    cellMM: { w: 14, h: 14 },         // базовый unit (1u)
    gapMM: { x: 2, y: 2 },            // зазоры (между клавишами/рядками)
    gridStrokeMM: 0.15,
    fonts: {
        family: "Arial",
        singleLegendSizeMM: 4.6,
        twoLegendSizeMM: 3.8,
        threeLegendSizeMM: 3.2,
    },
    colors: {
        grid: "#666",
        text: "#000",
        cropMarks: "#444",
        debugCellOutline: null, // например "#bbb"
    },
};

/** Позиции текста в долях от размеров наклейки (0..1) */
const POS = {
    center: [0.5, 0.5],
    topLeft: [0.22, 0.22],
    topRight: [0.78, 0.22],
    bottomLeft: [0.22, 0.78],
    bottomRight: [0.78, 0.78],
    bottomCenter: [0.5, 0.8],
    leftCenter: [0.22, 0.5],
    rightCenter: [0.78, 0.5],
};

/**
 * ========== LAYOUT ==========
 * Теперь каждая клавиша может иметь поле u (ширина в юнитах).
 * Пример: { u: 1.5, legends:["Tab"], positions:["leftCenter"] }
 * По умолчанию u = 1.
 */
const LAYOUT = [
    // Ряд 1 — добавим несколько 1.5u: Esc, Backspace
    [
        { u: 1.5, legends: ["`","ё"], positions: ["center","bottomLeft"] },
        { legends: ["1", "!", "🐧"], positions: ["bottomLeft", "topLeft", "bottomRight"] },
        { legends: ["2", "@", "🍎"], positions: ["bottomLeft", "topLeft", "bottomRight"] },
        { legends: ["3", "#", "bt3"], positions: ["bottomLeft", "topLeft", "bottomRight"] },
        { legends: ["4", "€", "bt4"], positions: ["bottomLeft", "topLeft", "bottomRight"] },
        { legends: ["5", "%", "bt5"], positions: ["bottomLeft", "topLeft", "bottomRight"] },
        { legends: ["6", "^"], positions: ["bottomLeft", "topLeft"] },
        { legends: ["7", "&"], positions: ["bottomLeft", "topLeft"] },
        { legends: ["8", "*"], positions: ["bottomLeft", "topLeft"] },
        { legends: ["9", "("], positions: ["bottomLeft", "topLeft"] },
        { legends: ["0", ")"], positions: ["bottomLeft", "topLeft"] },
        { u: 1.5, legends: ["ESC"], positions: ["center"] },
    ],
    // Ряд 2 — Tab 1.5u, Enter 1.5u
    [
        { u: 1.5, legends: ["-"], positions: ["center"] },
        { legends: ["Q","й"], positions: ["center","bottomLeft"] },
        { legends: ["W","1","ц"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["E","2","у"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["R","3","к"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["T","е"], positions: ["center","bottomLeft"] },
        { legends: ["Y","н"], positions: ["center","bottomLeft"] },
        { legends: ["U","г"], positions: ["center","bottomLeft"] },
        { legends: ["I","ш"], positions: ["center","bottomLeft"] },
        { legends: ["O","щ"], positions: ["center","bottomLeft"] },
        { legends: ["P","з"], positions: ["center","bottomLeft"] },
        { u: 1.5, legends: ["⇥"], positions: ["center"] },
    ],
    // Ряд 3 — Caps 1.5u, два 1.5u посередине
    [
        { u: 1.5, legends: ["'","э"], positions: ["center","bottomLeft"] },
        { legends: ["A","ф"], positions: ["center","bottomLeft"] },
        { legends: ["S","4","ы"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["D","5","в"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["F","6","а"], positions: ["center","bottomRight","bottomLeft"] }, // примеры 1.5u
        { legends: ["G","п"], positions: ["center","bottomLeft"] },
        { legends: ["H","←","р"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["J","↓","о"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["K","↑","л"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["L","→","д"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["P","з"], positions: ["center","bottomLeft"] },
        { u: 1.5,legends: ["🌐"], positions: ["center"] },
    ],
    // Ряд 4 — Shift 1.5u слева и справа
    [
        { u: 1.5, legends: ["Shift"], positions: ["center"] },
        { legends: ["Z","я"], positions: ["center","bottomLeft"] },
        { legends: ["X","7","ч"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["C","8","с"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["V","9","м"], positions: ["center","bottomRight","bottomLeft"] },
        { legends: ["B","и"], positions: ["center","bottomLeft"] },
        { legends: ["N","т"], positions: ["center","bottomLeft"] },
        { legends: ["M","ь"], positions: ["center","bottomLeft"] },
        { legends: [",","б"], positions: ["center","bottomLeft"] },
        { legends: [".","ю"], positions: ["center","bottomLeft"] },
        { legends: ["P","з"], positions: ["center","bottomLeft"] },
        { u: 1.5, legends: ["Shift"], positions: ["center"] },
    ],
    // Ряд 5 — Alt, Win, Space 1.5u, AltGr 1.5u, Menu 1.5u — добьём до ~10 штук 1.5u
    [
        { u: 1, legends: ["Fn", "F1", "↯"], positions: ["topLeft", "topRight", "bottomCenter"] },
        { u: 1, legends: ["Alt","⌥"], positions: ["center","topRight"] },
        { u: 1, legends: ["Win"], positions: ["center"] },
        { u: 1, legends: [" "], positions: ["center"] },
        { u: 1, legends: ["[","х"], positions: ["center","bottomLeft"] },
        { u: 1, legends: ["]","ъ"], positions: ["center","bottomLeft"] },
        { u: 1, legends: ["Lower"], positions: ["center"] },
        { u: 1, legends: ["Raise"], positions: ["center"] },
        { u: 1, legends: ["⇦"], positions: ["center"] },
        { u: 1, legends: ["Ctrl","⌘"], positions: ["center","topRight"] },
        { u: 1, legends: [" "], positions: ["center"] },
        { u: 1, legends: ["'"], positions: ["center"] },
        { u: 1, legends: ["AltGr"], positions: ["center"] },
    ],
];

/** ============================== */
const mmToPx = (mm, dpi) => Math.round((mm / 25.4) * dpi);

function setFontPx(ctx, px, family, weight = "") {
    ctx.font = `${weight ? weight + " " : ""}${px}px "${family}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
}

function chooseFontSizePx(legendCount, cfg) {
    const { dpi } = cfg.page;
    const mm = legendCount === 1
        ? cfg.fonts.singleLegendSizeMM
        : legendCount === 2
            ? cfg.fonts.twoLegendSizeMM
            : cfg.fonts.threeLegendSizeMM;
    return mmToPx(mm, dpi);
}

function drawCropMarks(ctx, W, H, color) {
    const len = Math.min(W, H) * 0.02;
    const pad = Math.min(W, H) * 0.005;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // углы
    ctx.beginPath(); ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - pad - len, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + len); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, H - pad - len); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + len, H - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - pad - len, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - len); ctx.stroke();
}

/** Считает ширину ряда в пикселях с учётом u и межклавишных зазоров */
function measureRowWidthPx(row, cellW, gapX) {
    if (!row || row.length === 0) return 0;
    let width = 0;
    row.forEach((key, idx) => {
        const u = Number(key.u || 1);
        const keyW = u * cellW + (u - 1) * gapX;
        width += keyW;
        if (idx < row.length - 1) width += gapX; // межклавишный зазор
    });
    return width;
}

/** Основной рендер */
function renderStickers(layout, cfg) {
    const { widthMM, heightMM, dpi } = cfg.page;
    const pageW = mmToPx(widthMM, dpi);
    const pageH = mmToPx(heightMM, dpi);

    const margin = {
        top: mmToPx(cfg.marginMM.top, dpi),
        right: mmToPx(cfg.marginMM.right, dpi),
        bottom: mmToPx(cfg.marginMM.bottom, dpi),
        left: mmToPx(cfg.marginMM.left, dpi),
    };

    const cellW = mmToPx(cfg.cellMM.w, dpi);
    const cellH = mmToPx(cfg.cellMM.h, dpi);
    const gapX = mmToPx(cfg.gapMM.x, dpi);
    const gapY = mmToPx(cfg.gapMM.y, dpi);

    // вычислим максимальную ширину ряда (с учётом u)
    const rows = layout.length;
    const rowWidths = layout.map((row) => measureRowWidthPx(row, cellW, gapX));
    const gridW = Math.max(...rowWidths, 0);
    const gridH = rows * cellH + (rows - 1) * gapY;

    const maxW = pageW - margin.left - margin.right;
    const maxH = pageH - margin.top - margin.bottom;
    if (gridW > maxW || gridH > maxH) {
        console.warn(
            `⚠️ Сетка (${gridW}x${gridH}px) не помещается в область печати (${maxW}x${maxH}px). ` +
            `Уменьшите размеры (cellMM/gapMM) или поля/количество клавиш.`
        );
    }

    const canvas = createCanvas(pageW, pageH, "png");
    const ctx = canvas.getContext("2d");

    // фон
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pageW, pageH);

    const startX = margin.left;
    const startY = margin.top;

    // рисуем контуры каждой наклейки (теперь вместо общей сетки)
    ctx.strokeStyle = cfg.colors.grid;
    ctx.lineWidth = Math.max(1, mmToPx(cfg.gridStrokeMM, dpi));

    for (let r = 0; r < rows; r++) {
        const row = layout[r] || [];
        let xCursor = startX;
        const y = startY + r * (cellH + gapY);

        for (let c = 0; c < row.length; c++) {
            const key = row[c];
            const u = Number(key.u || 1);
            const keyW = u * cellW + (u - 1) * gapX;

            // рамка наклейки (контур для реза)
            ctx.strokeRect(xCursor, y, keyW, cellH);

            if (CONFIG.colors.debugCellOutline) {
                ctx.save();
                ctx.strokeStyle = CONFIG.colors.debugCellOutline;
                ctx.strokeRect(xCursor, y, keyW, cellH);
                ctx.restore();
            }

            // подписи
            const legends = key.legends || [];
            const positions = key.positions || ["center"];
            const fontPx = chooseFontSizePx(legends.length, cfg);

            ctx.fillStyle = cfg.colors.text;
            setFontPx(ctx, fontPx, cfg.fonts.family);

            for (let i = 0; i < legends.length; i++) {
                const text = String(legends[i]);
                const posName = positions[i] || "center";
                const [rx, ry] = POS[posName] || POS.center;

                const tx = xCursor + rx * keyW;
                const ty = y + ry * cellH;

                const maxTextWidth = keyW * 0.85;
                const m = ctx.measureText(text);
                let scale = 1;
                if (m.width > maxTextWidth) scale = maxTextWidth / m.width;

                ctx.save();
                ctx.translate(tx, ty);
                ctx.scale(scale, scale);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }

            // сместимся к следующей клавише
            xCursor += keyW;
            if (c < row.length - 1) xCursor += gapX; // межклавишный зазор
        }
    }

    // метки обреза по углам листа
    drawCropMarks(ctx, pageW, pageH, CONFIG.colors.cropMarks);

    return canvas;
}

/** ============================== MAIN ============================== */
(function main() {
    // при необходимости: registerFont('/abs/path/MyFont.ttf', { family: 'MyFont' });
    const canvas = renderStickers(LAYOUT, CONFIG);

    const out = fs.createWriteStream("stickers_a4.png");
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
        console.log("✅ Готово: stickers_a4.png");
    });
})();
