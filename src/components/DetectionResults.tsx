import { useState } from "react";

interface DetectedField {
  type: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface PageResult {
  fields: DetectedField[];
  imageData: string;
}

interface ProcessingResult {
  pages: PageResult[];
  processingTime: number;
  modelInfo: string;
  pdfWithAcroFieldsBlobUrl: string;
  confidenceThreshold: number;
}

interface DetectionResultsProps {
  result: ProcessingResult | null;
}

export function DetectionResults({ result }: DetectionResultsProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!result) {
    return null;
  }

  const currentPage = result.pages[currentPageIndex] || result.pages[0];
  const totalFields = result.pages.reduce(
    (sum, page) => sum + page.fields.length,
    0
  );

  const handlePreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(result.pages.length - 1, prev + 1));
  };

  return (
    <div className="mt-8 grid md:grid-cols-4 gap-6">
      {/* Visualization */}
      <div className="col-span-4 md:col-span-3">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Detected Form Fields
        </h2>
        <img
          src={currentPage.imageData}
          alt={`Detected Fields - Page ${currentPageIndex + 1}`}
          className="border border-gray-300 rounded-lg w-full"
          style={{
            imageRendering: "crisp-edges",
            height: "auto",
          }}
        />
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#3B82F6" }}
              ></div>
              <span>TextBox</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#10B981" }}
              ></div>
              <span>ChoiceButton</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#F59E0B" }}
              ></div>
              <span>Signature</span>
            </div>
          </div>
          {result.pages.length > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPageIndex === 0}
                className={`px-3 py-1 rounded ${
                  currentPageIndex === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                ←
              </button>
              <span className="text-sm font-medium">
                Page {currentPageIndex + 1} of {result.pages.length}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === result.pages.length - 1}
                className={`px-3 py-1 rounded ${
                  currentPageIndex === result.pages.length - 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="col-span-4 md:col-span-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h2>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Pages:</span>
            <span className="font-semibold">{result.pages.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Confidence Threshold:</span>
            <span className="font-semibold">{(result.confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fields Detected:</span>
            <span className="font-semibold">{totalFields}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Page:</span>
            <span className="font-semibold">{currentPage.fields.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Time:</span>
            <span className="font-semibold text-emerald-600">
              {result.processingTime.toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ProcessingResult, DetectedField };
