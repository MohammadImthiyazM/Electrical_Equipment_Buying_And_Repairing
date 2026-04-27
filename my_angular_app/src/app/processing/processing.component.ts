import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './processing.component.html',
  styleUrls: ['./processing.component.css']
})
export class ProcessingComponent implements OnInit {
  isProcessing: boolean = true;
  order: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.order = history.state.order;
    console.log('ProcessingComponent order:', this.order);
    if (!this.order || !this.order.orderId) {
      console.warn('No order data, redirecting to home');
      this.router.navigate(['/home']);
      return;
    }
    setTimeout(() => {
      this.isProcessing = false;
    }, 3000);
  }

  generatePDF(): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set background color (light gray)
    doc.setFillColor(245, 245, 245); // RGB: #F5F5F5
    doc.rect(0, 0, 210, 297, 'F');

    // Watermark (centered with cross effect)
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Watermark text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(40);
    doc.setTextColor(220, 220, 220); // Very Light Gray for watermark
    const watermarkText = 'Electrical Equipment Hub';
    const textWidth = doc.getTextWidth(watermarkText);
    doc.text(watermarkText, centerX - (textWidth / 2), centerY);

    // Cross lines
    doc.setDrawColor(220, 220, 220); // Match watermark color
    doc.setLineWidth(0.5);
    // Horizontal line
    doc.line(centerX - 30, centerY, centerX + 30, centerY);
    // Vertical line
    doc.line(centerX, centerY - 20, centerX, centerY + 20);

    // Header with Underline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(26, 115, 232); // Blue: #1A73E8
    doc.text('Electrical Equipment Hub', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100); // Gray
    doc.text('Order Receipt', 20, 28);
    // Decorative Underline for Header
    doc.setDrawColor(26, 115, 232);
    doc.setLineWidth(1);
    doc.line(20, 30, 70, 30);
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 50, 32);

    // Delivery Details (Top-Right, Bold)
    doc.setFont('helvetica', 'bold'); // Set to bold
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const deliveryLines = [
      'Delivery Details:',
      `Address: ${this.order.deliveryDetails.address}`,
      `Phone: ${this.order.deliveryDetails.phone}`
    ];
    const maxWidth = 80;
    let y = 15;
    deliveryLines.forEach(line => {
      const splitText = doc.splitTextToSize(line, maxWidth);
      splitText.forEach((text: string) => {
        doc.text(text, 210 - 20 - maxWidth, y);
        y += 5;
      });
    });

    // Order Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ID: ${this.order.orderId.slice(-6)}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 52);
    doc.text(`Customer: ${this.order.username}`, 20, 59);

    // Payment Mode
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let paymentY = 66;
    doc.text(`Payment Mode: ${this.order.paymentMode === 'card' ? 'Card' : 'Cash on Delivery'}`, 20, paymentY);
    if (this.order.paymentMode === 'card') {
      paymentY += 6;
      doc.text(`Card: ${this.order.paymentDetails.name} (****${this.order.paymentDetails.cardNumber.slice(-4)})`, 20, paymentY);
    }

    // Decorative Line
    doc.setDrawColor(26, 115, 232);
    doc.setLineWidth(0.5);
    doc.line(20, paymentY + 5, 190, paymentY + 5);

    // Define table configuration
    const tableStartY = paymentY + 15;
    const tableStyles = {
      font: 'helvetica',
      cellPadding: 2,
      minCellHeight: 8
    };
    const tableColumnStyles = {
      0: { cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 }
    };

    // Products Table using jspdf-autotable
    autoTable(doc, {
      startY: tableStartY,
      head: [['No.', 'Product Name', 'Qty', 'Price (Rs.)', 'Subtotal (Rs.)']],
      body: this.order.cartItems.map((item: any, index: number) => [
        `${index + 1}`,
        item.name,
        `${item.quantity}`,
        `${item.price.toFixed(2)}`,
        `${(item.price * item.quantity).toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [25, 118, 210], // Darker Blue: #1976D2
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 10,
        fillColor: false // No background color
      },
      styles: tableStyles,
      columnStyles: tableColumnStyles,
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        // Calculate table dimensions using the defined configuration
        const rowCount = data.table.body.length + 1; // +1 for header
        const rowHeight = tableStyles.minCellHeight || 8;
        const tableHeight = rowCount * rowHeight;

        // Calculate table width from columnStyles
        const tableWidth = Object.values(tableColumnStyles)
          .reduce((sum: number, col: any) => sum + (col.cellWidth || 0), 0);

        // Draw border around the table
        const startX = (data.settings as any).margin.left;
        const startY = (data.settings as any).startY;
        doc.setDrawColor(26, 115, 232);
        doc.setLineWidth(0.5);
        doc.rect(startX - 2, startY - 2, tableWidth + 4, tableHeight + 4);
      }
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY;

    // Totals
    let currentY = finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Subtotal: Rs. ${this.order.totalPrice.toFixed(2)}`, 140, currentY);
    currentY += 8;
    if (this.order.paymentMode === 'cod') {
      doc.text(`Delivery Charge: Rs. ${this.order.deliveryCharge.toFixed(2)}`, 140, currentY);
      currentY += 8;
    }
    doc.setFontSize(14);
    doc.setTextColor(26, 115, 232);
    doc.text(`Final Total: Rs. ${this.order.finalTotal.toFixed(2)}`, 140, currentY);

    // Footer with Enhanced Graphics
    doc.setDrawColor(26, 115, 232);
    doc.setLineWidth(0.5);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('Electrical Equipment Hub - Powering Your World', 20, 280);
    doc.setFont('helvetica', 'normal');
    doc.text('Contact: support@eehub.com | Phone: +91 1234567890', 20, 286);
    doc.text('© 2025 All Rights Reserved', 20, 292);
    doc.setFillColor(26, 115, 232);
    doc.circle(17, 279, 1, 'F');

    return doc;
  }

  viewPDF() {
    const doc = this.generatePDF();
    const pdfDataUri = doc.output('datauristring');
    const newTab = window.open();
    if (newTab) {
      newTab.document.write('<iframe src="' + pdfDataUri + '" width="100%" height="100%"></iframe>');
    } else {
      console.error('Failed to open new tab for PDF view');
    }
  }

  downloadPDF() {
    const doc = this.generatePDF();
    doc.save(`order_${this.order.orderId.slice(-6)}_receipt.pdf`);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}