import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";

import { FormFieldsDetection } from "./FormFieldsDetection";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FormFieldsDetection />
  </StrictMode>
);
