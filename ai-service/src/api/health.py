from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Medico AI Service',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@health_bp.route('/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    return jsonify({
        'success': True,
        'data': {
            'service': 'Medico AI Service',
            'version': '1.0.0',
            'status': 'running',
            'modules': {
                'nlp': 'available',
                'ocr': 'available'
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    }), 200
