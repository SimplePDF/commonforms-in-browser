import { PDFDocument, rgb } from "pdf-lib";
import type { DetectionResult } from "./formFieldDetection";

const FONT_SIZE_MULTIPLIER = 1;
const MULTILINE_HEIGHT_THRESHOLD = 2;

interface ApplyAcroFieldsParameters {
  pdfFile: File;
  detectionResult: DetectionResult;
  stripExistingAcroFields: boolean;
}

type ApplyAcroFieldsErrorCode =
  | "invalid_detection_result"
  | "pdf_load_failed"
  | "field_creation_failed"
  | "pdf_save_failed"
  | "unknown_error";

export type ApplyAcroFieldsResult =
  | { success: true; data: { pdfBytes: Uint8Array } }
  | {
      success: false;
      error: { code: ApplyAcroFieldsErrorCode; message: string };
    };

const generateFieldName = (type: string, index: number): string => {
  return `${type.toLowerCase()}_${index}`;
};

export const applyAcroFields = async (
  parameters: ApplyAcroFieldsParameters
): Promise<ApplyAcroFieldsResult> => {
  const { pdfFile, detectionResult, stripExistingAcroFields } = parameters;

  if (!detectionResult.success) {
    return {
      success: false,
      error: {
        code: "invalid_detection_result",
        message: `Detection result was not successful: ${detectionResult.error.message}`,
      },
    };
  }

  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (stripExistingAcroFields) {
      try {
        const form = pdfDoc.getForm();
        const existingFields = form.getFields();

        if (existingFields.length > 0) {
          form.flatten();
        }
      } catch (e) {
        const error = e as Error;
        console.error(`Failed to flatten existing form fields: ${error.name}: ${error.message}`);
        // Fail silently - better to add detected fields alongside existing ones than to fail entirely
      }
    }

    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const fieldTypeCounters: Record<string, number> = {};

    for (let pageIndex = 0; pageIndex < detectionResult.data.pages.length; pageIndex++) {
      const pageData = detectionResult.data.pages[pageIndex];
      const pdfPage = pages[pageIndex];
      const { height: pageHeight } = pdfPage.getSize();

      const { fields, pdfMetadata } = pageData;

      if (fields.length === 0) {
        continue;
      }

      const totalHeight = fields.reduce((sum, field) => sum + field.bbox[3], 0);
      const meanHeight = totalHeight / fields.length;

      for (const field of fields) {
      const fieldType = field.type;
      if (!fieldTypeCounters[fieldType]) {
        fieldTypeCounters[fieldType] = 0;
      }
      const fieldIndex = fieldTypeCounters[fieldType]++;
      const fieldName = generateFieldName(fieldType, fieldIndex);

      const [x, y, w, h] = field.bbox;

      const { originalWidth, originalHeight, canvasSize, offsetX, offsetY } =
        pdfMetadata;

      const canvasX = x * canvasSize;
      const canvasY = y * canvasSize;
      const canvasW = w * canvasSize;
      const canvasH = h * canvasSize;

      const pdfX =
        ((canvasX - offsetX) / (canvasSize - 2 * offsetX)) * originalWidth;
      const pdfY =
        ((canvasY - offsetY) / (canvasSize - 2 * offsetY)) * originalHeight;
      const pdfW = (canvasW / (canvasSize - 2 * offsetX)) * originalWidth;
      const pdfH = (canvasH / (canvasSize - 2 * offsetY)) * originalHeight;

      const absoluteX = pdfX;
      const absoluteY = pageHeight - (pdfY + pdfH);
      const absoluteW = pdfW;
      const absoluteH = pdfH;

      const normalizedFieldHeight = field.bbox[3];
      const heightRatio = normalizedFieldHeight / meanHeight;

      try {
        switch (fieldType) {
          case "TextBox": {
            const isMultiline = heightRatio >= MULTILINE_HEIGHT_THRESHOLD;
            const textField = form.createTextField(fieldName);
            textField.addToPage(pdfPage, {
              x: absoluteX,
              y: absoluteY,
              width: absoluteW,
              height: absoluteH,
              borderWidth: 0,
              textColor: rgb(0, 0, 0),
            });
            const fontSize = isMultiline
              ? (absoluteH / heightRatio) * FONT_SIZE_MULTIPLIER
              : absoluteH * FONT_SIZE_MULTIPLIER;
            textField.setFontSize(fontSize);
            if (isMultiline) {
              textField.enableMultiline();
            }
            const acroField = textField.acroField;
            const widgets = acroField.getWidgets();
            widgets.forEach((widget) => {
              const widgetDict = widget.dict;
              const mkDict = widgetDict.context.obj({});
              widgetDict.set(widgetDict.context.obj("MK"), mkDict);
            });
            break;
          }
          case "ChoiceButton": {
            const checkBox = form.createCheckBox(fieldName);
            checkBox.addToPage(pdfPage, {
              x: absoluteX,
              y: absoluteY,
              width: absoluteW,
              height: absoluteH,
              borderWidth: 0,
            });
            const acroField = checkBox.acroField;
            const widgets = acroField.getWidgets();
            widgets.forEach((widget) => {
              const widgetDict = widget.dict;
              const mkDict = widgetDict.context.obj({});
              widgetDict.set(widgetDict.context.obj("MK"), mkDict);
            });
            break;
          }
          case "Signature": {
            const signatureField = form.createTextField(fieldName);
            signatureField.addToPage(pdfPage, {
              x: absoluteX,
              y: absoluteY,
              width: absoluteW,
              height: absoluteH,
              borderWidth: 0,
              textColor: rgb(0, 0, 0),
            });
            const fontSize = absoluteH * FONT_SIZE_MULTIPLIER;
            signatureField.setFontSize(fontSize);
            const acroField = signatureField.acroField;
            const widgets = acroField.getWidgets();
            widgets.forEach((widget) => {
              const widgetDict = widget.dict;
              const mkDict = widgetDict.context.obj({});
              widgetDict.set(widgetDict.context.obj("MK"), mkDict);
            });
            break;
          }
          default:
            console.error(`Unsupported field type: ${fieldType}`);
            break;
        }
      } catch (e) {
        const error = e as Error;
        return {
          success: false,
          error: {
            code: "field_creation_failed",
            message: `Failed to create field ${fieldName}: ${error.name}: ${error.message}`,
          },
        };
      }
    }
    }

    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      data: {
        pdfBytes,
      },
    };
  } catch (e) {
    const error = e as Error;
    if (error.message.includes("load")) {
      return {
        success: false,
        error: {
          code: "pdf_load_failed",
          message: `Failed to load PDF: ${error.name}: ${error.message}`,
        },
      };
    }
    if (error.message.includes("save")) {
      return {
        success: false,
        error: {
          code: "pdf_save_failed",
          message: `Failed to save PDF: ${error.name}: ${error.message}`,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "unknown_error",
        message: `Failed to apply AcroFields: ${error.name}: ${error.message}`,
      },
    };
  }
};
