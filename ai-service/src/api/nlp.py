from flask import Blueprint, request, jsonify
from datetime import datetime
import re
import json

nlp_bp = Blueprint('nlp', __name__)

# NLP Processing functions using rule-based approach
class NLPProcessor:
    """Rule-based NLP processor for medico-legal document analysis"""
    
    # Medical keywords dictionary
    MEDICAL_TERMS = {
        'injury': ['injury', 'wound', 'fracture', 'bleeding', 'trauma', 'contusion', 'laceration', 'burn'],
        'treatment': ['treatment', 'medication', 'surgery', 'therapy', 'bandage', 'dressing', 'immobilization'],
        'diagnosis': ['diagnosis', 'condition', 'prognosis', 'finding', 'assessment'],
        'body_parts': ['head', 'chest', 'abdomen', 'limb', 'arm', 'leg', 'face', 'spine']
    }
    
    CASE_TYPES = {
        'Accident': ['accident', 'road accident', 'traffic', 'collision', 'crash'],
        'Assault': ['assault', 'attack', 'violence', 'beat', 'hit'],
        'Medical Malpractice': ['medical negligence', 'wrong treatment', 'surgical error'],
        'Suicide Attempt': ['suicide', 'self-harm', 'overdose', 'attempted'],
        'Other': []
    }
    
    @staticmethod
    def extract_entities(text):
        """Extract entities from text using rule-based approach"""
        entities = {
            'patient_name': None,
            'hospital_name': None,
            'dates': [],
            'case_type': None,
            'injury': None,
            'keywords': []
        }
        
        # Extract potential names (capitalized words that might be names)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'
        potential_names = re.findall(name_pattern, text)
        
        # Filter out common words
        stopwords = ['The', 'This', 'That', 'Patient', 'Doctor', 'Hospital', 'Medical', 'Case']
        entities['patient_name'] = next((n for n in potential_names if n not in stopwords), None)
        
        # Extract dates
        date_pattern = r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b'
        entities['dates'] = re.findall(date_pattern, text)
        
        # Detect case type
        text_lower = text.lower()
        for case_type, keywords in NLPProcessor.CASE_TYPES.items():
            for keyword in keywords:
                if keyword in text_lower:
                    entities['case_type'] = case_type
                    break
            if entities['case_type']:
                break
        
        if not entities['case_type']:
            entities['case_type'] = 'Other'
        
        # Extract injury description
        injury_keywords = []
        for category, terms in NLPProcessor.MEDICAL_TERMS.items():
            for term in terms:
                if term in text_lower:
                    injury_keywords.append(term)
        
        entities['injury'] = ', '.join(injury_keywords) if injury_keywords else 'Not specified'
        entities['keywords'] = list(set(injury_keywords))
        
        return entities
    
    @staticmethod
    def analyze_text(text):
        """Analyze text and extract insights"""
        words = text.split()
        
        # Calculate basic statistics
        word_count = len(words)
        sentence_count = len(re.split(r'[.!?]+', text))
        
        # Extract keywords
        keywords = []
        text_lower = text.lower()
        for category, terms in NLPProcessor.MEDICAL_TERMS.items():
            for term in terms:
                if term in text_lower:
                    keywords.append(term)
        
        # Determine sentiment (simple approach based on keywords)
        positive_words = ['stable', 'improving', 'good', 'recovered', 'healing']
        negative_words = ['critical', 'severe', 'serious', 'dangerous', 'worsening']
        
        sentiment = 'neutral'
        for word in words:
            if word.lower() in positive_words:
                sentiment = 'positive'
                break
            elif word.lower() in negative_words:
                sentiment = 'negative'
                break
        
        return {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'keywords': list(set(keywords)),
            'sentiment': sentiment,
            'summary': text[:200] + '...' if len(text) > 200 else text
        }

# Initialize processor
processor = NLPProcessor()

@nlp_bp.route('/extract', methods=['POST'])
def extract_entities():
    """Extract entities from text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        entities = processor.extract_entities(text)
        
        return jsonify({
            'success': True,
            'data': {
                'caseType': entities['case_type'],
                'injury': entities['injury'],
                'keywords': entities['keywords'],
                'extractedData': {
                    'patientName': entities['patient_name'],
                    'hospitalName': entities['hospital_name'],
                    'date': entities['dates'][0] if entities['dates'] else datetime.now().isoformat(),
                    'notes': ''
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@nlp_bp.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze text content"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        analysis = processor.analyze_text(text)
        
        return jsonify({
            'success': True,
            'data': {
                'wordCount': analysis['word_count'],
                'sentenceCount': analysis['sentence_count'],
                'keywords': analysis['keywords'],
                'sentiment': analysis['sentiment'],
                'summary': analysis['summary'],
                'extractedEntities': processor.extract_entities(text)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@nlp_bp.route('/classify', methods=['POST'])
def classify_document():
    """Classify document type"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        # Simple classification based on keywords
        text_lower = text.lower()
        
        doc_type = 'General'
        
        if any(word in text_lower for word in ['autopsy', 'post mortem', 'pm']):
            doc_type = 'Post Mortem'
        elif any(word in text_lower for word in ['medical certificate', 'mc']):
            doc_type = 'Medical Certificate'
        elif any(word in text_lower for word in ['injury', 'wound', 'fracture']):
            doc_type = 'Injury Report'
        elif any(word in text_lower for word in ['treatment', 'discharge']):
            doc_type = 'Treatment Record'
        
        return jsonify({
            'success': True,
            'data': {
                'documentType': doc_type,
                'confidence': 0.85
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
