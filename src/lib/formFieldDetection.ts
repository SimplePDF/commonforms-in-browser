import * as ort from "onnxruntime-web";
import * as pdfjsLib from "pdfjs-dist";
import { applyNonMaximumSuppression } from "./utils";

interface DetectedField {
  type: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface DetectionData {
  pageCount: number;
  fields: DetectedField[];
  imageData: string;
  processingTime: number;
  modelInfo: string;
  pdfMetadata: {
    originalWidth: number;
    originalHeight: number;
    canvasSize: number;
    offsetX: number;
    offsetY: number;
  };
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

const CLASS_NAMES = ["TextBox", "ChoiceButton", "Signature"];
const IOU_THRESHOLD = 0.45;
const TARGET_SIZE = 1216;
const ADJUSTED_HEIGHT_FACTOR = 1;

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

const sortFieldsByReadingOrder = (fields: DetectedField[]): DetectedField[] => {
  return [...fields].sort((a, b) => {
    const [aX, aY] = a.bbox;
    const [bX, bY] = b.bbox;
    const yDiff = aY - bY;
    if (Math.abs(yDiff) > 0.01) {
      return yDiff;
    }
    return aX - bX;
  });
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
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(
      TARGET_SIZE / viewport.width,
      TARGET_SIZE / viewport.height
    );
    const scaledViewport = page.getViewport({ scale });

    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d")!;
    tempCanvas.height = scaledViewport.height;
    tempCanvas.width = scaledViewport.width;

    await page.render({
      canvasContext: tempContext,
      viewport: scaledViewport,
      canvas: tempCanvas,
    }).promise;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;

    context.fillStyle = "white";
    context.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

    const offsetX = (TARGET_SIZE - tempCanvas.width) / 2;
    const offsetY = (TARGET_SIZE - tempCanvas.height) / 2;
    context.drawImage(tempCanvas, offsetX, offsetY);

    onUpdateDetectionStatus("Preprocessing image...");
    const imageData = context.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);

    const rgbData = new Float32Array(3 * canvas.height * canvas.width);

    for (let i = 0; i < imageData.data.length / 4; i++) {
      const r = imageData.data[i * 4] / 255.0;
      const g = imageData.data[i * 4 + 1] / 255.0;
      const b = imageData.data[i * 4 + 2] / 255.0;

      rgbData[i] = r;
      rgbData[canvas.height * canvas.width + i] = g;
      rgbData[2 * canvas.height * canvas.width + i] = b;
    }

    const modelName = modelPath.includes("FFDNet-L")
      ? "FFDNet-L"
      : modelPath.includes("FFDNet-S")
        ? "FFDNet-S"
        : "model";

    onUpdateDetectionStatus(
      `Running form field detection using ${modelName} model...`
    );

    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
    });

    const tensor = new ort.Tensor("float32", rgbData, [
      1,
      3,
      canvas.height,
      canvas.width,
    ]);

    const feeds = { images: tensor };
    const output = await session.run(feeds);

    const outputTensor = output["output0"];
    const outputData = outputTensor.data as Float32Array;
    const outputDims = outputTensor.dims as number[];

    const numPredictions = outputDims[2];
    const detections: Array<{
      box: [number, number, number, number];
      classId: number;
      confidence: number;
    }> = [];

    for (let i = 0; i < numPredictions; i++) {
      const cx = outputData[i];
      const cy = outputData[numPredictions + i];
      const w = outputData[2 * numPredictions + i];
      const h = outputData[3 * numPredictions + i];

      const class0Score = outputData[4 * numPredictions + i];
      const class1Score = outputData[5 * numPredictions + i];
      const class2Score = outputData[6 * numPredictions + i];

      const scores = [class0Score, class1Score, class2Score];
      const maxScore = Math.max(...scores);
      const classId = scores.indexOf(maxScore);

      if (maxScore > confidenceThreshold) {
        detections.push({
          box: [
            cx / TARGET_SIZE,
            cy / TARGET_SIZE,
            w / TARGET_SIZE,
            h / TARGET_SIZE,
          ],
          classId,
          confidence: maxScore,
        });
      }
    }

    const nmsDetections = applyNonMaximumSuppression(detections, IOU_THRESHOLD);

    const unsortedFields: DetectedField[] = nmsDetections.map((det) => {
      const [cx, cy, w, h] = det.box;
      const adjustedH = h * ADJUSTED_HEIGHT_FACTOR;
      const x0 = cx - w / 2;
      const y0 = cy + h / 2 - adjustedH;
      return {
        type: CLASS_NAMES[det.classId],
        bbox: [x0, y0, w, adjustedH],
        confidence: det.confidence,
      };
    });

    const fields = sortFieldsByReadingOrder(unsortedFields);

    const endTime = performance.now();

    drawDetections(canvas, fields);

    return {
      success: true,
      data: {
        pageCount: pdf.numPages,
        fields,
        imageData: canvas.toDataURL(),
        processingTime: endTime - startTime,
        modelInfo:
          `Model: ${modelName}\n` +
          `Detected Fields: ${fields.length}\n` +
          `Confidence Threshold: ${confidenceThreshold}`,
        pdfMetadata: {
          originalWidth: viewport.width,
          originalHeight: viewport.height,
          canvasSize: TARGET_SIZE,
          offsetX,
          offsetY,
        },
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
