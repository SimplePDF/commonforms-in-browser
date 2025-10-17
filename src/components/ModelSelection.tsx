type ModelType = "FFDNet-S" | "FFDNet-L";

interface ModelOption {
  value: ModelType;
  label: string;
}

interface ModelSelectionProps {
  selectedModel: ModelType;
  onSelectModel: (model: ModelType) => void;
  availableModels: ModelOption[];
  confidenceThreshold: number;
  onChangeConfidenceThreshold: (threshold: number) => void;
}

export function ModelSelection({
  selectedModel,
  onSelectModel,
  availableModels,
  confidenceThreshold,
  onChangeConfidenceThreshold,
}: ModelSelectionProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value as ModelType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Threshold:
          </label>
          <input
            type="number"
            min="0.1"
            max="1"
            step="0.1"
            value={confidenceThreshold}
            onChange={(e) => onChangeConfidenceThreshold(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

export type { ModelType, ModelOption };
