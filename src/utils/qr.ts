import QRCode from "qrcode";
import { createLogger } from "@/utils/log";

const log = createLogger("qrcode");

export type QrOptions = {
  size?: number;
  margin?: number;
  dotShape?: "classic" | "dots" | "square";
  fgColor?: string;
  bgColor?: string;
  eyeColor?: string;
  pupilColor?: string;
  eyeRadius?: number;
};

type ResolvedOptions = Required<QrOptions>;

const resolveOptions = (options: QrOptions): ResolvedOptions => {
  log.trace("resolveOptions", { options });
  const fgColor = options.fgColor ?? "#000000";
  return {
    size: options.size ?? 280,
    margin: options.margin ?? 4,
    dotShape: options.dotShape ?? "dots",
    fgColor,
    bgColor: options.bgColor ?? "#ffffff",
    eyeColor: options.eyeColor ?? fgColor,
    pupilColor: options.pupilColor ?? fgColor,
    eyeRadius: options.eyeRadius ?? 0.2,
  };
};

const isInEye = (row: number, col: number, matrixSize: number): boolean => {
  if (row < 7 && col < 7) {
    return true;
  }
  if (row < 7 && col >= matrixSize - 7) {
    return true;
  }
  if (row >= matrixSize - 7 && col < 7) {
    return true;
  }
  return false;
};

const renderEye = (
  x: number,
  y: number,
  m: number,
  eyeColor: string,
  pupilColor: string,
  bgColor: string,
  radius: number,
) => {
  const outer = 7 * m;
  const inner = 3 * m;
  const mid = 5 * m;
  const midOff = m;
  const innerOff = 2 * m;
  const rOuter = outer * radius;
  const rMid = mid * radius;
  const rInner = inner * radius;
  return [
    `<rect x="${x}" y="${y}" width="${outer}" height="${outer}" rx="${rOuter}" fill="${eyeColor}"/>`,
    `<rect x="${x + midOff}" y="${y + midOff}" width="${mid}" height="${mid}" rx="${rMid}" fill="${bgColor}"/>`,
    `<rect x="${x + innerOff}" y="${y + innerOff}" width="${inner}" height="${inner}" rx="${rInner}" fill="${pupilColor}"/>`,
  ].join("");
};

const dotRenderers = {
  classic: (x: number, y: number, m: number) => `M${x},${y}h${m}v${m}h${-m}z`,
  dots: (x: number, y: number, m: number) => {
    const cx = x + m / 2;
    const cy = y + m / 2;
    const r = m * 0.35;
    return (
      `M${cx - r},${cy}` +
      `a${r},${r} 0 1,0 ${r * 2},0` +
      `a${r},${r} 0 1,0 ${-r * 2},0z`
    );
  },
  square: (x: number, y: number, m: number) => {
    const w = m * 0.7;
    const off = (m - w) / 2;
    return `M${x + off},${y + off}h${w}v${w}h${-w}z`;
  },
};

export const generateQrSvg = (
  data: string,
  options: QrOptions = {},
): string => {
  const {
    size,
    margin,
    dotShape,
    fgColor,
    bgColor,
    eyeColor,
    pupilColor,
    eyeRadius,
  } = resolveOptions(options);

  const qr = QRCode.create(data, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const matrixSize = modules.size;
  const m = size / matrixSize;
  const total = size + margin * 2;

  const paths: string[] = [];
  const render = dotRenderers[dotShape];

  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (!modules.get(row, col)) {
        continue;
      }
      if (isInEye(row, col, matrixSize)) {
        continue;
      }
      paths.push(render(col * m + margin, row * m + margin, m));
    }
  }

  const eyes = [
    { x: 0, y: 0 },
    { x: matrixSize - 7, y: 0 },
    { x: 0, y: matrixSize - 7 },
  ]
    .map((pos) =>
      renderEye(
        pos.x * m + margin,
        pos.y * m + margin,
        m,
        eyeColor,
        pupilColor,
        bgColor,
        eyeRadius,
      ),
    )
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">`,
    `<rect width="${total}" height="${total}" fill="${bgColor}"/>`,
    eyes,
    `<path fill="${fgColor}" d="${paths.join("")}"/>`,
    `</svg>`,
  ].join("");
};
