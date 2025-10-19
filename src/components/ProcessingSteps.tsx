import { RefObject, useCallback } from "react";
import { EmbedPDF } from "@simplepdf/react-embed-pdf";

interface ProcessingStepsProps {
  pdfFile: File | null;
  isProcessing: boolean;
  hasResult: boolean;
  pdfWithAcroFieldsBlobUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDetect: () => void;
}

const EXAMPLE_PDF = {
  URL: "https://us-beautiful-space.nyc3.digitaloceanspaces.com/commonforms/cerfa_14571-05_LONG_SEJOUR_EN.pdf",
  FILENAME: "cerfa_14571-05_LONG_SEJOUR_EN.pdf",
};

export const ProcessingSteps = ({
  pdfFile,
  isProcessing,
  hasResult,
  pdfWithAcroFieldsBlobUrl,
  fileInputRef,
  onFileSelect,
  onDetect,
}: ProcessingStepsProps) => {
  const handleDownload = useCallback(() => {
    const canDownload = pdfWithAcroFieldsBlobUrl && pdfFile;
    if (!canDownload) {
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = pdfWithAcroFieldsBlobUrl;
    downloadLink.download = pdfFile.name.replace(".pdf", "_with_fields.pdf");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [pdfWithAcroFieldsBlobUrl, pdfFile]);

  const handleLoadExample = useCallback(async () => {
    try {
      const fetchResponse = await fetch(EXAMPLE_PDF.URL);

      if (!fetchResponse.ok) {
        console.error("Failed to fetch example PDF:", fetchResponse.statusText);
        return;
      }

      const pdfBlob = await fetchResponse.blob();
      const exampleFile = new File([pdfBlob], EXAMPLE_PDF.FILENAME, {
        type: "application/pdf",
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(exampleFile);

      if (!fileInputRef.current) {
        return;
      }

      fileInputRef.current.files = dataTransfer.files;

      const changeEvent = new Event("change", { bubbles: true });
      Object.defineProperty(changeEvent, "target", {
        writable: false,
        value: fileInputRef.current,
      });

      onFileSelect(changeEvent as unknown as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error("Failed to load example PDF:", error);
    }
  }, [fileInputRef, onFileSelect]);

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const isDetectDisabled = !pdfFile || isProcessing;
  const isResultDisabled = !hasResult || isProcessing;

  return (
    <>
      <div className="mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <div className="mb-3">
            <span className="text-lg md:text-2xl font-bold text-gray-900">Step 1:</span>
            <span className="text-base md:text-xl font-semibold text-gray-700 ml-2">
              Upload PDF Form
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-sky-500 transition-colors flex flex-col justify-start h-32">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={onFileSelect}
              className="hidden"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleFileInputClick}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {pdfFile ? `Selected: ${pdfFile.name}` : "Choose PDF Form"}
              </button>
              <button
                onClick={handleLoadExample}
                className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors font-medium text-sm border border-sky-300 cursor-pointer"
              >
                CERFA form example
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="text-lg md:text-2xl font-bold text-gray-900">Step 2:</span>
            <span className="text-base md:text-xl font-semibold text-gray-700 ml-2">
              Detect Form Fields
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-4 md:p-6 text-center flex flex-col justify-start gap-2 md:gap-3 h-32">
            <button
              onClick={onDetect}
              disabled={isDetectDisabled}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isDetectDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
              }`}
            >
              {isProcessing ? "Processing..." : "Detect form fields"}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="text-lg md:text-2xl font-bold text-gray-900">Step 3:</span>
            <span className="text-base md:text-xl font-semibold text-gray-700 ml-2">
              Fill Or Download
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-4 md:p-6 text-center flex flex-col justify-start gap-2 md:gap-3 h-32">
            <EmbedPDF>
              <a
                href={pdfWithAcroFieldsBlobUrl ?? ""}
                className={`inline-block px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isResultDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                }`}
              >
                Fill form
              </a>
            </EmbedPDF>
            <button
              onClick={handleDownload}
              disabled={isResultDisabled}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isResultDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-cyan-800 hover:bg-cyan-900 text-white cursor-pointer"
              }`}
            >
              Download fillable PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
