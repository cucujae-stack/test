// 압축 모드 타입 정의
export type CompressMode = "basic" | "shopee" | "sns";

export interface CompressOptions {
  mode: CompressMode;
  targetKB: number; // 목표 용량 (KB)
}

export interface CompressResult {
  blob: Blob;
  format: "image/jpeg" | "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
  success: boolean;
  errorMessage?: string;
}

// Canvas에 이미지를 그리는 헬퍼 (contain 방식)
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  bgColor: string
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const scale = Math.min(canvasW / img.width, canvasH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const offsetX = (canvasW - drawW) / 2;
  const offsetY = (canvasH - drawH) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

// HTMLImageElement 생성 헬퍼
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Canvas를 Blob으로 변환
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob 실패"));
      },
      format,
      quality
    );
  });
}

// 두 포맷 중 더 작은 Blob 선택
async function getBestBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  hasTransparency: boolean
): Promise<{ blob: Blob; format: "image/jpeg" | "image/webp" }> {
  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);

  // 투명도가 있는 이미지는 WEBP 우선 시도
  const webpBlob = await canvasToBlob(canvas, "image/webp", quality);

  if (hasTransparency && webpBlob.size > 0) {
    // 투명 PNG는 WEBP 유지 (단, JPEG보다 훨씬 크지 않으면)
    if (webpBlob.size <= jpegBlob.size * 1.2) {
      return { blob: webpBlob, format: "image/webp" };
    }
  }

  // 더 작은 포맷 선택
  if (webpBlob.size < jpegBlob.size) {
    return { blob: webpBlob, format: "image/webp" };
  }
  return { blob: jpegBlob, format: "image/jpeg" };
}

export async function compressImage(
  file: File,
  options: CompressOptions
): Promise<CompressResult> {
  const targetBytes = options.targetKB * 1024;
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const originalW = img.width;
    const originalH = img.height;

    // 투명도 여부 체크 (PNG 파일인 경우)
    const hasTransparency = file.type === "image/png";

    // 모드에 따라 캔버스 크기 결정
    let canvasW: number;
    let canvasH: number;
    let useContain = false;

    if (options.mode === "shopee") {
      canvasW = 1080;
      canvasH = 1080;
      useContain = true;
    } else if (options.mode === "sns") {
      canvasW = 1080;
      canvasH = 1350;
      useContain = true;
    } else {
      // basic 모드: 긴 변 기준 최대 1600px
      const maxLong = 1600;
      const longSide = Math.max(originalW, originalH);
      const scale = longSide > maxLong ? maxLong / longSide : 1;
      canvasW = Math.round(originalW * scale);
      canvasH = Math.round(originalH * scale);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // 해상도를 줄이며 반복 (최소 긴 변 300px)
    let scaleFactor = 1.0;
    const MIN_LONG_SIDE = 300;

    while (true) {
      const curW = Math.round(canvasW * scaleFactor);
      const curH = Math.round(canvasH * scaleFactor);
      canvas.width = curW;
      canvas.height = curH;

      if (useContain) {
        drawContain(ctx, img, curW, curH, "#ffffff");
      } else {
        ctx.clearRect(0, 0, curW, curH);
        ctx.drawImage(img, 0, 0, curW, curH);
      }

      // 품질 0.9 → 0.35, 0.05 단위 감소
      let quality = 0.9;
      while (quality >= 0.35) {
        const { blob, format } = await getBestBlob(canvas, quality, hasTransparency);

        if (blob.size <= targetBytes) {
          return {
            blob,
            format,
            width: curW,
            height: curH,
            sizeBytes: blob.size,
            success: true,
          };
        }

        quality = Math.round((quality - 0.05) * 100) / 100;
      }

      // 품질 최소에서도 실패 시 해상도 90%로 축소
      const nextLongSide = Math.max(curW, curH) * 0.9;
      if (nextLongSide < MIN_LONG_SIDE) break;

      scaleFactor *= 0.9;
    }

    // 최종 실패 시 가장 낮은 품질로 결과 반환 (실패 표시)
    const curW = Math.round(canvasW * scaleFactor);
    const curH = Math.round(canvasH * scaleFactor);
    canvas.width = curW;
    canvas.height = curH;
    if (useContain) {
      drawContain(ctx, img, curW, curH, "#ffffff");
    } else {
      ctx.drawImage(img, 0, 0, curW, curH);
    }
    const { blob, format } = await getBestBlob(canvas, 0.35, hasTransparency);

    return {
      blob,
      format,
      width: curW,
      height: curH,
      sizeBytes: blob.size,
      success: false,
      errorMessage: "목표 용량 달성 실패, 더 낮은 해상도로 재시도하세요",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatRatio(original: number, compressed: number): string {
  const ratio = ((1 - compressed / original) * 100).toFixed(1);
  return `${ratio}%`;
}
