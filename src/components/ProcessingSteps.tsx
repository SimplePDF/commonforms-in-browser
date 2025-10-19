import { RefObject } from "react";
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

export function ProcessingSteps({
  pdfFile,
  isProcessing,
  hasResult,
  pdfWithAcroFieldsBlobUrl,
  fileInputRef,
  onFileSelect,
  onDetect,
}: ProcessingStepsProps) {
  const handleDownload = () => {
    if (!pdfWithAcroFieldsBlobUrl || !pdfFile) {
      return;
    }

    const link = document.createElement("a");
    link.href = pdfWithAcroFieldsBlobUrl;
    link.download = pdfFile.name.replace(".pdf", "_with_fields.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadExample = async () => {
    try {
      const response = await fetch("https://us-beautiful-space.nyc3.digitaloceanspaces.com/commonforms/flattened_w9.pdf");

      if (!response.ok) {
        console.error("Failed to fetch example PDF:", response.statusText);
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], "flattened_w9.pdf", {
        type: "application/pdf",
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;

        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, "target", {
          writable: false,
          value: fileInputRef.current,
        });

        onFileSelect(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    } catch (error) {
      console.error("Failed to load example PDF:", error);
    }
  };
  return (
    <>
      <div className="mb-8 grid md:grid-cols-3 gap-6">
        <div>
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">Step 1:</span>
            <span className="text-xl font-semibold text-gray-700 ml-2">
              Upload PDF Form
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-6 text-center hover:border-sky-500 transition-colors flex flex-col justify-start h-32">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={onFileSelect}
              className="hidden"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm cursor-pointer"
              >
                Choose PDF Form
              </button>
              <button
                onClick={handleLoadExample}
                className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors font-medium text-sm border border-sky-300 cursor-pointer"
              >
                W-9 form example
              </button>
            </div>
            {pdfFile && (
              <p className="mt-3 text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap px-2">
                Selected: <span className="font-medium">{pdfFile.name}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">Step 2:</span>
            <span className="text-xl font-semibold text-gray-700 ml-2">
              Detect Form Fields
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-6 text-center flex flex-col justify-start h-32">
            <button
              onClick={onDetect}
              disabled={!pdfFile || isProcessing}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                !pdfFile || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
              }`}
            >
              {isProcessing ? "Processing..." : "Detect Form Fields"}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">Step 3:</span>
            <span className="text-xl font-semibold text-gray-700 ml-2">
              Fill Or Download
            </span>
          </div>
          <div className="border border-gray-300 rounded-lg p-6 text-center flex flex-col justify-start gap-3 h-32">
            <EmbedPDF>
              <a
                href={pdfWithAcroFieldsBlobUrl ?? ""}
                className={`inline-block px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  !hasResult || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                }`}
              >
                Fill Form
              </a>
            </EmbedPDF>
            <button
              onClick={handleDownload}
              disabled={!hasResult || isProcessing}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                !hasResult || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-cyan-800 hover:bg-cyan-900 text-white cursor-pointer"
              }`}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
