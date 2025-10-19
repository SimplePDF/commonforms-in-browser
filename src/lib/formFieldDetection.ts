import * as pdfjsLib from "pdfjs-dist";
import InferenceWorker from "../workers/inference.worker.ts?worker";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const TARGET_SIZE = 1216;

interface DetectedField {
  type: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface PageDetectionData {
  fields: DetectedField[];
  imageData: string;
  pdfMetadata: {
    originalWidth: number;
    originalHeight: number;
    canvasSize: number;
    offsetX: number;
    offsetY: number;
  };
}

interface DetectionData {
  pages: PageDetectionData[];
  processingTime: number;
  modelInfo: string;
}

export interface DetectionParameters {
  pdfFile: File;
  modelPath: string;
  confidenceThreshold: number;
  onUpdateDetectionStatus: (message: string) => void;
}

type ErrorCode =
  | "pdf_load_failed"
  | "canvas_render_failed"
  | "model_load_failed"
  | "inference_failed"
  | "unknown_error";

export type DetectionResult =
  | { success: true; data: DetectionData }
  | { success: false; error: { code: ErrorCode; message: string } };

const COLORS = {
  TextBox: {
    label: "#3B82F6",
    background: "#a4dcf891",
  },
  ChoiceButton: {
    label: "#10B981",
    background: "#a4dcf891",
  },
  Signature: {
    label: "#F59E0B",
    background: "#a4dcf891",
  },
};

const drawDetections = (
  canvas: HTMLCanvasElement,
  fields: DetectedField[]
): void => {
  const ctx = canvas.getContext("2d")!;

  fields.forEach((field) => {
    const [x, y, w, h] = field.bbox;
    const absX = x * canvas.width;
    const absY = y * canvas.height;
    const absW = w * canvas.width;
    const absH = h * canvas.height;

    const fieldColors = COLORS[field.type as keyof typeof COLORS];
    ctx.fillStyle = fieldColors.background;
    ctx.fillRect(absX, absY, absW, absH);

    ctx.fillStyle = fieldColors.label;
    ctx.fillRect(absX, absY - 12.5, absW, 12.5);
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.fillText(
      `${field.type} (${(field.confidence * 100).toFixed(0)}%)`,
      absX + 3,
      absY - 3
    );
  });
};

const renderPdfPageToImageData = async (
  page: pdfjsLib.PDFPageProxy
): Promise<{
  imageData: ImageData;
  pdfMetadata: {
    originalWidth: number;
    originalHeight: number;
    canvasSize: number;
    offsetX: number;
    offsetY: number;
  };
}> => {
  const viewport = page.getViewport({ scale: 1.0 });
  const scale = Math.min(
    TARGET_SIZE / viewport.width,
    TARGET_SIZE / viewport.height
  );
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  const context = canvas.getContext("2d")!;

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    canvas,
  }).promise;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = TARGET_SIZE;
  finalCanvas.height = TARGET_SIZE;
  const finalContext = finalCanvas.getContext("2d")!;

  finalContext.fillStyle = "white";
  finalContext.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

  const offsetX = (TARGET_SIZE - canvas.width) / 2;
  const offsetY = (TARGET_SIZE - canvas.height) / 2;
  finalContext.drawImage(canvas, offsetX, offsetY);

  const imageData = finalContext.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);

  return {
    imageData,
    pdfMetadata: {
      originalWidth: viewport.width,
      originalHeight: viewport.height,
      canvasSize: TARGET_SIZE,
      offsetX,
      offsetY,
    },
  };
};

export const detectFormFields = async (
  parameters: DetectionParameters
): Promise<DetectionResult> => {
  const { pdfFile, modelPath, confidenceThreshold, onUpdateDetectionStatus } =
    parameters;

  try {
    const startTime = performance.now();

    onUpdateDetectionStatus("Loading PDF...");

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const modelName = modelPath.includes("FFDNet-L")
      ? "FFDNet-L"
      : modelPath.includes("FFDNet-S")
        ? "FFDNet-S"
        : "model";

    onUpdateDetectionStatus(
      `Running form field detection using ${modelName} model...`
    );

    const worker = new InferenceWorker();
    const pages: PageDetectionData[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onUpdateDetectionStatus(`Processing page ${pageNum} of ${pdf.numPages}...`);

      const page = await pdf.getPage(pageNum);
      const { imageData, pdfMetadata } = await renderPdfPageToImageData(page);

      const inferenceResult = await new Promise<{
        fields: DetectedField[];
      }>((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          const { type, data } = event.data;

          if (type === "result") {
            worker.removeEventListener("message", messageHandler);
            if (!data.success) {
              reject(new Error(data.error.message));
              return;
            }
            resolve({ fields: data.fields });
          }
        };

        worker.addEventListener("message", messageHandler);

        worker.postMessage({
          imageDataArray: imageData.data,
          imageWidth: imageData.width,
          imageHeight: imageData.height,
          modelPath,
          confidenceThreshold,
          isFirstPage: pageNum === 1,
        });
      });

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      drawDetections(canvas, inferenceResult.fields);

      pages.push({
        fields: inferenceResult.fields,
        imageData: canvas.toDataURL(),
        pdfMetadata,
      });
    }

    worker.terminate();

    const endTime = performance.now();
    const totalFields = pages.reduce((sum, page) => sum + page.fields.length, 0);

    return {
      success: true,
      data: {
        pages,
        processingTime: endTime - startTime,
        modelInfo:
          `Model: ${modelName}\n` +
          `Detected Fields: ${totalFields}\n` +
          `Confidence Threshold: ${confidenceThreshold}`,
      },
    };
  } catch (e) {
    const error = e as Error;
    return {
      success: false,
      error: {
        code: "unknown_error",
        message: `Failed to detect form fields: ${error.name}: ${error.message}`,
      },
    };
  }
};
