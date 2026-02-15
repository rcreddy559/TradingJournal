import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { JournalProvider } from "./features/journal/store/journalContext";
import "./shared/styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JournalProvider>
      <App />
    </JournalProvider>
  </React.StrictMode>
);
