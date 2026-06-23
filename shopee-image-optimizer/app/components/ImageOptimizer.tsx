'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
  compressImage,
  formatBytes,
  formatRatio,
  CompressMode,
  CompressResult,
} from '../lib/compressor';

// 처리된 이미지 항목 타입
interface ImageItem {
  id: string;
  file: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalPreview: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: CompressResult;
  resultPreview?: string;
  errorMessage?: string;
}

const TARGET_KB_OPTIONS = [70, 100, 200] as const;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageOptimizer() {
  const [mode, setMode] = useState<CompressMode>('shopee');
  const [targetKB, setTargetKB] = useState<number>(70);
  const [customKB, setCustomKB] = useState<string>('');
  const [useCustomKB, setUseCustomKB] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAllDownloading, setIsAllDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SNS 모드는 목표 용량 선택 가능, Shopee는 항상 70KB
  const effectiveTargetKB =
    mode === 'shopee'
      ? 70
      : useCustomKB
      ? parseInt(customKB) || 70
      : targetKB;

  // 파일 유효성 검사
  function validateFile(file: File): boolean {
    return ACCEPTED_TYPES.includes(file.type);
  }

  // 이미지 파일 목록을 받아 상태에 추가하고 압축 시작
  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter(validateFile);
      if (validFiles.length === 0) return;

      // 원본 미리보기 생성 및 해상도 측정
      const newItems: ImageItem[] = await Promise.all(
        validFiles.map(async (file) => {
          const preview = URL.createObjectURL(file);
          const dims = await getImageDimensions(preview);
          return {
            id: crypto.randomUUID(),
            file,
            originalSize: file.size,
            originalWidth: dims.width,
            originalHeight: dims.height,
            originalPreview: preview,
            status: 'pending' as const,
          };
        })
      );

      setImages((prev) => [...prev, ...newItems]);

      // 순차적으로 압축
      for (const item of newItems) {
        setImages((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i))
        );

        try {
          const result = await compressImage(item.file, {
            mode,
            targetKB: effectiveTargetKB,
          });
          const resultPreview = URL.createObjectURL(result.blob);

          setImages((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: result.success ? 'done' : 'error',
                    result,
                    resultPreview,
                    errorMessage: result.errorMessage,
                  }
                : i
            )
          );
        } catch (e) {
          setImages((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'error', errorMessage: String(e) }
                : i
            )
          );
        }
      }
    },
    [mode, effectiveTargetKB]
  );

  // 이미지 해상도 측정 헬퍼
  function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = src;
    });
  }

  // 클립보드 붙여넣기 이벤트
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items || []);
      const files = items
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter(Boolean) as File[];
      if (files.length > 0) processFiles(files);
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  // 드래그앤드롭 핸들러
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  // 파일 선택 핸들러
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  }

  // 개별 다운로드
  function downloadSingle(item: ImageItem) {
    if (!item.result) return;
    const ext = item.result.format === 'image/webp' ? 'webp' : 'jpg';
    const baseName = item.file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(item.result.blob);
    a.download = `${baseName}_optimized.${ext}`;
    a.click();
  }

  // 전체 ZIP 다운로드
  async function downloadAll() {
    const doneItems = images.filter((i) => i.status === 'done' && i.result);
    if (doneItems.length === 0) return;
    setIsAllDownloading(true);
    try {
      const zip = new JSZip();
      for (const item of doneItems) {
        const ext = item.result!.format === 'image/webp' ? 'webp' : 'jpg';
        const baseName = item.file.name.replace(/\.[^.]+$/, '');
        zip.file(`${baseName}_optimized.${ext}`, item.result!.blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'optimized-images.zip';
      a.click();
    } finally {
      setIsAllDownloading(false);
    }
  }

  // 전체 초기화
  function clearAll() {
    images.forEach((i) => {
      URL.revokeObjectURL(i.originalPreview);
      if (i.resultPreview) URL.revokeObjectURL(i.resultPreview);
    });
    setImages([]);
  }

  const hasDoneImages = images.some((i) => i.status === 'done');
  const isProcessing = images.some((i) => i.status === 'processing');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-1">🛍 Shopee Image Optimizer</h1>
        <p className="text-gray-500 text-sm">쇼피 썸네일·SNS 이미지를 브라우저에서 바로 압축하세요</p>
      </div>

      {/* 모드 선택 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">압축 모드</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'shopee', label: '🛍 Shopee 모드', desc: '1080×1080 · 흰 배경 · 70KB 이하' },
            { value: 'sns', label: '📸 SNS 모드', desc: '1080×1350 · 흰 배경 · 용량 선택 가능' },
            { value: 'basic', label: '⚡ 기본 모드', desc: '원본 비율 유지 · 용량 선택 가능' },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value as CompressMode)}
              className={`flex-1 min-w-[160px] px-4 py-3 rounded-lg border text-left transition-all ${
                mode === m.value
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* 목표 용량 선택 (Shopee 모드는 숨김) */}
        {mode !== 'shopee' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">목표 용량</h2>
            <div className="flex flex-wrap gap-2 items-center">
              {TARGET_KB_OPTIONS.map((kb) => (
                <button
                  key={kb}
                  onClick={() => { setTargetKB(kb); setUseCustomKB(false); }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    !useCustomKB && targetKB === kb
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setUseCustomKB(true)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    useCustomKB
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  직접 입력
                </button>
                {useCustomKB && (
                  <input
                    type="number"
                    value={customKB}
                    onChange={(e) => setCustomKB(e.target.value)}
                    placeholder="KB"
                    className="w-20 px-2 py-2 border border-orange-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6 ${
          isDragging
            ? 'border-orange-400 bg-orange-50'
            : 'border-gray-300 hover:border-orange-300 hover:bg-gray-50 bg-white'
        }`}
      >
        <div className="text-5xl mb-3">🖼️</div>
        <p className="text-gray-600 font-medium mb-1">이미지를 붙여넣거나 드래그하세요</p>
        <p className="text-gray-400 text-sm">또는 클릭하여 파일 선택 · JPG, PNG, WEBP 지원 · 여러 장 가능</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 일괄 작업 버튼 */}
      {images.length > 0 && (
        <div className="flex gap-3 justify-end mb-4">
          {hasDoneImages && (
            <button
              onClick={downloadAll}
              disabled={isAllDownloading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isAllDownloading ? '압축 중...' : `전체 다운로드 ZIP (${images.filter((i) => i.status === 'done').length}장)`}
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            전체 초기화
          </button>
        </div>
      )}

      {/* 이미지 결과 목록 */}
      <div className="space-y-4">
        {images.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            {/* 처리 중 */}
            {item.status === 'processing' && (
              <div className="flex items-center gap-3 text-orange-500">
                <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">{item.file.name} 압축 중...</span>
              </div>
            )}

            {/* 완료 or 실패 */}
            {(item.status === 'done' || item.status === 'error') && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{item.file.name}</span>
                  <div className="flex items-center gap-2">
                    {item.status === 'error' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {item.errorMessage || '실패'}
                      </span>
                    )}
                    {item.status === 'done' && item.result && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        완료
                      </span>
                    )}
                    {item.result && (
                      <button
                        onClick={() => downloadSingle(item)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        다운로드
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 원본 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2 font-medium">원본</p>
                    <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.originalPreview}
                        alt="원본"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                      <div>용량: <span className="font-medium text-gray-700">{formatBytes(item.originalSize)}</span></div>
                      <div>해상도: <span className="font-medium text-gray-700">{item.originalWidth}×{item.originalHeight}</span></div>
                    </div>
                  </div>

                  {/* 결과 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2 font-medium">압축 후</p>
                    <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                      {item.resultPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.resultPreview}
                          alt="압축 결과"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">없음</span>
                      )}
                    </div>
                    {item.result && (
                      <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                        <div>
                          용량:{' '}
                          <span className={`font-medium ${item.result.sizeBytes > effectiveTargetKB * 1024 ? 'text-red-500' : 'text-green-600'}`}>
                            {formatBytes(item.result.sizeBytes)}
                          </span>
                        </div>
                        <div>해상도: <span className="font-medium text-gray-700">{item.result.width}×{item.result.height}</span></div>
                        <div>
                          압축률:{' '}
                          <span className="font-medium text-blue-600">
                            {formatRatio(item.originalSize, item.result.sizeBytes)} 감소
                          </span>
                        </div>
                        <div>포맷: <span className="font-medium text-gray-700">{item.result.format === 'image/webp' ? 'WEBP' : 'JPG'}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 개인정보 안내 */}
      <div className="mt-10 text-center text-xs text-gray-400">
        🔒 이미지는 브라우저에서만 처리되며 서버에 업로드되지 않습니다.
      </div>
    </div>
  );
}
