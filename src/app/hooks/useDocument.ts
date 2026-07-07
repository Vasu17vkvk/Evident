import { useContext } from "react";
import { DocumentContext } from "../context/DocumentContext";

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocument must be used inside <DocumentProvider>");
  return ctx;
}
