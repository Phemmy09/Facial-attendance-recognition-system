# Supabase Database Setup Guide

Follow these steps to set up your Supabase database and link it to your Vercel deployment and local development environment.

---

## 1. Create the Database Schema

1. Go to your [Supabase Dashboard](https://supabase.com) and select your project.
2. Open the **SQL Editor** from the left navigation panel.
3. Click **New query** and paste the following SQL script:

```sql
-- 1. Create the class settings table (holds standard start and exit times)
CREATE TABLE public.class_settings (
    id integer PRIMARY KEY DEFAULT 1,
    start_time time without time zone DEFAULT '09:00:00'::time,
    end_time time without time zone DEFAULT '17:00:00'::time,
    grace_period_mins integer DEFAULT 15,
    courses text[] NOT NULL DEFAULT '{"General"}'::text[],
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize default configurations
INSERT INTO public.class_settings (id, start_time, end_time, grace_period_mins, courses)
VALUES (1, '09:00:00', '17:00:00', 15, '{"General"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Create the students table (holds names and 128-dimensional facial descriptors)
CREATE TABLE public.students (
    id text PRIMARY KEY, -- Student Registration Number (e.g. STU001)
    name text NOT NULL,
    email text NOT NULL,
    courses text[] NOT NULL DEFAULT '{}', -- Array of registered courses
    face_descriptor double precision[] NOT NULL, -- Float array for embeddings
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Create the attendance logs table (tracks daily entrance and exits per course)
CREATE TABLE public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text REFERENCES public.students(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    check_in timestamp with time zone DEFAULT timezone('utc'::text, now()),
    check_out timestamp with time zone,
    status text NOT NULL, -- 'Present', 'Late', 'Early Exit', 'Completed'
    course text NOT NULL DEFAULT 'General', -- Added: course attendance session
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    -- Ensures a student has at most one attendance log row per day per course
    CONSTRAINT unique_student_day_course UNIQUE (student_id, date, course)
);

-- 4. Disable Row Level Security (RLS) to allow the frontend application to read and write directly
ALTER TABLE public.class_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
```

4. Click **Run** to execute the queries and create your tables.

---

## 2. Link your Frontend Application

### Local Environment Configuration
To connect your local development server to your Supabase project:

1. In the root directory of your project (`facial attendance`), create a file named `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Replace the values above with your API credentials (found under **Settings** > **API** in the Supabase dashboard).
3. Restart your dev server (`npm run dev`). The warning banner will automatically disappear, indicating the app is connected to Supabase!

### Vercel Deployment Configuration
When deploying to Vercel:

1. Add your project to Vercel via the Vercel dashboard.
2. In the project's **Settings** > **Environment Variables** tab, add the following two variables:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
3. Deploy the application. Vercel will build the React bundle and make these variables available securely to your clients.
