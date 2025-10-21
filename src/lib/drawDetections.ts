import { type DetectedField, type FieldType } from "../workers/inference.worker";

export interface FieldColors {
  background: string;
  label: string;
}

export const FIELD_COLORS: Record<FieldType, FieldColors> = {
  ChoiceButton: {
    background: "#a4dcf891",
    label: "#10B981",
  },
  Signature: {
    background: "#a4dcf891",
    label: "#F59E0B",
  },
  TextBox: {
    background: "#a4dcf891",
    label: "#3B82F6",
  },
};

const LABEL_BAR_HEIGHT = 12.5;
const LABEL_FONT = "10px Arial";
const LABEL_TEXT_COLOR = "white";
const LABEL_PADDING_X = 3;
const LABEL_PADDING_Y = 3;

const drawWidgets = (canvas: HTMLCanvasElement, fields: DetectedField[]): void => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  fields.forEach((field) => {
    const [normalizedX, normalizedY, normalizedWidth, normalizedHeight] = field.bbox;
    const absoluteX = normalizedX * canvas.width;
    const absoluteY = normalizedY * canvas.height;
    const absoluteWidth = normalizedWidth * canvas.width;
    const absoluteHeight = normalizedHeight * canvas.height;

    const fieldColors = FIELD_COLORS[field.type];

    context.fillStyle = fieldColors.background;
    context.fillRect(absoluteX, absoluteY, absoluteWidth, absoluteHeight);

    context.fillStyle = fieldColors.label;
    context.fillRect(absoluteX, absoluteY - LABEL_BAR_HEIGHT, absoluteWidth, LABEL_BAR_HEIGHT);

    context.fillStyle = LABEL_TEXT_COLOR;
    context.font = LABEL_FONT;
    const confidencePercentage = (field.confidence * 100).toFixed(0);
    context.fillText(
      `${field.type} (${confidencePercentage}%)`,
      absoluteX + LABEL_PADDING_X,
      absoluteY - LABEL_PADDING_Y
    );
  });
};

interface PageDetectionDataInput {
  fields: DetectedField[];
  imageData: ImageData;
  pdfMetadata: {
    originalWidth: number;
    originalHeight: number;
    canvasSize: number;
    offsetX: number;
    offsetY: number;
  };
}

interface PageDetectionDataOutput {
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

interface DetectionDataInput {
  pages: PageDetectionDataInput[];
  processingTime: number;
  modelInfo: string;
}

interface DetectionDataOutput {
  pages: PageDetectionDataOutput[];
  processingTime: number;
  modelInfo: string;
}

export const drawDetections = (detectionData: DetectionDataInput): DetectionDataOutput => {
  const pagesWithDrawings = detectionData.pages.map((page) => {
    const canvas = document.createElement("canvas");
    canvas.width = page.imageData.width;
    canvas.height = page.imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(page.imageData, 0, 0);

    drawWidgets(canvas, page.fields);

    return {
      ...page,
      imageData: canvas.toDataURL(),
    };
  });

  return {
    ...detectionData,
    pages: pagesWithDrawings,
  };
};
