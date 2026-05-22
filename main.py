import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import qrcode
from PIL import Image

# --- KONFIGURACJA ---
OUTPUT_FILENAME = "Naklejki_Hufiec_Trzebinia.pdf"
TOTAL_STICKERS = 500  # Ile naklejek wygenerować
START_ID = 1          # Od jakiego numeru zacząć

# URL - usuwamy ostatnią cyfrę '1', aby doklejać zmienną w pętli
BASE_URL = "https://forms.office.com/Pages/ResponsePage.aspx?id=Ho024XU55kyJPfw1H9RNzSxpBz6AyaJNo0NTIfN0GNBUNVgzOVBTVE1ZUFdDMlFHTjMxOEJJRFY2WS4u&r6e9f3bdf980d4a21b510d0a9e2af8516="

# Kolory (Zieleń ZHP - przybliżona ciemna zieleń)
ZHP_GREEN = Color(0, 0.4, 0)  # RGB: 0, 102, 0
CUT_LINE_COLOR = Color(0.8, 0.8, 0.8) # Jasny szary do linii cięcia

# Układ strony A4
PAGE_WIDTH, PAGE_HEIGHT = A4
COLS = 3
ROWS = 4
MARGIN_X = 10 * mm
MARGIN_Y = 15 * mm

# Obliczanie wymiarów pojedynczej komórki (naklejki)
CELL_WIDTH = (PAGE_WIDTH - (2 * MARGIN_X)) / COLS
CELL_HEIGHT = (PAGE_HEIGHT - (2 * MARGIN_Y)) / ROWS

# --- REJESTRACJA CZCIONKI Z POLSKIMI ZNAKAMI ---
# ReportLab domyślnie nie ma polskich znaków. Próbujemy załadować Arial.
try:
    # Ścieżka dla Windows
    pdfmetrics.registerFont(TTFont('Arial', 'arial.ttf'))
    FONT_NAME = 'Arial'
    FONT_BOLD_NAME = 'Arial' # Uproszczenie, używamy tej samej, można podpiąć arialbd.ttf dla pogrubienia
except:
    try:
        # Alternatywna ścieżka (np. Linux/Mac) lub inna czcionka
        pdfmetrics.registerFont(TTFont('Arial', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
        FONT_NAME = 'Arial'
    except:
        print("UWAGA: Nie znaleziono czcionki Arial. Polskie znaki mogą się nie wyświetlać poprawnie.")
        FONT_NAME = 'Helvetica' # Fallback (może krzaczyć polskie znaki)

def draw_sticker(c, x, y, width, height, item_id):
    """Rysuje pojedynczą naklejkę w zadanych koordynatach"""
    
    # 1. Linie cięcia (przerywane, jasnoszare) wokół naklejki
    c.setStrokeColor(CUT_LINE_COLOR)
    c.setLineWidth(0.5)
    c.setDash(4, 4) # Linia przerywana
    c.rect(x, y, width, height)
    c.setDash(1, 0) # Reset linii do ciągłej

    # Marginesy wewnętrzne w naklejce, żeby tekst nie dotykał linii cięcia
    padding = 5 * mm
    content_x = x + padding
    content_y = y + padding
    content_w = width - 2*padding
    content_h = height - 2*padding

    # 2. Ramka ozdobna (Zielona, zaokrąglona)
    c.setStrokeColor(ZHP_GREEN)
    c.setLineWidth(2)
    # roundRect(x, y, width, height, radius)
    c.roundRect(content_x, content_y, content_w, content_h, 4*mm, stroke=1, fill=0)

    # 3. Tekst nagłówka
    c.setFillColor(ZHP_GREEN)
    c.setFont(FONT_NAME, 10) # Rozmiar czcionki
    c.drawCentredString(x + width/2, y + height - 12*mm, "Własność Hufca Trzebinia")

    # 4. Generowanie Kodu QR
    # Tworzymy pełny URL
    full_url = f"{BASE_URL}{item_id}"
    
    qr = qrcode.QRCode(box_size=10, border=0)
    qr.add_data(full_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Zapis QR do tymczasowego pliku lub bufora nie jest konieczny w nowszym reportlab,
    # ale najbezpieczniej przekonwertować go na ImageReader
    # Obliczamy pozycję i rozmiar QR (ma być na środku)
    qr_size = 35 * mm
    qr_x = x + (width - qr_size) / 2
    qr_y = y + (height - qr_size) / 2 + 2*mm # Lekko do góry
    
    c.drawInlineImage(img, qr_x, qr_y, width=qr_size, height=qr_size)

    # 5. Tekst stopki (ID)
    c.setFillColor(ZHP_GREEN) # Lub czarny, jeśli wolisz
    c.setFont(FONT_NAME, 12)
    # Tekst statyczny
    c.setFont(FONT_NAME, 8)
    c.drawCentredString(x + width/2, y + 14*mm, "Identyfikator przedmiotu:")
    
    # Sam numer (większy)
    c.setFont(FONT_NAME, 18)
    c.drawCentredString(x + width/2, y + 6*mm, str(item_id))

def generate_pdf():
    c = canvas.Canvas(OUTPUT_FILENAME, pagesize=A4)
    c.setTitle("Naklejki Inwentaryzacyjne")
    
    print(f"Rozpoczynam generowanie {TOTAL_STICKERS} naklejek...")
    
    current_id = START_ID
    stickers_processed = 0
    
    while stickers_processed < TOTAL_STICKERS:
        # Pętla po rzędach i kolumnach na jednej stronie
        # Rysujemy od góry do dołu (Y maleje), od lewej do prawej
        for row in range(ROWS):
            for col in range(COLS):
                if stickers_processed >= TOTAL_STICKERS:
                    break
                
                # Obliczanie pozycji X i Y (lewy dolny róg naklejki)
                # Y jest liczony od dołu strony
                pos_x = MARGIN_X + (col * CELL_WIDTH)
                pos_y = PAGE_HEIGHT - MARGIN_Y - ((row + 1) * CELL_HEIGHT)
                
                draw_sticker(c, pos_x, pos_y, CELL_WIDTH, CELL_HEIGHT, current_id)
                
                current_id += 1
                stickers_processed += 1
        
        # Jeśli nie skończyliśmy, dodajemy nową stronę
        if stickers_processed < TOTAL_STICKERS:
            c.showPage()
            print(f"Generuję stronę... (Postęp: {stickers_processed}/{TOTAL_STICKERS})")

    c.save()
    print(f"Gotowe! Plik zapisano jako: {OUTPUT_FILENAME}")

if __name__ == "__main__":
    generate_pdf()
