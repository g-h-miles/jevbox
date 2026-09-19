import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "./style.css";
import BeatGenerator from "./BeatGenerator";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BeatGenerator />
  </React.StrictMode>,
);
