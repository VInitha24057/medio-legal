from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from api.health import health_bp
from api.nlp import nlp_bp
from api.ocr import ocr_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(health_bp, url_prefix='/api')
app.register_blueprint(nlp_bp, url_prefix='/api/nlp')
app.register_blueprint(ocr_bp, url_prefix='/api/ocr')

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'service': 'Medico AI Service',
        'version': '1.0.0',
        'status': 'running',
        'timestamp': datetime.utcnow().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error',
        'error': str(error)
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Medico AI Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
