import json

# Read the campus.json file
with open('backend/data/campus.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update campus center to Chitkara University Rajpura
data['campus_center'] = {
    "lat": 30.5156,
    "lng": 76.6596
}

# Coordinate mapping for Chitkara University buildings
chitkara_coords = {
    "main_gate": {"lat": 30.5135, "lng": 76.6575},
    "admin_block": {"lat": 30.5145, "lng": 76.6585},
    "library": {"lat": 30.5160, "lng": 76.6595},
    "cafeteria": {"lat": 30.5155, "lng": 76.6610},
    "cs_block": {"lat": 30.5168, "lng": 76.6592},
    "engineering_block": {"lat": 30.5172, "lng": 76.6605},
    "medical_center": {"lat": 30.5142, "lng": 76.6618},
    "auditorium": {"lat": 30.5165, "lng": 76.6580},
    "sports_complex": {"lat": 30.5180, "lng": 76.6570},
    "boys_hostel": {"lat": 30.5185, "lng": 76.6595},
    "girls_hostel": {"lat": 30.5188, "lng": 76.6605},
    "parking_main": {"lat": 30.5138, "lng": 76.6582},
    "innovation_hub": {"lat": 30.5170, "lng": 76.6615},
    "food_court": {"lat": 30.5158, "lng": 76.6622},
    "atm_bank": {"lat": 30.5148, "lng": 76.6600}
}

# Name updates
name_updates = {
    "library": {
        "name": "Learning Resource Centre",
        "short_name": "LRC",
        "description": "The main library with extensive collection, digital resources, reading halls, and study spaces. Open from 9 AM to 9 PM."
    },
    "cs_block": {
        "name": "De-Morgan Block",
        "short_name": "De-Morgan",
        "description": "Computer Science and Engineering department with computer labs, AI/ML facilities, seminar halls, and faculty offices."
    },
    "medical_center": {
        "name": "Health Center",
        "short_name": "Health Center"
    },
    "auditorium": {
        "name": "University Auditorium",
        "short_name": "Auditorium",
        "description": "The main auditorium for events, convocation ceremonies, cultural programs, and conferences with modern facilities."
    }
}

# Update building coordinates and names
for building in data['buildings']:
    building_id = building['building_id']
    
    # Map old IDs to new ones
    if building_id == 'hostel_a':
        building['building_id'] = 'boys_hostel'
        building['name'] = 'Boys Hostel'
        building['short_name'] = 'Boys Hostel'
        building['coordinates'] = chitkara_coords.get('boys_hostel', building['coordinates'])
    elif building_id == 'hostel_b':
        building['building_id'] = 'girls_hostel'
        building['name'] = 'Girls Hostel'
        building['short_name'] = 'Girls Hostel'
        building['coordinates'] = chitkara_coords.get('girls_hostel', building['coordinates'])
    elif building_id == 'mech_block':
        building['building_id'] = 'engineering_block'
        building['name'] = 'Engineering Block'
        building['short_name'] = 'Engineering'
        building['coordinates'] = chitkara_coords.get('engineering_block', building['coordinates'])
    elif building_id == 'parking_p1':
        building['building_id'] = 'parking_main'
        building['name'] = 'Main Parking Area'
        building['short_name'] = 'Parking'
        building['coordinates'] = chitkara_coords.get('parking_main', building['coordinates'])
    elif building_id == 'food_truck_zone':
        building['building_id'] = 'food_court'
        building['name'] = 'Food Court'
        building['short_name'] = 'Food Court'
        building['coordinates'] = chitkara_coords.get('food_court', building['coordinates'])
    elif building_id in chitkara_coords:
        building['coordinates'] = chitkara_coords[building_id]
        
    # Update names for specific buildings
    if building_id in name_updates:
        for key, value in name_updates[building_id].items():
            building[key] = value

# Update main gate description
for building in data['buildings']:
    if building['building_id'] == 'main_gate':
        building['description'] = "The main entrance to Chitkara University Rajpura campus with security checkpoint, visitor passes, and information desk."
        break

# Write back to file
with open('backend/data/campus.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Campus coordinates updated to Chitkara University Rajpura!")
