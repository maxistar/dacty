// keyboard stickers generator for waterslide paper
// https://chatgpt.com/g/g-p-679b3a422b848191b349812edf555098-electronics/c/68ee9a43-9e38-8329-987f-b4d3cfc47f8e
// npm i canvas
import fs from "fs";
import { createCanvas, registerFont, loadImage } from "canvas";
import sharp from "sharp";

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

    textColorsByPos: {           // NEW: глобальные цвета по позициям
        bottomLeft:  "#00AEEF",    // голубой
        bottomRight: "#2ECC71",    // зелёный
        // при желании можно задать и для других:
        // topLeft: "#...", topRight: "#...", center: "#..."
    },
    
    // Настройки иконок по умолчанию
    icons: {
        defaultWidthMM: 6,      // если не задан размер — ширина 6мм, высота по пропорции
        opacity: 1.0,
        rotationDeg: 0,
    },

    output: {
        cmykNoK: true,                       // генерировать CMYK TIFF без K
        iccPath: null,                       // опционально: путь к ICC (например ISOcoated_v2_300_eci.icc)
        tiffName: "stickers_a4_cmyk_noK.tiff",
        tiffCompression: "lzw",              // "lzw" | "none" | "deflate" | "jpeg"
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
        { u: 1.5, legends: ["`","ё","F12"], positions: ["center","bottomLeft","topRight"] },
        { legends: ["1", "!","F1"], positions: ["bottomLeft", "topLeft","topRight"], icon: { src: "images/linux-logo-penguin.png", pos: "bottomRight", widthMM: 4 }  },
        { legends: ["Z","я","@","F2"], positions: ["center","bottomLeft","topLeft","topRight"], icon: { src: "images/apple_rainbow.png", pos: "bottomRight", widthMM: 4 }  },
        { legends: ["A","ф","#","F3"], positions: ["center","bottomLeft","topLeft","topRight"], icon: { src: "images/android-logo.png", pos: "bottomRight", widthMM: 4 } },
        { legends: ["Q","й", "ᛒ4","$","F4"], positions: ["center","bottomLeft", "bottomRight","topLeft","topRight"] },
        { legends: ["5", "%", "ᛒ5","F5"], positions: ["bottomLeft", "topLeft", "bottomRight","topRight"] },
        { legends: ["6", "^","F6"], positions: ["bottomLeft", "topLeft","topRight"] },
        { legends: ["7", "&","F7"], positions: ["bottomLeft", "topLeft","topRight"] },
        { legends: ["8", "*","F8"], positions: ["bottomLeft", "topLeft","topRight"] },
        { legends: ["9", "(","F9"], positions: ["bottomLeft", "topLeft","topRight"] },
        { legends: ["0", ")","F10"], positions: ["bottomLeft", "topLeft","topRight"] },
        { u: 1.5, legends: ["esc","F11"], positions: ["bottomLeft","topRight"], textColors: {bottomLeft:"#000000"} },
    ],
    // Ряд 2 — Tab 1.5u, Enter 1.5u
    [
        { u: 1.5, legends: ["-","_"], positions: ["center","topLeft"] },
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
        { u: 1.5, legends: ["'","э","\""], positions: ["center","bottomLeft","topLeft"] },
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
        { u: 1.5,legends: ["ru","en"], positions: ["bottomLeft", "bottomRight"],  textColors: {bottomLeft:  "#00AEEF", bottomRight: "#000000"}, icon: { src: "images/globe.png", pos: "center", widthMM: 5 } },
    ],
    // Ряд 4 — Shift 1.5u слева и справа
    [
        { u: 1.5, legends: ["⇧"], positions: ["center"] },
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
        { u: 1.5, legends: ["⇧"], positions: ["center"] },
    ],
    // Ряд 5 — Alt, Win, Space 1.5u, AltGr 1.5u, Menu 1.5u — добьём до ~10 штук 1.5u
    [
        { u: 1, legends: ["Ctrl","⌘"], positions: ["center","topRight"] },
        { u: 1, legends: ["Alt","⌥"], positions: ["center","topRight"] },
        { u: 1, legends: [], positions: [], icon: { src: "images/windows.png", pos: "center", widthMM: 5 }  },
        { u: 1, legends: [" "], positions: ["center"] },
        { u: 1, legends: ["[","х"], positions: ["center","bottomLeft"] },
        { u: 1, legends: ["]","ъ"], positions: ["center","bottomLeft"] },
        { u: 1, legends: ["Lower"], positions: ["center"], textColors: {} },
        { u: 1, legends: ["Raise"], positions: ["center"], textColors: {center:  "#2ECC71"} },
        { u: 1, legends: ["⇦"], positions: ["center"] },
        { u: 1, legends: ["Ctrl","⌘"], positions: ["center","topRight"] },
        { u: 1, legends: [" "], positions: ["center"] },
        { u: 1, legends: ["'"], positions: ["center"] },
        { u: 1, legends: ["AltGr","⌥"], positions: ["center","topLeft"] },
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

/** ===== ИКОНОЧКИ! ===== */
const iconCache = new Map(); // src -> Image

async function getIcon(src) {
    if (!src) return null;
    if (iconCache.has(src)) return iconCache.get(src);
    const img = await loadImage(src);
    iconCache.set(src, img);
    return img;
}

/** Рисует одну иконку с настройками */
async function drawIcon(ctx, keyRect, iconCfg, cfg) {
    const { x, y, w, h } = keyRect;      // пиксели
    const { page, icons: defIcon } = cfg;
    const dpi = page.dpi;

    const img = await getIcon(iconCfg.src);
    if (!img) return;

    // позиция
    const [rx, ry] = POS[iconCfg.pos || "center"] || POS.center;
    const cx = x + rx * w;
    const cy = y + ry * h;

    // размер:
    // 1) приоритет явным мм (widthMM / heightMM)
    // 2) потом относительный от ширины/высоты (widthRel / heightRel)
    // 3) иначе — дефолтная ширина из мм, высота по пропорции
    let drawW, drawH;

    if (iconCfg.widthMM || iconCfg.heightMM) {
        if (iconCfg.widthMM) {
            drawW = mmToPx(iconCfg.widthMM, dpi);
            drawH = (img.height / img.width) * drawW;
        }
        if (iconCfg.heightMM) {
            drawH = mmToPx(iconCfg.heightMM, dpi);
            drawW = (img.width / img.height) * drawH;
        }
    } else if (iconCfg.widthRel || iconCfg.heightRel) {
        if (iconCfg.widthRel) {
            drawW = w * iconCfg.widthRel; // доля ширины клавиши
            drawH = (img.height / img.width) * drawW;
        }
        if (iconCfg.heightRel) {
            drawH = h * iconCfg.heightRel; // доля высоты клавиши
            drawW = (img.width / img.height) * drawH;
        }
    } else {
        drawW = mmToPx(defIcon.defaultWidthMM, dpi);
        drawH = (img.height / img.width) * drawW;
    }

    const alpha = iconCfg.opacity ?? defIcon.opacity ?? 1.0;
    const rot = ((iconCfg.rotationDeg ?? defIcon.rotationDeg ?? 0) * Math.PI) / 180;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);

    // якорим по центру
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
}


/** Основной рендер */
async function renderStickers(layout, cfg) {
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
            setFontPx(ctx, fontPx, cfg.fonts.family);

            for (let i = 0; i < legends.length; i++) {
                const text = String(legends[i]);
                const posName = positions[i] || "center";
                const [rx, ry] = POS[posName] || POS.center;

                const perKeyMap = key.textColors || {}; // { bottomLeft: "#..", ... } или массив индексов
                const colorFromKey =
                    perKeyMap[posName] ??
                    perKeyMap[i]; // допускаем и обращение по индексу
                const color =
                    colorFromKey ??
                    (CONFIG.textColorsByPos ? CONFIG.textColorsByPos[posName] : null) ??
                    CONFIG.colors.text;

                ctx.fillStyle = color;     // ← теперь цвет на каждую подпись


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

            // иконка/иконки
            const rect = { x: xCursor, y, w: keyW, h: cellH };
            if (key.icon) {
                await drawIcon(ctx, rect, key.icon, CONFIG);
            }
            if (Array.isArray(key.icons)) {
                for (const ic of key.icons) {
                    await drawIcon(ctx, rect, ic, CONFIG);
                }
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
(async function main() {
    // при необходимости: registerFont('/abs/path/MyFont.ttf', { family: 'MyFont' });
    const canvas = await renderStickers(LAYOUT, CONFIG);

    const out = fs.createWriteStream("stickers_a4.png");
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
        console.log("✅ Готово: stickers_a4.png");
    });
    
})();
