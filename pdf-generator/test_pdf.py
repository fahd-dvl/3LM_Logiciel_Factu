# test_pdf.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import os
from config import OUTPUT_DIR

def generate_test_pdf():
    filepath = os.path.join(OUTPUT_DIR, "test.pdf")
    c = canvas.Canvas(filepath, pagesize=A4)
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 800, "Test génération PDF")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 770, "Si tu vois ce texte, ReportLab fonctionne correctement.")
    
    c.save()
    print(f"PDF généré : {filepath}")

if __name__ == "__main__":
    generate_test_pdf()