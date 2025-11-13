from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from lstm_model import PropertyPriceLSTM
 
app = Flask(__name__)
CORS(app)
 
# Load the trained model
lstm_model = PropertyPriceLSTM()
model_loaded = False
 
# Load Tirupati dataset for reference
dataset_path = '../src/data/tirupatidataset_with_location.json'
tirupati_data = []
 
def load_dataset():
    """Load dataset for lookup and reference"""
    global tirupati_data
    print("Loading Tirupati dataset...")
    with open(dataset_path, 'r') as f:
        data = json.load(f)
        tirupati_data = data['data']
    print(f"Loaded {len(tirupati_data)} records")
 
def init_model():
    """Initialize the LSTM model"""
    global model_loaded
    try:
        if os.path.exists('saved_models/lstm_model.h5'):
            lstm_model.load_model()
            model_loaded = True
            print("✅ LSTM model loaded successfully")
        else:
            print("⚠️  No trained model found. Train the model first using lstm_model.py")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
 
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model_loaded,
        'dataset_records': len(tirupati_data)
    })
 
@app.route('/api/predict', methods=['POST'])
def predict_price():
    """Predict property price using LSTM model"""
    try:
        data = request.json
 
        # Extract input fields
        district = data.get('district', 'Tirupati')
        mandal = data.get('mandal', 'Tirupati Urban')
        village = data.get('village', 'Tirupathi')
        tr_door_no = data.get('tr_door_no', '')
        area = data.get('area', 1000)  # in sq ft
        property_type = data.get('propertyType', 'RESIDENTIAL')
 
        # Parse TR_DOOR_NO (format: WARD-BLOCK-DOOR/BI)
        ward_no, block_no, door_no = 1, 1, 1
        if tr_door_no:
            try:
                parts = tr_door_no.split('/')
                ward_block_door = parts[0].split('-')
                ward_no = int(ward_block_door[0])
                block_no = int(ward_block_door[1])
                door_no = int(ward_block_door[2])
            except:
                pass
 
        # Find similar properties in dataset for comm_rate and floor rates
        similar_props = [p for p in tirupati_data
                         if p['MANDAL'] == mandal and p['VILLAGE'] == village]
 
        if not similar_props:
            similar_props = [p for p in tirupati_data if p['MANDAL'] == mandal]
 
        if not similar_props:
            similar_props = tirupati_data[:100]  # Fallback to first 100 records
 
        # Calculate average rates from similar properties
        avg_comm_rate = sum(p.get('COMM_RATE', 3000) for p in similar_props) / len(similar_props)
        avg_floor1 = sum(p.get('COMP_FLOOR1', 3500) for p in similar_props) / len(similar_props)
        avg_floor_oth = sum(p.get('COMP_FLOOR_OTH', 3200) for p in similar_props) / len(similar_props)
        avg_prev_rate = sum(p.get('PRE_REV_UNIT_RATE', 40000) for p in similar_props) / len(similar_props)
 
        if model_loaded:
            # Use LSTM model for prediction
            predicted_unit_rate = lstm_model.predict(
                mandal=mandal,
                village=village,
                ward_no=ward_no,
                block_no=block_no,
                door_no=door_no,
                comm_rate=avg_comm_rate,
                comp_floor1=avg_floor1,
                comp_floor_oth=avg_floor_oth,
                prev_rate=avg_prev_rate
            )
        else:
            # Fallback: Use average from similar properties
            avg_unit_rate = sum(p.get('UNIT_RATE', 40000) for p in similar_props) / len(similar_props)
            predicted_unit_rate = avg_unit_rate
 
        # Calculate total price based on area
        price_per_sqft = predicted_unit_rate
        if property_type == 'COMMERCIAL':
            price_per_sqft = avg_comm_rate
        elif property_type == 'RESIDENTIAL':
            price_per_sqft = predicted_unit_rate
 
        total_price = price_per_sqft * area
 
        # Calculate confidence based on similar properties
        confidence = 'HIGH' if len(similar_props) > 50 else 'MEDIUM' if len(similar_props) > 10 else 'LOW'
 
        # Price range (±8-12% based on confidence)
        variance = 0.08 if confidence == 'HIGH' else 0.10 if confidence == 'MEDIUM' else 0.12
        price_range = {
            'min': int(total_price * (1 - variance)),
            'max': int(total_price * (1 + variance))
        }
 
        # Get comparable properties
        comparable_properties = []
        for prop in similar_props[:5]:
            comparable_properties.append({
                'propertyId': prop.get('TR_DOOR_NO', ''),
                'location': f"{prop.get('VILLAGE', '')}, {prop.get('MANDAL', '')}",
                'district': prop.get('DISTRICT', ''),
                'mandal': prop.get('MANDAL', ''),
                'tr_door_no': prop.get('TR_DOOR_NO', ''),
                'unit_rate': prop.get('UNIT_RATE', 0),
                'comm_rate': prop.get('COMM_RATE', 0)
            })
 
        result = {
            'success': True,
            'data': {
                'predictedPrice': int(total_price),
                'priceRange': price_range,
                'pricePerSqFt': int(price_per_sqft),
                'confidence': confidence,
                'dataPoints': len(similar_props),
                'modelUsed': 'LSTM' if model_loaded else 'AVERAGE',
                'factors': {
                    'district': district,
                    'mandal': mandal,
                    'village': village,
                    'tr_door_no': tr_door_no,
                    'area': area,
                    'propertyType': property_type,
                    'ward_no': ward_no,
                    'block_no': block_no,
                    'door_no': door_no,
                    'avgCommRate': int(avg_comm_rate),
                    'avgFloor1': int(avg_floor1),
                    'avgFloorOth': int(avg_floor_oth),
                    'locationMatches': len(similar_props)
                },
                'comparableProperties': comparable_properties
            }
        }
 
        return jsonify(result)
 
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
 
@app.route('/api/search-locations', methods=['GET'])
def search_locations():
    """Search for mandals, villages, and door numbers"""
    try:
        query = request.args.get('q', '').lower()
 
        # Get unique locations
        mandals = list(set(p['MANDAL'] for p in tirupati_data))
        villages = list(set(p['VILLAGE'] for p in tirupati_data))
 
        # Filter based on query
        if query:
            mandals = [m for m in mandals if query in m.lower()]
            villages = [v for v in villages if query in v.lower()]
 
        return jsonify({
            'success': True,
            'data': {
                'mandals': sorted(mandals)[:20],
                'villages': sorted(villages)[:20]
            }
        })
 
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
 
if __name__ == '__main__':
    # Load dataset
    load_dataset()
 
    # Initialize model
    init_model()
 
    # Start Flask server
    print('\n' + '=' * 60)
    print('🚀 LSTM Price Prediction API Starting...')
    print('=' * 60)
    print(f'📍 URL: http://localhost:5000')
    print(f'📊 Dataset: {len(tirupati_data)} Tirupati records')
    print(f'🤖 Model Status: {"Loaded" if model_loaded else "Not Loaded (using fallback)"}')
    print('=' * 60)
    print('\nAvailable endpoints:')
    print('  GET    /health')
    print('  POST   /api/predict')
    print('  GET    /api/search-locations')
    print('=' * 60 + '\n')
 
    app.run(host='0.0.0.0', port=5000, debug=True)