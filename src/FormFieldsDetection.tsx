import { useState, useRef } from "react";
import * as ort from "onnxruntime-web";
import * as pdfjsLib from "pdfjs-dist";
import { detectFormFields } from "./lib/formFieldDetection";
import { applyAcroFields } from "./lib/applyAcroFields";
import {
  ModelSelection,
  type ModelType,
  type ModelOption,
} from "./components/ModelSelection";
import {
  DetectionResults,
  type ProcessingResult,
} from "./components/DetectionResults";
import { ProcessingSteps } from "./components/ProcessingSteps";
import { Header } from "./components/Header";
import { StatusMessage, type Status } from "./components/StatusMessage";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/";

const MODEL_URLS: Record<ModelType, string> = {
  "FFDNet-S": "https://us-beautiful-space.nyc3.digitaloceanspaces.com/commonforms/FFDNet-S.onnx",
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

export function FormFieldsDetection() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [modelConfiguration, setModelConfiguration] =
    useState<ModelConfiguration>({
      selectedModel: "FFDNet-S",
      confidenceThreshold: 0.4,
    });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || file.type !== "application/pdf") {
      setStatus({ type: "error", message: "Please select a valid PDF file" });
      return;
    }

    setPdfFile(file);
    setStatus({ type: "idle" });
    setResult(null);
  };

  const handleDetectFormFields = async () => {
    if (!pdfFile) {
      return;
    }

    const detectionResult = await detectFormFields({
      pdfFile,
      modelPath: MODEL_URLS[modelConfiguration.selectedModel],
      confidenceThreshold: modelConfiguration.confidenceThreshold,
      onUpdateDetectionStatus: (message) => {
        setStatus({ type: "loading", message });
      },
    });

    if (!detectionResult.success) {
      setStatus({
        type: "error",
        message: detectionResult.error.message,
      });
      return;
    }

    setStatus({ type: "loading", message: "Applying AcroFields to PDF..." });

    const acroFieldsResult = await applyAcroFields({
      pdfFile,
      detectionResult,
    });

    if (!acroFieldsResult.success) {
      setStatus({
        type: "error",
        message: acroFieldsResult.error.message,
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

    setResult({
      ...detectionResult.data,
      pdfWithAcroFieldsBlobUrl,
    });
    setStatus({ type: "idle" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-[96rem] mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
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
            pdfFile={pdfFile}
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
