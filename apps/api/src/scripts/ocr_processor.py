import sys
import json
import os

def parse_text_to_cards(text):
    cards = []
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check separators: ':', '=', '-'
        separator = None
        for sep in [':', '=', '-']:
            if sep in line:
                separator = sep
                break
                
        if separator:
            parts = line.split(separator, 1)
            front = parts[0].strip()
            back = parts[1].strip()
            
            # Clean possible markdown bold stars etc.
            front = front.replace('**', '').replace('__', '').strip()
            back = back.replace('**', '').replace('__', '').strip()
            
            if front and back:
                cards.append({
                    "front": front,
                    "back": back
                })
    return cards

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided."}))
        return

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File {file_path} does not exist."}))
        return

    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    # Image files handling (OCR)
    if ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp']:
        try:
            from PIL import Image
            import pytesseract
            
            # Try to run pytesseract
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img, lang='vie+eng')
        except ImportError:
            # Return error signal for local node fallback OCR to handle extraction
            print(json.dumps({"success": False, "error": "dependencies_missing", "details": "Python libraries 'Pillow' or 'pytesseract' are not installed."}))
            return
        except Exception as e:
            # If py-ocr fails, return error so node can attempt fallback
            print(json.dumps({"success": False, "error": "ocr_failed", "details": str(e)}))
            return
    else:
        # Text files handling (.txt, .md, etc.)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Read text file failed: {str(e)}"}))
            return

    cards = parse_text_to_cards(text)
    print(json.dumps({"success": True, "cards": cards, "raw_text": text}))

if __name__ == '__main__':
    main()
