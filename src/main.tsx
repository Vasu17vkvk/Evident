
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);



import { healthCheck } from "./services/api/api";

healthCheck()
  .then((data) => {
    console.log("[FASTAPI]", data);
  })
  .catch((err) => {
    console.error("[FASTAPI_ERROR]", err);
  });