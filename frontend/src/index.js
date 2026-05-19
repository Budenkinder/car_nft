import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ThemeModeProvider } from "./theme/ThemeModeContext";

ReactDOM.render(
  <ThemeModeProvider>
    <App />
  </ThemeModeProvider>,
  document.getElementById("root")
);
