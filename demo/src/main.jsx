import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
// Keep the established cascade deterministic, including across lazy chunks.
import "./opening.css";
import "./entry.css";
import "./memories.css";
import "./styles.css";
createRoot(document.getElementById("root")).render(<React.StrictMode>
    <App />
  </React.StrictMode>);
