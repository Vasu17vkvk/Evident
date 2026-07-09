import { jsPDF } from "jspdf";
import { ExportOptions, ExportResult, ExportFormat, ExportPayload } from "../../types/export";

export class PDFExportService {
  async export(payload: ExportPayload, options?: ExportOptions): Promise<ExportResult> {
    const fileName = options?.fileName || `${payload.document.name.replace(/\.[^/.]+$/, "")}_export.pdf`;

    // Initialize portrait A4 document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageTracker = { pageNum: 1 };
    const maxY = 275; // Maximum Y coordinate before page break

    // ─── 1. TITLE PAGE ───
    this.drawTitlePage(doc, payload);

    // ─── 2. CONTENT PAGES ───
    doc.addPage();
    pageTracker.pageNum++;
    this.drawPageHeader(doc);
    let y = 30; // Start position below page header

    // 2.1 Metadata Section
    if (payload.metadata) {
      y = this.drawSectionHeader(doc, "Metadata", y, maxY, pageTracker);
      const meta = payload.metadata;
      const metadataFields = [
        { label: "Title", value: meta.title },
        { label: "Author", value: meta.author },
        { label: "Category", value: meta.documentCategory },
        { label: "Language", value: meta.language },
        { label: "Page Count", value: meta.pageCount },
        { label: "Word Count", value: meta.wordCount },
        { label: "Character Count", value: meta.characterCount },
      ];

      for (const field of metadataFields) {
        if (field.value !== undefined && field.value !== null) {
          y = this.drawText(
            doc,
            `- ${field.label}: ${field.value}`,
            20,
            y,
            11,
            false,
            [40, 40, 40],
            maxY,
            pageTracker
          );
          y += 2; // spacing
        }
      }
      y += 6; // section spacing
    }

    // 2.2 Statistics Section
    if (payload.statistics) {
      y = this.drawSectionHeader(doc, "Statistics", y, maxY, pageTracker);
      const stats = payload.statistics;
      const statFields = [
        { label: "Words", value: stats.words },
        { label: "Characters", value: stats.characters },
        { label: "Paragraphs", value: stats.paragraphs },
        { label: "Sentences", value: stats.sentences },
        { label: "Average Sentence Length", value: stats.averageSentenceLength },
        { label: "Reading Time", value: stats.readingTime ? `${stats.readingTime} minutes` : undefined },
      ];

      for (const field of statFields) {
        if (field.value !== undefined && field.value !== null) {
          y = this.drawText(
            doc,
            `- ${field.label}: ${field.value}`,
            20,
            y,
            11,
            false,
            [40, 40, 40],
            maxY,
            pageTracker
          );
          y += 2;
        }
      }
      y += 6;
    }

    // 2.3 Summary & Insights Section
    if (payload.insights) {
      y = this.drawSectionHeader(doc, "Summary & Insights", y, maxY, pageTracker);
      
      y = this.drawText(doc, "Executive Summary:", 20, y, 12, true, [10, 10, 10], maxY, pageTracker);
      y += 1;
      y = this.drawText(doc, payload.insights.executiveSummary || "N/A", 20, y, 10, false, [60, 60, 60], maxY, pageTracker);
      y += 4;

      y = this.drawText(doc, "Document Purpose:", 20, y, 12, true, [10, 10, 10], maxY, pageTracker);
      y += 1;
      y = this.drawText(doc, payload.insights.documentPurpose || "N/A", 20, y, 10, false, [60, 60, 60], maxY, pageTracker);
      y += 5;

      if (payload.insights.keyTopics && payload.insights.keyTopics.length > 0) {
        y = this.drawText(doc, "Key Topics:", 20, y, 12, true, [10, 10, 10], maxY, pageTracker);
        y += 2;
        for (const topic of payload.insights.keyTopics) {
          y = this.drawText(doc, `• ${topic}`, 23, y, 10, false, [60, 60, 60], maxY, pageTracker);
          y += 1.5;
        }
        y += 4;
      }

      // 2.4 Entities
      if (payload.insights.entities) {
        y = this.drawSectionHeader(doc, "Entities Mentioned", y, maxY, pageTracker);
        const { people, organizations, locations } = payload.insights.entities;

        if (people && people.length > 0) {
          y = this.drawText(doc, "People:", 20, y, 11, true, [10, 10, 10], maxY, pageTracker);
          y += 2;
          for (const p of people.slice(0, 10)) {
            const roleStr = p.role ? ` (${p.role})` : "";
            y = this.drawText(doc, `• ${p.name}${roleStr} - ${p.mentions} mentions`, 23, y, 9.5, false, [60, 60, 60], maxY, pageTracker);
            y += 1.5;
          }
          y += 3;
        }

        if (organizations && organizations.length > 0) {
          y = this.drawText(doc, "Organizations:", 20, y, 11, true, [10, 10, 10], maxY, pageTracker);
          y += 2;
          for (const org of organizations.slice(0, 10)) {
            const roleStr = org.role ? ` (${org.role})` : "";
            y = this.drawText(doc, `• ${org.name}${roleStr} - ${org.mentions} mentions`, 23, y, 9.5, false, [60, 60, 60], maxY, pageTracker);
            y += 1.5;
          }
          y += 3;
        }

        if (locations && locations.length > 0) {
          y = this.drawText(doc, "Locations:", 20, y, 11, true, [10, 10, 10], maxY, pageTracker);
          y += 2;
          for (const loc of locations.slice(0, 10)) {
            y = this.drawText(doc, `• ${loc.name} - ${loc.mentions} mentions`, 23, y, 9.5, false, [60, 60, 60], maxY, pageTracker);
            y += 1.5;
          }
          y += 3;
        }
      }

      // 2.5 Timeline
      if (payload.insights.timeline && payload.insights.timeline.length > 0) {
        y = this.drawSectionHeader(doc, "Key Events & Timeline", y, maxY, pageTracker);
        for (const event of payload.insights.timeline) {
          y = this.drawText(doc, `${event.date} - ${event.title} (Page ${event.page})`, 20, y, 10.5, true, [10, 10, 10], maxY, pageTracker);
          y += 1;
          y = this.drawText(doc, event.description, 23, y, 9.5, false, [70, 70, 70], maxY, pageTracker);
          y += 4;
        }
      }
    }

    // 2.6 Raw Document Content (Optional)
    if (options?.includeContent) {
      y = this.drawSectionHeader(doc, "Full Document Content", y, maxY, pageTracker);
      const pages = payload.document.content?.textPages || payload.document.pagesContent || [];
      pages.forEach((pageText, idx) => {
        y = this.drawText(doc, `Page ${idx + 1}`, 20, y, 11, true, [10, 10, 10], maxY, pageTracker);
        y += 2;
        const cleanText = pageText.replace(/<[^>]*>/g, "");
        y = this.drawText(doc, cleanText, 20, y, 9.5, false, [70, 70, 70], maxY, pageTracker);
        y += 6;
      });
    }

    // ─── 3. PAGE NUMBERING FOOTER ───
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Skip page number on Title Page (Page 1)
      if (i === 1) continue;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text(`Page ${i} of ${totalPages}`, 105, 287, { align: "center" });
    }

    // Convert output into a raw Blob
    const content = doc.output("blob");

    return {
      content,
      mimeType: "application/pdf",
      fileName,
      format: ExportFormat.PDF,
    };
  }

  // Draw the Cover Title Page
  private drawTitlePage(doc: jsPDF, payload: ExportPayload) {
    // Black Top Header Banner (y=0 to y=60)
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 60, "F");

    // Orange Accent Line (y=60 to y=64)
    doc.setFillColor(255, 61, 0); // Evident Orange #ff3d00
    doc.rect(0, 60, 210, 4, "F");

    // Logo / Brand title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("EVIDENT", 20, 32);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("AUTOMATED DOCUMENT INSIGHTS EXPORT", 20, 44);

    // Title Page Content Area (White background)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(15, 15, 15);
    const wrappedTitle = doc.splitTextToSize(payload.document.name, 170);
    doc.text(wrappedTitle, 20, 105);

    // Muted subtitle details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text(`Document Size: ${payload.document.size.toLocaleString()} bytes`, 20, 150);
    doc.text(`Export Schema Version: ${payload.version}`, 20, 157);
    doc.text(`Generated At: ${payload.generatedAt}`, 20, 164);

    // Branding Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 250, 210, 47, "F");

    doc.setFillColor(255, 61, 0);
    doc.rect(0, 250, 210, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Evident AI Document Engine", 20, 270);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text("This PDF contains extracted metadata, text insights, entity lists, and timeline parameters.", 20, 278);
  }

  // Draw Page Header Banner for regular pages
  private drawPageHeader(doc: jsPDF) {
    // Black thin top bar
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 14, "F");

    // Orange thin line
    doc.setFillColor(255, 61, 0);
    doc.rect(0, 14, 210, 1.5, "F");

    // Running Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("EVIDENT DOCUMENT ANALYSIS", 20, 9);
  }

  // Draws a Section Header, checking if it requires a page break first
  private drawSectionHeader(
    doc: jsPDF,
    title: string,
    y: number,
    maxY: number,
    pageTracker: { pageNum: number }
  ): number {
    const spaceNeeded = 18; // space for heading, spacing, and first lines
    let currentY = y;

    if (currentY + spaceNeeded > maxY) {
      doc.addPage();
      pageTracker.pageNum++;
      this.drawPageHeader(doc);
      currentY = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 15, 15);
    doc.text(title, 20, currentY);

    // Section Underline (Orange accent)
    doc.setFillColor(255, 61, 0);
    doc.rect(20, currentY + 2, 25, 0.8, "F");

    return currentY + 10;
  }

  // Helper to draw text and handle automatic page wrapping
  private drawText(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    isBold: boolean,
    textColor: [number, number, number],
    maxY: number,
    pageTracker: { pageNum: number }
  ): number {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const lines = doc.splitTextToSize(text, 170); // content boundary margin width
    const lineHeight = fontSize * 0.45; // pt to mm scaling factor
    
    let currentY = y;
    for (const line of lines) {
      if (currentY + lineHeight > maxY) {
        doc.addPage();
        pageTracker.pageNum++;
        this.drawPageHeader(doc);
        currentY = 30; // Reset content start coordinate

        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      }
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }
}
