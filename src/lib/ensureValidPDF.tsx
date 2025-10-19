import { PDFDocument } from "pdf-lib";
import { ReactNode } from "react";

type PdfValidationErrorCode =
  | "pdf_encrypted_or_malformed"
  | "pdf_processing_failed";

type PdfValidationWarningCode = "pdf_has_acrofields";

type PdfValidationData = {
  warning: { code: PdfValidationWarningCode; message: ReactNode } | null;
};

type PdfValidationResult =
  | { success: true; data: PdfValidationData }
  | {
      success: false;
      error: { code: PdfValidationErrorCode; message: ReactNode };
    };

export const ensureValidPDF = async (
  pdfFile: File
): Promise<PdfValidationResult> => {
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
            message: `This PDF already contains ${fields.length} fillable field${fields.length === 1 ? "" : "s"}. If you proceed, these will be replaced with the newly detected fields.`,
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
          message: (
            <>
              This PDF is either password-protected or malformed. If not
              password protected, try converting it to PDF/A first at{" "}
              <a
                href="https://tools.pdf24.org/en/pdf-to-pdfa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-red-900"
              >
                tools.pdf24.org
              </a>{" "}
              (we are not affiliated with this service).
            </>
          ),
        },
      };
    }

    return {
      success: false,
      error: {
        code: "pdf_processing_failed",
        message: `Unknown error when processing the PDF: ${error.message}`,
      },
    };
  }
};
