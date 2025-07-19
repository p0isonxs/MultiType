//main.tsx
import React, { StrictMode } from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#111",
                color: "#fff",
                border: "1px solid #444",
                fontFamily: "monospace",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#000",
                },
              },
              error: {
                iconTheme: {
                  primary: "#F43F5E",
                  secondary: "#000",
                },
              },
            }}
          />

          <App />
        </>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
