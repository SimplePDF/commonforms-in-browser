import { PDFDocument } from "pdf-lib";

type PdfValidationErrorCode = "pdf_encrypted_or_malformed" | "pdf_processing_failed";

type PdfValidationWarningCode = "pdf_has_acrofields";

type PdfValidationData = {
  warning: { code: PdfValidationWarningCode; fieldsCount: number } | null;
};

type PdfValidationResult =
  | { success: true; data: PdfValidationData }
  | {
      success: false;
      error: { code: PdfValidationErrorCode; errorMessage?: string };
    };

export const ensureValidPDF = async (pdfFile: File): Promise<PdfValidationResult> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDocument = await PDFDocument.load(arrayBuffer);
    await pdfDocument.save();

    const form = pdfDocument.getForm();
    const fields = form.getFields();

    if (fields.length > 0) {
      return {
        success: true,
        data: {
          warning: {
            code: "pdf_has_acrofields",
            fieldsCount: fields.length,
          },
        },
      };
    }

    return {
      success: true,
      data: {
        warning: null,
      },
    };
  } catch (e) {
    const error = e as Error;

    if (error.message.includes("encrypted")) {
      return {
        success: false,
        error: {
          code: "pdf_encrypted_or_malformed",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "pdf_processing_failed",
        errorMessage: error.message,
      },
    };
  }
};
