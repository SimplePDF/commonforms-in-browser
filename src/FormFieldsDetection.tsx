import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as ort from "onnxruntime-web";
import * as pdfjsLib from "pdfjs-dist";
import { detectFormFields } from "./lib/formFieldDetection";
import { applyAcroFields } from "./lib/applyAcroFields";
import { ensureValidPDF } from "./lib/ensureValidPDF";
import { drawDetections } from "./lib/drawDetections";
import { ModelSelection, type ModelType, type ModelOption } from "./components/ModelSelection";
import { DetectionResults, type ProcessingResult } from "./components/DetectionResults";
import { ProcessingSteps } from "./components/ProcessingSteps";
import { Header } from "./components/Header";
import { StatusMessage, type Status } from "./components/StatusMessage";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/";

const MODEL_URLS: Record<ModelType, string> = {
  "FFDNet-S": "https://us-beautiful-space.nyc3.cdn.digitaloceanspaces.com/commonforms/FFDNet-S.onnx",
  "FFDNet-L": "https://huggingface.co/jbarrow/FFDNet-L-cpu/resolve/main/FFDNet-L.onnx",
};

const AVAILABLE_MODELS: ModelOption[] = [
  { value: "FFDNet-S", label: "FFDNet-S (faster)" },
  { value: "FFDNet-L", label: "FFDNet-L (more accurate)" },
];

interface ModelConfiguration {
  selectedModel: ModelType;
  confidenceThreshold: number;
}

interface PdfFileState {
  file: File;
  hasAcrofields: boolean;
}

export function FormFieldsDetection() {
  const { t } = useTranslation();
  const [pdfFile, setPdfFile] = useState<PdfFileState | null>(null);
  const [modelConfiguration, setModelConfiguration] = useState<ModelConfiguration>({
    selectedModel: "FFDNet-S",
    confidenceThreshold: 0.4,
  });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || file.type !== "application/pdf") {
      setStatus({ type: "error", message: t("errors.invalidPdfFile") });
      return;
    }

    const validationResult = await ensureValidPDF(file);

    if (!validationResult.success) {
      const errorCode = validationResult.error.code;

      if (errorCode === "pdf_encrypted_or_malformed") {
        setStatus({
          type: "error",
          message: (
            <>
              {t("errors.pdfEncryptedOrMalformed")}{" "}
              <a
                href="https://tools.pdf24.org/en/pdf-to-pdfa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-red-900"
              >
                tools.pdf24.org
              </a>{" "}
              {t("errors.pdfEncryptedNotAffiliated")}
            </>
          ),
        });
      } else {
        setStatus({
          type: "error",
          message: t("errors.pdfProcessingFailed", {
            errorMessage: validationResult.error.errorMessage || "Unknown error",
          }),
        });
      }
      return;
    }

    setPdfFile({
      file,
      hasAcrofields: validationResult.data.warning?.code === "pdf_has_acrofields",
    });

    if (validationResult.data.warning) {
      setStatus({
        type: "warning",
        message: t("warnings.pdfHasAcrofields", {
          count: validationResult.data.warning.fieldsCount,
        }),
      });
    } else {
      setStatus({ type: "idle" });
    }

    setResult(null);
  };

  const handleDetectFormFields = async () => {
    if (!pdfFile) {
      return;
    }

    const detectionResult = await detectFormFields({
      pdfFile: pdfFile.file,
      modelPath: MODEL_URLS[modelConfiguration.selectedModel],
      confidenceThreshold: modelConfiguration.confidenceThreshold,
      onUpdateDetectionStatus: (status) => {
        const translatedMessage = ((): string => {
          switch (status.type) {
            case "loading_pdf":
              return t("statusMessages.loadingPdf");
            case "running_detection":
              return t("statusMessages.runningDetection", {
                modelName: status.modelName,
              });
            case "processing_page":
              return t("statusMessages.processingPage", {
                current: status.current,
                total: status.total,
              });
          }
        })();

        setStatus({ type: "loading", message: translatedMessage });
      },
    });

    if (!detectionResult.success) {
      setStatus({
        type: "error",
        message: t("errors.detectionFailed", {
          errorMessage: detectionResult.error.message,
        }),
      });
      return;
    }

    setStatus({
      type: "loading",
      message: t("statusMessages.applyingAcroFields"),
    });

    const acroFieldsResult = await applyAcroFields({
      pdfFile: pdfFile.file,
      detectionResult,
      stripExistingAcroFields: pdfFile.hasAcrofields,
    });

    if (!acroFieldsResult.success) {
      setStatus({
        type: "error",
        message: t("errors.acroFieldsFailed", {
          errorMessage: acroFieldsResult.error.message,
        }),
      });
      return;
    }

    const arrayBuffer: ArrayBuffer =
      acroFieldsResult.data.pdfBytes.buffer instanceof ArrayBuffer
        ? acroFieldsResult.data.pdfBytes.buffer
        : new ArrayBuffer(0);
    const pdfBlob = new Blob([arrayBuffer], {
      type: "application/pdf",
    });
    const pdfWithAcroFieldsBlobUrl = URL.createObjectURL(pdfBlob);

    const detectionDataWithDrawings = drawDetections(detectionResult.data);

    setResult({
      pages: detectionDataWithDrawings.pages,
      processingTime: detectionResult.data.processingTime,
      modelInfo: detectionResult.data.modelInfo,
      pdfWithAcroFieldsBlobUrl,
      confidenceThreshold: modelConfiguration.confidenceThreshold,
    });
    setStatus({ type: "idle" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-4">
      <div className="max-w-[96rem] mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 lg:p-8">
          <Header />

          <ModelSelection
            selectedModel={modelConfiguration.selectedModel}
            onSelectModel={(model) =>
              setModelConfiguration((prev) => ({
                ...prev,
                selectedModel: model,
              }))
            }
            availableModels={AVAILABLE_MODELS}
            confidenceThreshold={modelConfiguration.confidenceThreshold}
            onChangeConfidenceThreshold={(threshold) =>
              setModelConfiguration((prev) => ({
                ...prev,
                confidenceThreshold: threshold,
              }))
            }
          />

          <ProcessingSteps
            pdfFile={pdfFile?.file ?? null}
            isProcessing={status.type === "loading"}
            hasResult={result !== null}
            pdfWithAcroFieldsBlobUrl={result?.pdfWithAcroFieldsBlobUrl ?? null}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onDetect={handleDetectFormFields}
          />

          <StatusMessage status={status} />

          <DetectionResults result={result} />
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
