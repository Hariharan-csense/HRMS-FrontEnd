import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExpenseData {
  id: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt_url?: string;
  company_id?: number;
}

export class PdfExportService {
  private static instance: PdfExportService;

  static getInstance(): PdfExportService {
    if (!PdfExportService.instance) {
      PdfExportService.instance = new PdfExportService();
    }
    return PdfExportService.instance;
  }

  async exportSingleExpense(expense: ExpenseData): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Beautiful header with subtle gradient
      pdf.setFillColor(70, 130, 180);
      pdf.rect(0, 0, pageWidth, 50, "F");

      pdf.setFillColor(100, 149, 237);
      pdf.rect(0, 35, pageWidth, 30, "F");

      // Header text
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Expense Claim", pageWidth / 2, 25, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Receipt Documentation", pageWidth / 2, 40, { align: "center" });

      yPosition = 70;

      // Employee card with elegant border
      pdf.setDrawColor(70, 130, 180);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 3, 3);

      pdf.setFillColor(248, 251, 255);
      pdf.roundedRect(
        margin + 1,
        yPosition - 4,
        pageWidth - 2 * margin - 2,
        33,
        2,
        2,
        "F",
      );

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 130, 180);
      pdf.text("Employee Details", margin + 10, yPosition + 5);
      yPosition += 12;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Name: ${expense.employeeName}`, margin + 10, yPosition + 5);
      yPosition += 25;

      // Receipt section with elegant styling
      if (expense.receipt_url) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(70, 130, 180);
        pdf.text("Receipt Document", margin, yPosition);
        yPosition += 10;

        if (expense.receipt_url.match(/\.(png|jpg|jpeg|webp)$/i)) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = expense.receipt_url!;
            });

            const maxImgWidth = pageWidth - 2 * margin - 20;
            const maxImgHeight = pageHeight - yPosition - 50;

            let imgWidth = img.width;
            let imgHeight = img.height;

            const scaleX = maxImgWidth / imgWidth;
            const scaleY = maxImgHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY, 1);

            imgWidth *= scale;
            imgHeight *= scale;

            const xPosition = (pageWidth - imgWidth) / 2;

            // Subtle shadow effect
            pdf.setFillColor(0, 0, 0, 15);
            pdf.roundedRect(
              xPosition + 2,
              yPosition + 2,
              imgWidth,
              imgHeight,
              2,
              2,
              "F",
            );

            // Elegant border
            pdf.setDrawColor(70, 130, 180);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(xPosition, yPosition, imgWidth, imgHeight, 2, 2);

            pdf.addImage(
              img,
              "JPEG",
              xPosition,
              yPosition,
              imgWidth,
              imgHeight,
            );
            yPosition += imgHeight + 20;
          } catch (error) {
            // console.log("Could not load receipt image:", error);
            pdf.setFillColor(255, 245, 245);
            pdf.roundedRect(
              margin,
              yPosition - 3,
              pageWidth - 2 * margin,
              20,
              2,
              2,
              "F",
            );
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(220, 53, 69);
            pdf.text(
              "Receipt image could not be loaded",
              margin + 8,
              yPosition + 5,
            );
            yPosition += 20;
          }
        } else {
          pdf.setFillColor(248, 251, 255);
          pdf.roundedRect(
            margin,
            yPosition - 3,
            pageWidth - 2 * margin,
            20,
            2,
            2,
            "F",
          );
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(70, 130, 180);
          pdf.text(
            "Receipt document available (non-image format)",
            margin + 8,
            yPosition + 5,
          );
          yPosition += 20;
        }
      } else {
        pdf.setFillColor(255, 245, 245);
        pdf.roundedRect(
          margin,
          yPosition - 3,
          pageWidth - 2 * margin,
          20,
          2,
          2,
          "F",
        );
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(220, 53, 69);
        pdf.text("No receipt attached", margin + 8, yPosition + 5);
        yPosition += 20;
      }

      // Elegant footer
      const footerY = pageHeight - 30;
      pdf.setFillColor(70, 130, 180);
      pdf.rect(0, footerY, pageWidth, 30, "F");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `Generated on: ${new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth / 2,
        footerY + 12,
        { align: "center" },
      );

      pdf.setFontSize(8);
      pdf.text("HRMS Expense Management System", pageWidth / 2, footerY + 22, {
        align: "center",
      });

      // Save the PDF
      const fileName = `expense_${expense.employeeName.replace(/\s+/g, "_")}_${expense.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  async exportMultipleExpenses(expenses: ExpenseData[]): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Beautiful header with subtle gradient
      pdf.setFillColor(70, 130, 180);
      pdf.rect(0, 0, pageWidth, 50, "F");

      pdf.setFillColor(100, 149, 237);
      pdf.rect(0, 35, pageWidth, 30, "F");

      // Header text
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Expense Claims Report", pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `Total Expenses: ${expenses.length} | Amount: ₹${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`,
        pageWidth / 2,
        35,
        { align: "center" },
      );

      yPosition = 65;

      // Process each expense (one expense per page)
      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];

        if (i > 0) {
          pdf.addPage();
        }

        // Page header
        pdf.setFillColor(70, 130, 180);
        pdf.rect(0, 0, pageWidth, 50, "F");

        pdf.setFillColor(100, 149, 237);
        pdf.rect(0, 35, pageWidth, 30, "F");

        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Expense Claims Report", pageWidth / 2, 22, {
          align: "center",
        });

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Expense ${i + 1} of ${expenses.length}`, pageWidth / 2, 38, {
          align: "center",
        });

        yPosition = 75;

        // Expense summary
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(70, 130, 180);
        pdf.text(`Employee: ${expense.employeeName}`, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Category: ${expense.category}`, margin, yPosition);
        yPosition += 7;
        pdf.text(
          `Amount: ₹${expense.amount.toLocaleString()}`,
          margin,
          yPosition,
        );
        yPosition += 7;
        pdf.text(`Date: ${expense.date}`, margin, yPosition);
        yPosition += 12;

        // Receipt image if available (large, centered)
        if (
          expense.receipt_url &&
          expense.receipt_url.match(/\.(png|jpg|jpeg|webp)$/i)
        ) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = expense.receipt_url!;
            });

            const maxImgWidth = pageWidth - 2 * margin;
            const maxImgHeight = pageHeight - yPosition - 50;

            let imgWidth = img.width;
            let imgHeight = img.height;

            const scaleX = maxImgWidth / imgWidth;
            const scaleY = maxImgHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY, 1);

            imgWidth *= scale;
            imgHeight *= scale;

            const xPosition = (pageWidth - imgWidth) / 2;

            pdf.setFillColor(0, 0, 0, 10);
            pdf.roundedRect(
              xPosition + 2,
              yPosition + 2,
              imgWidth,
              imgHeight,
              2,
              2,
              "F",
            );
            pdf.setDrawColor(70, 130, 180);
            pdf.setLineWidth(1);
            pdf.roundedRect(xPosition, yPosition, imgWidth, imgHeight, 2, 2);

            pdf.addImage(
              img,
              "JPEG",
              xPosition,
              yPosition,
              imgWidth,
              imgHeight,
            );
          } catch (error) {
            // console.log("Could not load receipt image:", error);
            pdf.setFillColor(255, 245, 245);
            pdf.roundedRect(
              margin,
              yPosition - 2,
              pageWidth - 2 * margin,
              22,
              2,
              2,
              "F",
            );
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(220, 53, 69);
            pdf.text(
              "Receipt image could not be loaded",
              margin + 6,
              yPosition + 6,
            );
          }
        } else {
          const statusColor = expense.receipt_url
            ? [70, 130, 180]
            : [220, 53, 69];
          const statusText = expense.receipt_url
            ? "Document available"
            : "No receipt attached";
          const bgColor = expense.receipt_url
            ? [248, 251, 255]
            : [255, 245, 245];

          pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          pdf.roundedRect(
            margin,
            yPosition - 2,
            pageWidth - 2 * margin,
            22,
            2,
            2,
            "F",
          );

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(statusText, margin + 6, yPosition + 6);
        }

        // Footer
        const footerY = pageHeight - 30;
        pdf.setFillColor(70, 130, 180);
        pdf.rect(0, footerY, pageWidth, 30, "F");

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(255, 255, 255);
        pdf.text(
          `Generated on: ${new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          pageWidth / 2,
          footerY + 12,
          { align: "center" },
        );

        pdf.setFontSize(8);
        pdf.text(
          "HRMS Expense Management System",
          pageWidth / 2,
          footerY + 22,
          { align: "center" },
        );
      }

      // Save the PDF
      const fileName = `expense_claims_report_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  async exportTableAsPDF(tableId: string, title: string): Promise<void> {
    try {
      const element = document.getElementById(tableId);
      if (!element) {
        throw new Error("Table element not found");
      }

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating table PDF:", error);
      throw new Error("Failed to generate PDF from table");
    }
  }
}
