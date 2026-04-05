from flask import Blueprint, request, jsonify
from datetime import datetime

ocr_bp = Blueprint('ocr', __name__)

@ocr_bp.route('/image', methods=['POST'])
def process_image():
    """Process image and extract text (simulated OCR)"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Simulate OCR processing
        # In production, this would use Tesseract or other OCR tools
        extracted_text = f"OCR extracted text from image: {file.filename}\n"
        extracted_text += "This is a simulated OCR response.\n"
        extracted_text += "In production, integrate with Tesseract or cloud OCR services."
        
        return jsonify({
            'success': True,
            'data': {
                'filename': file.filename,
                'extractedText': extracted_text,
                'confidence': 0.85,
                'processedAt': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@ocr_bp.route('/pdf', methods=['POST'])
def process_pdf():
    """Process PDF and extract text (simulated OCR)"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Simulate PDF text extraction
        # In production, this would use PyPDF2 or pdfplumber
        extracted_text = f"PDF text extracted from: {file.filename}\n"
        extracted_text += "This is a simulated PDF extraction response.\n"
        extracted_text += "In production, integrate with PyPDF2 or pdfplumber."
        
        return jsonify({
            'success': True,
            'data': {
                'filename': file.filename,
                'extractedText': extracted_text,
                'pageCount': 1,
                'processedAt': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@ocr_bp.route('/extract', methods=['POST'])
def extract_from_file():
    """Extract text from any supported file"""
    try:
        data = request.get_json()
        file_path = data.get('filePath')
        file_type = data.get('fileType')
        
        if not file_path:
            return jsonify({
                'success': False,
                'message': 'No file path provided'
            }), 400
        
        # Simulate extraction based on file type
        if file_type == 'application/pdf':
            extracted_text = f"Extracted text from PDF: {file_path}"
        elif file_type and file_type.startswith('image/'):
            extracted_text = f"Extracted text from image: {file_path}"
        else:
            extracted_text = f"Extracted text from file: {file_path}"
        
        return jsonify({
            'success': True,
            'data': {
                'filePath': file_path,
                'fileType': file_type,
                'extractedText': extracted_text,
                'processedAt': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
