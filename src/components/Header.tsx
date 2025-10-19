export function Header() {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-between">
          Browser-based PDF form fields detection
          <iframe
            src="https://ghbtns.com/github-btn.html?user=SimplePDF&repo=commonforms-in-browser&type=star&count=true&size=large"
            width="150"
            height="30"
            title="GitHub"
          ></iframe>
        </h1>
        <p className="text-gray-600 text-lg">
          Automatically detect form fields in PDFs with CommonForms using ONNX
          Runtime Web
        </p>
        <div className="flex gap-2 mt-4">
          <a
            href="https://github.com/jbarrow/commonforms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-medium border border-sky-200 hover:bg-sky-200 transition-colors cursor-pointer"
          >
            CommonForms
          </a>
          <a
            href="https://onnxruntime.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200 hover:bg-emerald-200 transition-colors cursor-pointer"
          >
            ONNX Runtime Web
          </a>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium border border-indigo-200">
            Runs in Browser
          </span>
          <a
            href="https://simplepdf.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity cursor-pointer"
            style={{
              backgroundColor: "#e6effe",
              color: "#2448a8",
              borderColor: "#b3ccfc",
            }}
          >
            SimplePDF
          </a>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
          <h3 className="text-lg font-semibold text-sky-900 mb-2">
            About CommonForms
          </h3>
          <p className="text-sky-800 text-sm">
            <a
              href="https://github.com/jbarrow/commonforms"
              className="text-sky-900 hover:text-sky-700 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              CommonForms
            </a>{" "}
            by{" "}
            <a
              href="https://x.com/barrowjoseph"
              className="text-sky-900 hover:text-sky-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Joe Barrow
            </a>{" "}
            uses FFDNet models trained on a large dataset of forms to
            automatically detect text boxes, checkboxes, and signature fields in
            PDF documents.
          </p>
          <a
            href="https://arxiv.org/abs/2509.16506"
            className="inline-block mt-3 text-sky-900 hover:text-sky-700 underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Arxiv paper
          </a>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">
            How it works
          </h3>
          <ul className="text-emerald-800 text-sm space-y-1">
            <li>
              • YOLO-based detection with{" "}
              <a
                href="https://onnxruntime.ai/"
                className="text-emerald-900 hover:text-emerald-700 underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                ONNX Runtime
              </a>
            </li>
            <li>• Detect and add the relevant PDF acrofields</li>
            <li>• Runs entirely in the browser</li>
            <li>• Fill or Download or the resulting PDF</li>
          </ul>
        </div>
      </div>
    </>
  );
}
