import { createRoot } from "react-dom/client";
import PWAWrapper from "./PWAWrapper";
import "./index.css";

// Simplified initialization with PWA wrapper
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('FitAI: Root element not found');
} else {
  console.log('FitAI: Starting app with PWA wrapper');
  createRoot(rootElement).render(<PWAWrapper />);
}
