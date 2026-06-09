-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('academic', 'admin', 'food', 'sports', 'medical', 'library', 'lab', 'hostel', 'parking', 'services')),
  floor_count INTEGER DEFAULT 1,
  coordinates JSONB NOT NULL,
  accessibility JSONB DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  marker_emoji TEXT DEFAULT '📍',
  marker_color TEXT DEFAULT '#64748B',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create paths table
CREATE TABLE IF NOT EXISTS paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id TEXT UNIQUE NOT NULL,
  from_building TEXT NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
  to_building TEXT NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
  distance_meters INTEGER NOT NULL,
  walk_time_minutes INTEGER NOT NULL,
  path_type TEXT DEFAULT 'main_road' CHECK (path_type IN ('main_road', 'footpath', 'indoor_corridor', 'shortcut')),
  is_accessible BOOLEAN DEFAULT true,
  has_stairs BOOLEAN DEFAULT false,
  has_slope BOOLEAN DEFAULT false,
  is_covered BOOLEAN DEFAULT false,
  waypoints JSONB DEFAULT '[]',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  building_id TEXT REFERENCES buildings(building_id) ON DELETE SET NULL,
  room TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'seminar' CHECK (event_type IN ('seminar', 'exam', 'sports', 'maintenance', 'emergency', 'cultural')),
  affects_navigation BOOLEAN DEFAULT false,
  blocked_paths TEXT[] DEFAULT '{}',
  alternate_route_note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  device_id TEXT,
  accessibility_profile JSONB DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for buildings (public read)
CREATE POLICY "buildings_select_policy" ON buildings FOR SELECT
  USING (true);

-- Create policies for paths (public read)
CREATE POLICY "paths_select_policy" ON paths FOR SELECT
  USING (true);

-- Create policies for events (public read)
CREATE POLICY "events_select_policy" ON events FOR SELECT
  USING (true);

-- Create policies for conversations (public access for demo purposes)
CREATE POLICY "conversations_select_policy" ON conversations FOR SELECT
  USING (true);
CREATE POLICY "conversations_insert_policy" ON conversations FOR INSERT
  WITH CHECK (true);
CREATE POLICY "conversations_update_policy" ON conversations FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buildings_category ON buildings(category);
CREATE INDEX IF NOT EXISTS idx_buildings_coords ON buildings USING GIN(coordinates);
CREATE INDEX IF NOT EXISTS idx_paths_from ON paths(from_building);
CREATE INDEX IF NOT EXISTS idx_paths_to ON paths(to_building);
CREATE INDEX IF NOT EXISTS idx_events_building ON events(building_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(start_time, end_time);
