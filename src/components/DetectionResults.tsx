interface DetectedField {
  type: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface ProcessingResult {
  pageCount: number;
  fields: DetectedField[];
  imageData: string;
  processingTime: number;
  modelInfo: string;
  pdfWithAcroFieldsBlobUrl: string;
}

interface DetectionResultsProps {
  result: ProcessingResult | null;
}

export function DetectionResults({ result }: DetectionResultsProps) {
  if (!result) return null;

  return (
    <div className="mt-8 grid md:grid-cols-4 gap-6">
      {/* Visualization */}
      <div className="col-span-4 md:col-span-3">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Detected Form Fields
        </h2>
        <img
          src={result.imageData}
          alt="Detected Fields"
          className="border border-gray-300 rounded-lg w-full"
          style={{
            imageRendering: "crisp-edges",
            height: "auto",
          }}
        />
        <div className="mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3B82F6" }}></div>
            <span>TextBox</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10B981" }}></div>
            <span>ChoiceButton</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F59E0B" }}></div>
            <span>Signature</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="col-span-4 md:col-span-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h2>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Pages:</span>
            <span className="font-semibold">{result.pageCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fields Found:</span>
            <span className="font-semibold">{result.fields.length}</span>
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
