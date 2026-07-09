/**
 * Triggers a browser file download of the given Blob content.
 * 
 * @param blob The binary Blob data to download.
 * @param fileName The default file name for the downloaded file.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;

  // Create temporary object URL from Blob
  const url = window.URL.createObjectURL(blob);
  
  // Create anchor element
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  
  // Temporarily append to DOM to support Firefox triggering
  window.document.body.appendChild(anchor);
  
  // Programmatically trigger download click
  anchor.click();
  
  // Cleanup anchor element and revoke object URL
  window.document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
