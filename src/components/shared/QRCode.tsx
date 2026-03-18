import { useMemo } from "react";
import { createLogger } from "@/utils/log";
import { generateQrSvg, type QrOptions } from "@/utils/qr";

const log = createLogger("qrcode");

type QRCodeProps = QrOptions & {
  value: string;
};

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size,
  margin,
  dotShape,
  fgColor,
  bgColor,
  eyeColor,
  pupilColor,
  eyeRadius,
}) => {
  log.trace("render");
  const src = useMemo(() => {
    try {
      log.trace("generating QR code", {
        size,
        margin,
        dotShape,
        fgColor,
        bgColor,
        eyeColor,
        pupilColor,
        eyeRadius,
      });
      const svg = generateQrSvg(value, {
        size,
        margin,
        dotShape,
        fgColor,
        bgColor,
        eyeColor,
        pupilColor,
        eyeRadius,
      });
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } catch (error: unknown) {
      log.error("failed to generate QR code", { error });
      return null;
    }
  }, [
    value,
    size,
    margin,
    dotShape,
    fgColor,
    bgColor,
    eyeColor,
    pupilColor,
    eyeRadius,
  ]);

  if (!src) return null;

  return <img src={src} alt={value} />;
};
