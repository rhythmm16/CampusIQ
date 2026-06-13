import json

# Read the campus.json file
with open('backend/data/campus.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# ID mapping
id_mapping = {
    'hostel_a': 'boys_hostel',
    'hostel_b': 'girls_hostel',
    'mech_block': 'engineering_block',
    'parking_p1': 'parking_main',
    'food_truck_zone': 'food_court'
}

# Update paths
for path in data.get('paths', []):
    if path['from'] in id_mapping:
        path['from'] = id_mapping[path['from']]
    if path['to'] in id_mapping:
        path['to'] = id_mapping[path['to']]

# Update path attributes (noise levels, etc.)
if 'path_attributes' in data:
    new_attributes = {}
    for key, value in data['path_attributes'].items():
        # Split the key and replace IDs
        parts = key.split('-')
        new_parts = [id_mapping.get(part, part) for part in parts]
        new_key = '-'.join(new_parts)
        new_attributes[new_key] = value
    data['path_attributes'] = new_attributes

# Update pulse affected buildings
if 'pulse_data' in data:
    for item in data['pulse_data']:
        if item.get('building_id') in id_mapping:
            item['building_id'] = id_mapping[item['building_id']]

# Write back to file
with open('backend/data/campus.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ All path and building ID references updated!")
