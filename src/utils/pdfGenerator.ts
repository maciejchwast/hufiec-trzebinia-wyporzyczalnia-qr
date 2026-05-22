import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface StickerConfig {
  headerText: string;
  themeColor: string; // Hex color
  totalStickers: number;
  startId: number;
  baseUrl: string;
}

export async function generateStickersPDF(config: StickerConfig): Promise<void> {
  // A4 dimensions in mm
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  
  const COLS = 3;
  const ROWS = 4;
  const MARGIN_X = 10;
  const MARGIN_Y = 15;
  
  const CELL_WIDTH = (PAGE_WIDTH - (2 * MARGIN_X)) / COLS;
  const CELL_HEIGHT = (PAGE_HEIGHT - (2 * MARGIN_Y)) / ROWS;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set default font
  pdf.setFont('helvetica');

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const themeRgb = hexToRgb(config.themeColor);
  
  let currentId = config.startId;
  let stickersProcessed = 0;
  
  while (stickersProcessed < config.totalStickers) {
    if (stickersProcessed > 0) {
      pdf.addPage();
    }
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (stickersProcessed >= config.totalStickers) {
          break;
        }
        
        const x = MARGIN_X + (col * CELL_WIDTH);
        const y = MARGIN_Y + (row * CELL_HEIGHT);
        
        await drawSticker(pdf, x, y, CELL_WIDTH, CELL_HEIGHT, currentId, config, themeRgb);
        
        currentId++;
        stickersProcessed++;
      }
    }
  }
  
  pdf.save('Naklejki_Hufiec_Trzebinia.pdf');
}

async function drawSticker(
  pdf: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  itemId: number, 
  config: StickerConfig,
  themeRgb: [number, number, number]
) {
  // 1. Cut line (dashed, light gray)
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.setLineDashPattern([4, 4], 0);
  pdf.rect(x, y, width, height);
  pdf.setLineDashPattern([], 0); // reset
  
  // Padding
  const padding = 5;
  const contentX = x + padding;
  const contentY = y + padding;
  const contentW = width - 2 * padding;
  const contentH = height - 2 * padding;
  
  // 2. Decorative frame (Theme color, rounded)
  pdf.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]);
  pdf.setLineWidth(1);
  pdf.roundedRect(contentX, contentY, contentW, contentH, 4, 4, 'S');
  
  // 3. Header text
  pdf.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
  pdf.setFontSize(9);
  pdf.text(config.headerText, x + width / 2, y + 12, { align: 'center' });
  
  // 4. Generate QR Code
  const fullUrl = `${config.baseUrl}${itemId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(fullUrl, {
      errorCorrectionLevel: 'M',
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    const qrSize = 35;
    const qrX = x + (width - qrSize) / 2;
    const qrY = y + (height - qrSize) / 2 - 2; // slightly up
    
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('QR Code generation failed', err);
  }
  
  // 5. Footer text (ID)
  pdf.setFontSize(7);
  pdf.text("Identyfikator przedmiotu:", x + width / 2, y + height - 14, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.text(String(itemId), x + width / 2, y + height - 6, { align: 'center' });
}
