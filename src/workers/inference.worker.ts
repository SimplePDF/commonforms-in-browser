import * as ort from "onnxruntime-web";
import { applyNonMaximumSuppression } from "../lib/utils";

ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/";

const CLASS_NAMES = ["TextBox", "ChoiceButton", "Signature"];
const IOU_THRESHOLD = 0.45;
const TARGET_SIZE = 1216;

interface InferenceWorkerInput {
  imageDataArray: Uint8ClampedArray;
  imageWidth: number;
  imageHeight: number;
  modelPath: string;
  confidenceThreshold: number;
  isFirstPage: boolean;
}

interface DetectedField {
  type: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface InferenceWorkerOutput {
  success: true;
  fields: DetectedField[];
}

interface InferenceWorkerError {
  success: false;
  error: { code: string; message: string };
}

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

let cachedSession: ort.InferenceSession | null = null;

const runInference = async (
  imageDataArray: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  modelPath: string,
  confidenceThreshold: number,
  isFirstPage: boolean
): Promise<DetectedField[]> => {
  if (isFirstPage || !cachedSession) {
    cachedSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
    });
  }

  const rgbData = new Float32Array(3 * imageWidth * imageHeight);

  for (let i = 0; i < imageDataArray.length / 4; i++) {
    const r = imageDataArray[i * 4] / 255.0;
    const g = imageDataArray[i * 4 + 1] / 255.0;
    const b = imageDataArray[i * 4 + 2] / 255.0;

    rgbData[i] = r;
    rgbData[imageWidth * imageHeight + i] = g;
    rgbData[2 * imageWidth * imageHeight + i] = b;
  }

  const tensor = new ort.Tensor("float32", rgbData, [
    1,
    3,
    imageWidth,
    imageHeight,
  ]);

  const feeds = { images: tensor };
  const output = await cachedSession.run(feeds);

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
    const adjustedH = h;
    const x0 = cx - w / 2;
    const y0 = cy + h / 2 - adjustedH;
    return {
      type: CLASS_NAMES[det.classId],
      bbox: [x0, y0, w, adjustedH],
      confidence: det.confidence,
    };
  });

  return sortFieldsByReadingOrder(unsortedFields);
};

self.onmessage = async (event: MessageEvent<InferenceWorkerInput>) => {
  const {
    imageDataArray,
    imageWidth,
    imageHeight,
    modelPath,
    confidenceThreshold,
    isFirstPage,
  } = event.data;

  try {
    const fields = await runInference(
      imageDataArray,
      imageWidth,
      imageHeight,
      modelPath,
      confidenceThreshold,
      isFirstPage
    );

    const response: InferenceWorkerOutput = {
      success: true,
      fields,
    };

    self.postMessage({ type: "result", data: response });
  } catch (e) {
    const error = e as Error;
    const response: InferenceWorkerError = {
      success: false,
      error: {
        code: "inference_failed",
        message: `Failed to run inference: ${error.name}: ${error.message}`,
      },
    };
    self.postMessage({ type: "result", data: response });
  }
};
