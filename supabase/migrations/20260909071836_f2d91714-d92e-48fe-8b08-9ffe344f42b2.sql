
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'CSE',
  designation TEXT NOT NULL DEFAULT 'Assistant Professor',
  email TEXT,
  max_hours_per_week INT NOT NULL DEFAULT 18,
  unavailable_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty TO anon, authenticated;
GRANT ALL ON public.faculty TO service_role;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faculty open access" ON public.faculty FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 60,
  room_type TEXT NOT NULL DEFAULT 'Lecture Hall',
  building TEXT NOT NULL DEFAULT 'Main Block',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms open access" ON public.rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'CSE',
  semester INT NOT NULL DEFAULT 1,
  strength INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO anon, authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batches open access" ON public.batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INT NOT NULL DEFAULT 3,
  hours_per_week INT NOT NULL DEFAULT 3,
  subject_type TEXT NOT NULL DEFAULT 'Theory',
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  requires_lab BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects open access" ON public.subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  constraint_type TEXT NOT NULL DEFAULT 'Soft',
  weight INT NOT NULL DEFAULT 10,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.constraints TO anon, authenticated;
GRANT ALL ON public.constraints TO service_role;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constraints open access" ON public.constraints FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  fitness NUMERIC NOT NULL DEFAULT 0,
  hard_conflicts INT NOT NULL DEFAULT 0,
  soft_penalties INT NOT NULL DEFAULT 0,
  execution_ms NUMERIC NOT NULL DEFAULT 0,
  iterations INT NOT NULL DEFAULT 0,
  scheduled_count INT NOT NULL DEFAULT 0,
  required_count INT NOT NULL DEFAULT 0,
  utilization NUMERIC NOT NULL DEFAULT 0,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetables TO anon, authenticated;
GRANT ALL ON public.timetables TO service_role;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timetables open access" ON public.timetables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.faculty (name, code, department, designation, email, max_hours_per_week) VALUES
('Dr. Anita Rao','FAC01','CSE','Professor','anita.rao@college.edu',16),
('Dr. Vikram Shah','FAC02','CSE','Associate Professor','vikram.shah@college.edu',18),
('Prof. Meera Nair','FAC03','CSE','Assistant Professor','meera.nair@college.edu',20),
('Dr. Rohit Verma','FAC04','IT','Professor','rohit.verma@college.edu',14),
('Prof. Sneha Iyer','FAC05','IT','Assistant Professor','sneha.iyer@college.edu',20),
('Dr. Kabir Menon','FAC06','ECE','Associate Professor','kabir.menon@college.edu',18),
('Prof. Divya Sharma','FAC07','CSE','Assistant Professor','divya.sharma@college.edu',20),
('Dr. Arun Pillai','FAC08','ECE','Professor','arun.pillai@college.edu',15);

INSERT INTO public.rooms (name, code, capacity, room_type, building) VALUES
('Lecture Hall A','R101',80,'Lecture Hall','Main Block'),
('Lecture Hall B','R102',70,'Lecture Hall','Main Block'),
('Seminar Room 1','R201',45,'Seminar Room','Main Block'),
('Programming Lab 1','L301',60,'Lab','Tech Block'),
('Programming Lab 2','L302',60,'Lab','Tech Block'),
('Electronics Lab','L303',50,'Lab','Tech Block');

INSERT INTO public.batches (name, code, department, semester, strength) VALUES
('CSE Sem 3 - Section A','CSE3A','CSE',3,62),
('CSE Sem 5 - Section A','CSE5A','CSE',5,58),
('IT Sem 3 - Section A','IT3A','IT',3,54),
('ECE Sem 5 - Section A','ECE5A','ECE',5,48);

INSERT INTO public.subjects (name, code, credits, hours_per_week, subject_type, requires_lab, faculty_id, batch_id) VALUES
('Data Structures','CS301',4,4,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC01'),(SELECT id FROM public.batches WHERE code='CSE3A')),
('Data Structures Lab','CS301L',2,2,'Lab',true,(SELECT id FROM public.faculty WHERE code='FAC03'),(SELECT id FROM public.batches WHERE code='CSE3A')),
('Discrete Mathematics','CS302',3,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC02'),(SELECT id FROM public.batches WHERE code='CSE3A')),
('Digital Logic Design','CS303',3,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC06'),(SELECT id FROM public.batches WHERE code='CSE3A')),
('Operating Systems','CS501',4,4,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC02'),(SELECT id FROM public.batches WHERE code='CSE5A')),
('Machine Learning','CS502',4,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC01'),(SELECT id FROM public.batches WHERE code='CSE5A')),
('Machine Learning Lab','CS502L',2,2,'Lab',true,(SELECT id FROM public.faculty WHERE code='FAC07'),(SELECT id FROM public.batches WHERE code='CSE5A')),
('Computer Networks','CS503',3,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC07'),(SELECT id FROM public.batches WHERE code='CSE5A')),
('Database Systems','IT301',4,4,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC04'),(SELECT id FROM public.batches WHERE code='IT3A')),
('Database Lab','IT301L',2,2,'Lab',true,(SELECT id FROM public.faculty WHERE code='FAC05'),(SELECT id FROM public.batches WHERE code='IT3A')),
('Web Technologies','IT302',3,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC05'),(SELECT id FROM public.batches WHERE code='IT3A')),
('Signals and Systems','EC501',4,4,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC08'),(SELECT id FROM public.batches WHERE code='ECE5A')),
('VLSI Design','EC502',3,3,'Theory',false,(SELECT id FROM public.faculty WHERE code='FAC06'),(SELECT id FROM public.batches WHERE code='ECE5A')),
('VLSI Lab','EC502L',2,2,'Lab',true,(SELECT id FROM public.faculty WHERE code='FAC08'),(SELECT id FROM public.batches WHERE code='ECE5A'));

INSERT INTO public.constraints (name, code, constraint_type, weight, enabled, description) VALUES
('No faculty double booking','C_FAC_CLASH','Hard',100,true,'A faculty member cannot teach two classes in the same time slot.'),
('No room double booking','C_ROOM_CLASH','Hard',100,true,'A room cannot host two classes in the same time slot.'),
('No batch double booking','C_BATCH_CLASH','Hard',100,true,'A batch cannot attend two classes in the same time slot.'),
('Lab sessions in lab rooms','C_LAB_ROOM','Hard',80,true,'Lab subjects must be scheduled in rooms of type Lab.'),
('Room capacity fits batch','C_CAPACITY','Hard',80,true,'Room capacity must be at least the batch strength.'),
('Respect faculty unavailability','C_FAC_AVAIL','Hard',70,true,'Classes must not be placed in faculty unavailable slots.'),
('Faculty weekly load limit','C_FAC_LOAD','Soft',25,true,'Faculty should not exceed their maximum weekly teaching hours.'),
('Minimise timetable gaps','C_GAPS','Soft',15,true,'Reduce idle gaps between classes for each batch.'),
('Spread subject across week','C_SPREAD','Soft',12,true,'Avoid scheduling the same subject twice in one day.'),
('Prefer morning theory slots','C_MORNING','Soft',8,true,'Theory classes are preferred in earlier slots of the day.');
