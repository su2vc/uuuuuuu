import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import "./app/global.css";
import "./entry/entry.css";
import "./entry/entryBlocked.css";
createRoot(document.getElementById("root")).render(<React.StrictMode>
    <App />
  </React.StrictMode>);
