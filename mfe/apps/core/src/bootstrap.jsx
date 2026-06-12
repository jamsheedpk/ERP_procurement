// Standalone entry — lets this remote run on its own at :5105 for isolated dev.
// When loaded inside the shell, the shell already provides the theme/UI styles.
import React from "react";
import { createRoot } from "react-dom/client";
import "@meridian/theme/theme.css";
import "@meridian/ui/styles.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
