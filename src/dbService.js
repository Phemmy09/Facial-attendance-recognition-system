import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper to generate UUIDs for local storage items
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const dbService = {
  // --- Class Settings ---
  async getClassSettings() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('class_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          return {
            ...data,
            courses: data.courses && data.courses.length > 0 ? data.courses : ['General']
          };
        }
      } catch (err) {
        console.error('Supabase getSettings error, falling back:', err);
      }
    }

    // Local Storage Fallback
    const local = localStorage.getItem('class_settings');
    if (local) {
      return JSON.parse(local);
    }
    const defaultSettings = {
      id: 1,
      start_time: '09:00:00',
      end_time: '17:00:00',
      grace_period_mins: 15,
      courses: ['General']
    };
    localStorage.setItem('class_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  },

  async updateClassSettings(settings) {
    const payload = {
      start_time: settings.start_time,
      end_time: settings.end_time,
      grace_period_mins: parseInt(settings.grace_period_mins, 10),
      courses: settings.courses || ['General'],
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('class_settings')
          .update(payload)
          .eq('id', 1)
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase updateSettings error, falling back:', err);
        throw err;
      }
    }

    // Local Storage Fallback
    const current = await this.getClassSettings();
    const updated = { ...current, ...payload };
    localStorage.setItem('class_settings', JSON.stringify(updated));
    return updated;
  },

  // --- Students ---
  async getStudents() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getStudents error, falling back:', err);
      }
    }

    // Local Storage Fallback
    const local = localStorage.getItem('attendance_students');
    return local ? JSON.parse(local) : [];
  },

  async addStudent(student) {
    const payload = {
      id: student.id,
      name: student.name,
      email: student.email,
      courses: student.courses || [student.course], // Support array of courses
      face_descriptor: student.face_descriptor, // Array of 128 floats
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert([payload])
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase addStudent error, falling back:', err);
        throw err;
      }
    }

    // Local Storage Fallback
    const students = await this.getStudents();
    if (students.some((s) => s.id === student.id)) {
      throw new Error(`Student with ID ${student.id} already exists.`);
    }
    students.push(payload);
    localStorage.setItem('attendance_students', JSON.stringify(students));
    return payload;
  },

  async deleteStudent(studentId) {
    if (isSupabaseConfigured) {
      try {
        // Delete child attendance logs first for safety if DB lacks cascade delete
        const { error: logsError } = await supabase
          .from('attendance')
          .delete()
          .eq('student_id', studentId);
        if (logsError) throw logsError;

        // Delete parent student record
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (studentError) throw studentError;
        return true;
      } catch (err) {
        console.error('Supabase deleteStudent error:', err);
        throw err; // Rethrow to let the UI know it failed
      }
    }

    // Local Storage Fallback
    const students = await this.getStudents();
    const filtered = students.filter((s) => s.id !== studentId);
    localStorage.setItem('attendance_students', JSON.stringify(filtered));

    // Clean up attendance logs for deleted student locally
    const logs = localStorage.getItem('attendance_logs');
    if (logs) {
      const parsedLogs = JSON.parse(logs);
      const filteredLogs = parsedLogs.filter((log) => log.student_id !== studentId);
      localStorage.setItem('attendance_logs', JSON.stringify(filteredLogs));
    }
    return true;
  },

  // --- Attendance ---
  async getAttendanceLogs(dateStr = null) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('attendance')
          .select('*, students(name, email, courses)')
          .order('created_at', { ascending: false });

        if (dateStr) {
          query = query.eq('date', dateStr);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getAttendanceLogs error, falling back:', err);
      }
    }

    // Local Storage Fallback
    const localLogs = localStorage.getItem('attendance_logs');
    const logs = localLogs ? JSON.parse(localLogs) : [];
    const students = await this.getStudents();

    // Map and join locally
    let joined = logs.map((log) => {
      const student = students.find((s) => s.id === log.student_id);
      return {
        ...log,
        students: student 
          ? { name: student.name, email: student.email, courses: student.courses, course: student.course } 
          : { name: 'Unknown Student', email: 'N/A', courses: [], course: 'N/A' },
      };
    });

    if (dateStr) {
      joined = joined.filter((log) => log.date === dateStr);
    }

    // Sort by created_at descending
    return joined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async addAttendanceLog(studentId, date, checkIn, status, course = 'General') {
    const payload = {
      student_id: studentId,
      date: date, // YYYY-MM-DD
      check_in: checkIn, // ISO String
      check_out: null,
      status: status, // 'Present' or 'Late'
      course: course, // Track course session
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert([payload])
          .select('*, students(name, email, courses)');

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase addAttendanceLog error, falling back:', err);
        throw err;
      }
    }

    // Local Storage Fallback
    const logs = localStorage.getItem('attendance_logs') ? JSON.parse(localStorage.getItem('attendance_logs')) : [];
    
    // Check constraint unique to student, date AND course
    if (logs.some((log) => log.student_id === studentId && log.date === date && log.course === course)) {
      throw new Error(`Attendance log already exists for this student today for ${course}.`);
    }

    const newLog = {
      id: generateUUID(),
      ...payload
    };
    logs.push(newLog);
    localStorage.setItem('attendance_logs', JSON.stringify(logs));

    // Format output with joined student
    const students = await this.getStudents();
    const student = students.find((s) => s.id === studentId);
    return {
      ...newLog,
      students: student 
        ? { name: student.name, email: student.email, courses: student.courses, course: student.course } 
        : { name: 'Unknown Student', email: 'N/A', courses: [], course: 'N/A' },
    };
  },

  async updateAttendanceLog(logId, checkOutTime, newStatus) {
    const updates = {
      check_out: checkOutTime, // ISO String
      status: newStatus, // e.g., 'Early Exit' or 'Completed'
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update(updates)
          .eq('id', logId)
          .select('*, students(name, email, courses)');

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.error('Supabase updateAttendanceLog error, falling back:', err);
        throw err;
      }
    }

    // Local Storage Fallback
    const logs = localStorage.getItem('attendance_logs') ? JSON.parse(localStorage.getItem('attendance_logs')) : [];
    const index = logs.findIndex((log) => log.id === logId);
    if (index === -1) {
      throw new Error(`Attendance log ${logId} not found.`);
    }

    logs[index] = {
      ...logs[index],
      ...updates,
    };
    localStorage.setItem('attendance_logs', JSON.stringify(logs));

    const students = await this.getStudents();
    const student = students.find((s) => s.id === logs[index].student_id);
    return {
      ...logs[index],
      students: student 
        ? { name: student.name, email: student.email, courses: student.courses, course: student.course } 
        : { name: 'Unknown Student', email: 'N/A', courses: [], course: 'N/A' },
    };
  },

  // --- Admin Authentication ---
  async verifyPassword(password) {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      localStorage.setItem('admin_logged_in', 'true');
      return true;
    } else {
      throw new Error('Invalid administrator password. Please try again.');
    }
  },

  async signOut() {
    localStorage.removeItem('admin_logged_in');
    return true;
  },

  isAdminLoggedIn() {
    return localStorage.getItem('admin_logged_in') === 'true';
  }
};
