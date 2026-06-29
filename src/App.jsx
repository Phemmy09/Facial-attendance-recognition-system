import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { dbService } from './dbService';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  Camera,
  UserCheck,
  BarChart2,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  UserPlus,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Calendar,
  Filter,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Key
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner', 'enroll', 'dashboard'
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState('Initializing AI models...');
  const [modelError, setModelError] = useState(null);

  // Database States
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [classSettings, setClassSettings] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Notifications Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Custom Toast helper
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Load database tables and settings
  const loadData = async () => {
    setDbLoading(true);
    try {
      const [studentsData, settingsData, logsData] = await Promise.all([
        dbService.getStudents(),
        dbService.getClassSettings(),
        dbService.getAttendanceLogs()
      ]);
      setStudents(studentsData);
      setClassSettings(settingsData);
      setAttendanceLogs(logsData);
    } catch (error) {
      console.error('Error loading database data:', error);
      showToast('Error fetching data from database.', 'error');
    } finally {
      setDbLoading(false);
    }
  };

  // Initialize face-api.js models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

        setModelLoadingProgress('Loading Face Detection Model...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

        setModelLoadingProgress('Loading Face Landmark Model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

        setModelLoadingProgress('Loading Face Recognition Model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
        showToast('AI models loaded successfully!', 'success');
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setModelError('Failed to load AI face recognition models. Please check your internet connection.');
        showToast('Model loading failed.', 'error');
      }
    }
    loadModels();
    loadData();
  }, []);

  // Check admin auth state on mount
  useEffect(() => {
    const loggedIn = dbService.isAdminLoggedIn();
    setIsAdmin(loggedIn);
    setAuthChecking(false);
  }, []);

  const handleSignOut = async () => {
    try {
      await dbService.signOut();
      setIsAdmin(false);
      showToast('Signed out successfully.', 'info');
      setActiveTab('scanner');
    } catch (err) {
      console.error('Error signing out:', err);
      showToast('Error during sign out.', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      <div className={`custom-toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        {toast.type === 'success' && <CheckCircle2 size={20} className="nav-logo-icon" style={{ color: 'var(--accent-emerald)' }} />}
        {toast.type === 'error' && <XCircle size={20} className="nav-logo-icon" style={{ color: 'var(--accent-rose)' }} />}
        {toast.type === 'info' && <Sparkles size={20} className="nav-logo-icon" />}
        <span>{toast.message}</span>
      </div>

      <nav className="navbar">
        <div className="nav-brand">
          <Camera className="nav-logo-icon" size={28} />
          <span>FaceAttend AI</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <Camera size={18} />
            Scanner
          </button>
          <button
            className={`nav-btn ${activeTab === 'enroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('enroll')}
          >
            <UserPlus size={18} />
            Enroll Student
            {!isAdmin && <Lock size={12} style={{ marginLeft: '0.5rem', opacity: 0.6 }} />}
          </button>
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 size={18} />
            Dashboard & Reports
            {!isAdmin && <Lock size={12} style={{ marginLeft: '0.5rem', opacity: 0.6 }} />}
          </button>
          {isAdmin && (
            <button
              className="nav-btn nav-btn-logout"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">
        {/* Supabase Status Banner */}
        {!isSupabaseConfigured && (
          <div className="fallback-warning-banner">
            <Database size={20} />
            <div>
              <strong>Local Storage Fallback Mode Active:</strong> Add your Supabase credentials
              (<code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>) to a <code>.env</code> file
              to enable cloud database syncing. The application is currently fully functional locally.
            </div>
          </div>
        )}

        {!modelsLoaded && !modelError && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{modelLoadingProgress}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Downloading neural networks (approx. 10MB) from jsDelivr CDN...</p>
          </div>
        )}

        {modelError && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', marginTop: '4rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <AlertTriangle size={48} style={{ color: 'var(--accent-rose)' }} />
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>Configuration Error</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{modelError}</p>
                <button className="btn-primary" onClick={() => window.location.reload()}>Retry Loading Models</button>
              </div>
            </div>
          </div>
        )}

        {modelsLoaded && (
          <>
            {activeTab === 'scanner' && (
              <ScannerTab 
                students={students} 
                classSettings={classSettings} 
                attendanceLogs={attendanceLogs}
                onLogAdded={loadData}
                showToast={showToast}
                isAdmin={isAdmin}
              />
            )}
            {activeTab === 'enroll' && (
              !isAdmin ? (
                <AdminLogin onLoginSuccess={() => setIsAdmin(true)} showToast={showToast} />
              ) : (
                <EnrollTab 
                  onEnrollSuccess={loadData}
                  showToast={showToast}
                  classSettings={classSettings}
                />
              )
            )}
            {activeTab === 'dashboard' && (
              !isAdmin ? (
                <AdminLogin onLoginSuccess={() => setIsAdmin(true)} showToast={showToast} />
              ) : (
                <DashboardTab 
                  students={students}
                  attendanceLogs={attendanceLogs}
                  classSettings={classSettings}
                  onSettingsUpdated={loadData}
                  onStudentDeleted={loadData}
                  dbLoading={dbLoading}
                  showToast={showToast}
                />
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// SCANNER TAB COMPONENT
// ==========================================
function ScannerTab({ students, classSettings, attendanceLogs, onLogAdded, showToast, isAdmin }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('loading'); // 'loading', 'active', 'error'
  const [scanStatus, setScanStatus] = useState('initializing'); // 'initializing', 'ready', 'matching', 'cooldown'
  const [feedback, setFeedback] = useState({ status: 'idle', name: '', details: '' }); // 'idle', 'success', 'error', 'loading'

  const uniqueCourses = useMemo(() => {
    if (classSettings && classSettings.courses && classSettings.courses.length > 0) {
      return classSettings.courses;
    }
    return ['General'];
  }, [classSettings]);

  const [selectedCourse, setSelectedCourse] = useState('General');

  useEffect(() => {
    if (uniqueCourses.length > 0 && !uniqueCourses.includes(selectedCourse)) {
      setSelectedCourse(uniqueCourses[0]);
    }
  }, [uniqueCourses, selectedCourse]);

  const [showInstantEnroll, setShowInstantEnroll] = useState(false);
  const [instantStudentId, setInstantStudentId] = useState('');
  const [instantStudentName, setInstantStudentName] = useState('');
  const [instantStudentEmail, setInstantStudentEmail] = useState('');
  const [instantStudentCourses, setInstantStudentCourses] = useState([]);
  const [instantFaceDescriptor, setInstantFaceDescriptor] = useState(null);
  const [instantFaceImage, setInstantFaceImage] = useState(null);
  const [isInstantSubmitting, setIsInstantSubmitting] = useState(false);

  const toggleInstantCourse = (course) => {
    if (instantStudentCourses.includes(course)) {
      setInstantStudentCourses(instantStudentCourses.filter(c => c !== course));
    } else {
      setInstantStudentCourses([...instantStudentCourses, course]);
    }
  };

  const handleInstantDiscard = () => {
    setShowInstantEnroll(false);
    setInstantStudentId('');
    setInstantStudentName('');
    setInstantStudentEmail('');
    setInstantStudentCourses([]);
    setInstantFaceDescriptor(null);
    setInstantFaceImage(null);
    setFeedback({ status: 'idle', name: '', details: '' });
    setScanStatus('ready');
  };

  const handleInstantEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!instantStudentId || !instantStudentName || !instantStudentEmail || !instantFaceDescriptor) {
      showToast('Please fill all fields.', 'warning');
      return;
    }

    setIsInstantSubmitting(true);
    try {
      const stuId = instantStudentId.trim().toUpperCase();
      await dbService.addStudent({
        id: stuId,
        name: instantStudentName.trim(),
        email: instantStudentEmail.trim(),
        courses: instantStudentCourses,
        face_descriptor: instantFaceDescriptor
      });

      showToast(`Registered student: ${instantStudentName}`, 'success');

      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const nowIso = now.toISOString();
      const settings = classSettings || { start_time: '09:00:00', end_time: '17:00:00', grace_period_mins: 15 };

      const timeToSeconds = (tStr) => {
        const [h, m, s = 0] = tStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
      };

      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const classStartSeconds = timeToSeconds(settings.start_time);
      const gracePeriodSeconds = settings.grace_period_mins * 60;

      const isLate = nowSeconds > (classStartSeconds + gracePeriodSeconds);
      const status = isLate ? 'Late' : 'Present';

      await dbService.addAttendanceLog(stuId, todayStr, nowIso, status, selectedCourse);
      showToast(`Check-in recorded for ${selectedCourse}`, 'success');

      setShowInstantEnroll(false);
      setInstantStudentId('');
      setInstantStudentName('');
      setInstantStudentEmail('');
      setInstantStudentCourses([]);
      setInstantFaceDescriptor(null);
      setInstantFaceImage(null);
      onLogAdded();
      setFeedback({ status: 'idle', name: '', details: '' });
      setScanStatus('ready');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to register student.', 'error');
    } finally {
      setIsInstantSubmitting(false);
    }
  };

  const faceMatcher = useMemo(() => {
    if (!students || students.length === 0) return null;
    try {
      const labeledDescriptors = students.map(student => {
        const descArray = new Float32Array(student.face_descriptor);
        return new faceapi.LabeledFaceDescriptors(student.id, [descArray]);
      });
      return new faceapi.FaceMatcher(labeledDescriptors, 0.55);
    } catch (err) {
      console.error('Error creating FaceMatcher:', err);
      return null;
    }
  }, [students]);

  const startCamera = async () => {
    setCameraState('loading');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraState('active');
        setScanStatus('ready');
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setCameraState('error');
      showToast('Unable to access webcam. Please verify permissions.', 'error');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureUnrecognizedFace = (descriptor) => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const imgBase64 = canvas.toDataURL('image/jpeg');
      setInstantFaceImage(imgBase64);
      setInstantFaceDescriptor(Array.from(descriptor));
      setInstantStudentCourses([selectedCourse]);
      setScanStatus('matching');
      setShowInstantEnroll(true);
      setFeedback({
        status: 'loading',
        name: 'Unregistered Face Detected',
        details: 'Opening instant enrollment...'
      });
    } catch (err) {
      console.error('Error capturing unregistered face:', err);
      showToast('Error preparing instant enrollment.', 'error');
      setScanStatus('ready');
    }
  };

  useEffect(() => {
    if (cameraState !== 'active' || !videoRef.current || scanStatus === 'cooldown' || showInstantEnroll) return;
    let isMounted = true;
    let animationFrameId;
    const processFrame = async () => {
      if (!isMounted || !videoRef.current || scanStatus === 'cooldown' || scanStatus === 'matching' || showInstantEnroll) return;
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.65 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection && isMounted && scanStatus === 'ready') {
          setScanStatus('matching');
          setFeedback({ status: 'loading', name: 'Scanning face...', details: 'Analyzing matches in directory...' });
          if (!faceMatcher) {
            if (isAdmin) {
              captureUnrecognizedFace(detection.descriptor);
            } else {
              setFeedback({
                status: 'error',
                name: 'Unrecognized Face',
                details: 'Database is empty. Please sign in as admin to enroll students.'
              });
              triggerCooldown();
            }
            return;
          }
          const match = faceMatcher.findBestMatch(detection.descriptor);
          if (match && match.label !== 'unknown') {
            const matchedStudent = students.find(s => s.id === match.label);
            if (matchedStudent) {
              const coursesArray = matchedStudent.courses || (matchedStudent.course ? [matchedStudent.course] : []);
              const isEnrolled = coursesArray.some(c => c.toLowerCase() === selectedCourse.toLowerCase());
              if (isEnrolled) {
                await handleAttendanceRecord(matchedStudent);
              } else {
                setFeedback({
                  status: 'error',
                  name: 'Not Registered for Course',
                  details: `${matchedStudent.name} is not enrolled in ${selectedCourse}.`
                });
                triggerCooldown();
              }
            } else {
              setFeedback({
                status: 'error',
                name: 'Student ID Not Found',
                details: 'Matched ID is invalid or deleted.'
              });
              triggerCooldown();
            }
          } else {
            if (isAdmin) {
              captureUnrecognizedFace(detection.descriptor);
            } else {
              setFeedback({
                status: 'error',
                name: 'Unrecognized Face',
                details: 'Face not found in directory. Sign in as admin to register.'
              });
              triggerCooldown();
            }
          }
        }
      } catch (err) {
        console.error('Error in face detection loop:', err);
      }
      if (isMounted && scanStatus === 'ready') {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };
    if (scanStatus === 'ready') {
      processFrame();
    }
    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cameraState, scanStatus, faceMatcher, students, selectedCourse, showInstantEnroll]);

  const handleManualScan = async () => {
    if (cameraState !== 'active' || !videoRef.current || scanStatus !== 'ready') return;
    setScanStatus('matching');
    setFeedback({ status: 'loading', name: 'Scanning face...', details: 'Analyzing camera capture...' });
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        if (!faceMatcher) {
          if (isAdmin) {
            captureUnrecognizedFace(detection.descriptor);
          } else {
            setFeedback({
              status: 'error',
              name: 'Unrecognized Face',
              details: 'Database is empty. Please sign in as admin to enroll students.'
            });
            triggerCooldown();
          }
          return;
        }
        const match = faceMatcher.findBestMatch(detection.descriptor);
        if (match && match.label !== 'unknown') {
          const matchedStudent = students.find(s => s.id === match.label);
          if (matchedStudent) {
            const coursesArray = matchedStudent.courses || (matchedStudent.course ? [matchedStudent.course] : []);
            const isEnrolled = coursesArray.some(c => c.toLowerCase() === selectedCourse.toLowerCase());
            if (isEnrolled) {
              await handleAttendanceRecord(matchedStudent);
            } else {
              setFeedback({
                status: 'error',
                name: 'Not Registered for Course',
                details: `${matchedStudent.name} is not enrolled in ${selectedCourse}.`
              });
              triggerCooldown();
            }
          } else {
            setFeedback({
              status: 'error',
              name: 'Student ID Not Found',
              details: 'Matched ID is invalid or deleted.'
            });
            triggerCooldown();
          }
        } else {
          if (isAdmin) {
            captureUnrecognizedFace(detection.descriptor);
          } else {
            setFeedback({
              status: 'error',
              name: 'Unrecognized Face',
              details: 'Face not found in directory. Sign in as admin to register.'
            });
            triggerCooldown();
          }
        }
      } else {
        setFeedback({
          status: 'error',
          name: 'No Face Detected',
          details: 'Please look directly at the camera. Ensure your face is well-lit and fully visible within the box.'
        });
        triggerCooldown();
      }
    } catch (err) {
      console.error('Error during manual scan:', err);
      setFeedback({
        status: 'error',
        name: 'Scanner Error',
        details: `An error occurred while processing the camera capture: ${err.message || String(err)}`
      });
      triggerCooldown();
    }
  };

  const triggerCooldown = () => {
    setScanStatus('cooldown');
    setTimeout(() => {
      setFeedback({ status: 'idle', name: '', details: '' });
      setScanStatus('ready');
    }, 4000);
  };

  const handleAttendanceRecord = async (student) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowIso = now.toISOString();
    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const todayLogs = await dbService.getAttendanceLogs(todayStr);
      const existingLog = todayLogs.find(log => log.student_id === student.id && log.course === selectedCourse);

      const settings = classSettings || { start_time: '09:00:00', end_time: '17:00:00', grace_period_mins: 15 };

      const timeToSeconds = (tStr) => {
        const [h, m, s = 0] = tStr.split(':').map(Number);
        return h * 3600 + m * 60 + s;
      };

      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const classStartSeconds = timeToSeconds(settings.start_time);
      const classEndSeconds = timeToSeconds(settings.end_time);
      const gracePeriodSeconds = settings.grace_period_mins * 60;

      if (!existingLog) {
        const isLate = nowSeconds > (classStartSeconds + gracePeriodSeconds);
        const status = isLate ? 'Late' : 'Present';

        await dbService.addAttendanceLog(student.id, todayStr, nowIso, status, selectedCourse);

        setFeedback({
          status: 'success',
          name: `Welcome, ${student.name}!`,
          details: `Check-in for ${selectedCourse} recorded at ${currentTimeStr}. Status: ${status}`
        });
        showToast(`Check-in successful: ${student.name}`, 'success');
        onLogAdded();
      } else {
        if (existingLog.check_out) {
          setFeedback({
            status: 'success',
            name: `${student.name}`,
            details: `Attendance fully logged for ${selectedCourse} today. (Check-in: ${new Date(existingLog.check_in).toLocaleTimeString()} | Check-out: ${new Date(existingLog.check_out).toLocaleTimeString()})`
          });
        } else {
          const isEarlyExit = nowSeconds < classEndSeconds;
          const newStatus = isEarlyExit ? 'Early Exit' : 'Completed';

          await dbService.updateAttendanceLog(existingLog.id, nowIso, newStatus);

          setFeedback({
            status: 'success',
            name: `Goodbye, ${student.name}!`,
            details: isEarlyExit
              ? `Early checkout for ${selectedCourse} recorded at ${currentTimeStr}. Status updated to: Early Exit.`
              : `Checkout for ${selectedCourse} recorded at ${currentTimeStr}. Status updated to: Completed.`
          });
          showToast(`Checkout successful: ${student.name}`, 'success');
          onLogAdded();
        }
      }
    } catch (err) {
      console.error('Error handling attendance database transaction:', err);
      setFeedback({
        status: 'error',
        name: 'Database Sync Failure',
        details: `Face matches but database update failed: ${err.message || err.details || String(err)}`
      });
      showToast('Database write error.', 'error');
    } finally {
      triggerCooldown();
    }
  };

  const recentLogs = useMemo(() => {
    return attendanceLogs.slice(0, 5);
  }, [attendanceLogs]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Live Facial Attendance Scanner</h1>
          <p className="page-subtitle">Stand in front of the camera to register check-in or exit attendance.</p>
        </div>

        <div className="filter-group" style={{ minWidth: '240px', margin: 0 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Course Session</label>
          <select
            className="filter-control"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          >
            {uniqueCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
            {uniqueCourses.length === 0 && <option value="General">General</option>}
          </select>
        </div>
      </div>

      <div className="scanner-grid">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className={`camera-wrapper ${scanStatus === 'matching' ? 'matching' :
              feedback.status === 'success' ? 'success' :
                feedback.status === 'error' ? 'error' : ''
            }`}>
            {cameraState === 'loading' && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Initializing hardware camera stream...</p>
              </div>
            )}
            {cameraState === 'error' && (
              <div className="loading-overlay" style={{ background: '#180a0c', padding: '1.5rem', textAlign: 'center' }}>
                <AlertTriangle size={48} style={{ color: 'var(--accent-rose)', marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '0.5rem' }}>Webcam Connection Blocked</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', maxWidth: '300px' }}>
                  Please click the lock/camera icon in your browser's address bar, set **Camera** to **Allow**, and make sure no other apps are using it.
                </p>
                <button className="btn-primary" onClick={startCamera}>Retry Camera Connection</button>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="webcam-feed"
              onPlay={() => setCameraState('active')}
            />
            {cameraState === 'active' && (
              <>
                <div className="scanner-laser"></div>
                <div className="scanner-target-box">
                  <div className="scanner-target-box-corners-2"></div>
                </div>
                <div className="scanner-overlay">
                  <div className="scanner-status-tag">
                    <span className={`scanner-indicator ${scanStatus === 'matching' ? 'active' :
                        feedback.status === 'success' ? 'success' :
                          feedback.status === 'error' ? 'error' : ''
                      }`}></span>
                    <span>
                      {scanStatus === 'ready' && 'LOOK HERE TO SCAN'}
                      {scanStatus === 'matching' && 'COMPARING EMBEDDINGS...'}
                      {scanStatus === 'cooldown' && 'LOCKOUT ACTIVE'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          {cameraState === 'active' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '1rem 2rem', fontSize: '1.1rem' }}
                onClick={handleManualScan}
                disabled={scanStatus !== 'ready'}
              >
                <Camera size={20} />
                Scan Attendance Now
              </button>
            </div>
          )}
        </div>

        <div className="attendance-panel">
          <div className="scan-feedback-container" style={{
            borderColor: feedback.status === 'success' ? 'var(--accent-emerald)' :
              feedback.status === 'error' ? 'var(--accent-rose)' : 'var(--border-light)'
          }}>
            {feedback.status === 'idle' && (
              <>
                <div className="feedback-icon-wrapper loading">
                  <Camera size={24} />
                </div>
                <h4 className="feedback-title">Camera Scanning Active</h4>
                <p className="feedback-desc">Place your face in the box. Scanner handles check-in/checkout automatically.</p>
              </>
            )}
            {feedback.status === 'loading' && (
              <>
                <div className="feedback-icon-wrapper loading">
                  <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
                </div>
                <h4 className="feedback-title">{feedback.name}</h4>
                <p className="feedback-desc">{feedback.details}</p>
              </>
            )}
            {feedback.status === 'success' && (
              <>
                <div className="feedback-icon-wrapper success">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="feedback-title" style={{ color: 'var(--accent-emerald)' }}>{feedback.name}</h4>
                <p className="feedback-desc" style={{ color: '#fff' }}>{feedback.details}</p>
              </>
            )}
            {feedback.status === 'error' && (
              <>
                <div className="feedback-icon-wrapper error">
                  <XCircle size={24} />
                </div>
                <h4 className="feedback-title" style={{ color: 'var(--accent-rose)' }}>{feedback.name}</h4>
                <p className="feedback-desc" style={{ color: 'var(--text-secondary)' }}>{feedback.details}</p>
              </>
            )}
          </div>
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--accent-indigo)' }} />
              Recent Scans Today
            </h3>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No attendance scans processed yet today.
              </div>
            ) : (
              <div className="logs-scrollable">
                {recentLogs.map((log) => (
                  <div className="log-item" key={log.id}>
                    <div className="log-info-left">
                      <span className="log-student-name">{log.students?.name}</span>
                      <span className="log-student-id">{log.student_id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Course: {log.course || 'General'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`status-pill ${log.status.toLowerCase().replace(' ', '-')}`}>
                        {log.status}
                      </span>
                      <div className="log-time-badge">
                        <Clock size={12} />
                        {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {log.check_out && ` - ${new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInstantEnroll && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: '#fff' }}>
              Instant Student Registration
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              An unregistered face was detected. Register this student immediately to verify their profile and check them in.
            </p>
            <div className="modal-grid">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '16px', border: '2px solid var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', background: '#000' }}>
                  <img src={instantFaceImage} alt="Captured face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="course-tag" style={{ marginTop: '1rem', background: 'rgba(99, 102, 241, 0.1)' }}>
                  <Sparkles size={14} />
                  Biometric Vector Locked
                </div>
              </div>
              <form onSubmit={handleInstantEnrollSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Student ID (Registration Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. AGE/17/2917"
                    className="form-control"
                    value={instantStudentId}
                    onChange={(e) => setInstantStudentId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="form-control"
                    value={instantStudentName}
                    onChange={(e) => setInstantStudentName(e.target.value)}
                    required
                  />
                </div>
                 <div className="form-group">
                  <label className="form-label">Courses / Programs (Select all that apply)</label>
                  <div className="course-tag-pills" style={{ marginTop: '0.5rem' }}>
                    {uniqueCourses.map(course => {
                      const isSelected = instantStudentCourses.includes(course);
                      return (
                        <button
                          key={course}
                          type="button"
                          className={`course-tag ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleInstantCourse(course)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            borderColor: isSelected ? 'var(--accent-indigo)' : 'var(--border-light)',
                            color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            border: '1px solid'
                          }}
                        >
                          {isSelected ? <CheckCircle2 size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />}
                          {course}
                        </button>
                      );
                    })}
                  </div>
                  {instantStudentCourses.length === 0 && (
                    <small style={{ color: 'var(--accent-rose)', display: 'block', marginTop: '0.5rem' }}>
                      * Please select at least one course.
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. student@university.edu"
                    className="form-control"
                    value={instantStudentEmail}
                    onChange={(e) => setInstantStudentEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={handleInstantDiscard} style={{ flex: 1 }} disabled={isInstantSubmitting}>
                    Discard Capture
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isInstantSubmitting}>
                    {isInstantSubmitting ? 'Registering...' : 'Register & Check In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ENROLL TAB COMPONENT
// ==========================================
function EnrollTab({ onEnrollSuccess, showToast, classSettings }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourses, setStudentCourses] = useState([]);

  const availableCourses = useMemo(() => {
    if (classSettings && classSettings.courses && classSettings.courses.length > 0) {
      return classSettings.courses;
    }
    return ['General'];
  }, [classSettings]);

  const toggleCourse = (course) => {
    if (studentCourses.includes(course)) {
      setStudentCourses(studentCourses.filter(c => c !== course));
    } else {
      setStudentCourses([...studentCourses, course]);
    }
  };
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setCameraActive(true);
      setCapturedImage(null);
      setFaceDescriptor(null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Error accessing webcam for enrollment:', err);
      showToast('Could not access webcam.', 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessingFace(true);
    setCapturedImage(null);
    setFaceDescriptor(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const imgBase64 = canvas.toDataURL('image/jpeg');
    setCapturedImage(imgBase64);
    try {
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.65 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        faceapi.draw.drawFaceLandmarks(canvas, detection.landmarks);
        const descArray = Array.from(detection.descriptor);
        setFaceDescriptor(descArray);
        showToast('Face analyzed! Ready to enroll.', 'success');
      } else {
        showToast('No face detected. Capture again.', 'error');
        setCapturedImage(null);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      showToast('Error analyzing face biometric.', 'error');
      setCapturedImage(null);
    } finally {
      setIsProcessingFace(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !studentName || !studentEmail || !faceDescriptor) {
      showToast('Please fill all fields and capture face.', 'warning');
      return;
    }
    if (studentCourses.length === 0) {
      showToast('Please add at least one course.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await dbService.addStudent({
        id: studentId.trim().toUpperCase(),
        name: studentName.trim(),
        email: studentEmail.trim(),
        courses: studentCourses,
        face_descriptor: faceDescriptor
      });
      showToast(`Successfully enrolled ${studentName}!`, 'success');
      setStudentId('');
      setStudentName('');
      setStudentEmail('');
      setStudentCourses([]);
      setCapturedImage(null);
      setFaceDescriptor(null);
      onEnrollSuccess();
      startCamera();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to register student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Administrator Student Enrollment</h1>
        <p className="page-subtitle">Input student credentials, capture face biometric, and save to directory.</p>
      </div>
      <div className="enroll-grid">
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Biometric Scan</h3>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid var(--border-light)' }}>
            {isProcessingFace && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Analyzing facial nodes & vectors...</p>
              </div>
            )}
            {!capturedImage && (
              <video ref={videoRef} autoPlay muted playsInline className="webcam-feed" />
            )}
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: capturedImage ? 'block' : 'none' }} />
          </div>
          <div className="capture-btn-group">
            {cameraActive && !capturedImage && (
              <button className="btn-primary" onClick={handleCapture} style={{ flex: 1 }}>
                <Camera size={18} /> Capture Face
              </button>
            )}
            {capturedImage && (
              <button className="btn-secondary" onClick={() => { setCapturedImage(null); setFaceDescriptor(null); startCamera(); }} style={{ flex: 1 }}>
                Retake Photo
              </button>
            )}
          </div>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Student Profile Data</h3>
          <form onSubmit={handleEnrollSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Student ID (Registration Number)</label>
                <input type="text" placeholder="e.g. STU202604" className="form-control" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" placeholder="e.g. Jane Doe" className="form-control" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Courses / Programs (Select all that apply)</label>
                <div className="course-tag-pills" style={{ marginTop: '0.5rem' }}>
                  {availableCourses.map(course => {
                    const isSelected = studentCourses.includes(course);
                    return (
                      <button
                        key={course}
                        type="button"
                        className={`course-tag ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleCourse(course)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          borderColor: isSelected ? 'var(--accent-indigo)' : 'var(--border-light)',
                          color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          border: '1px solid'
                        }}
                      >
                        {isSelected ? <CheckCircle2 size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />}
                        {course}
                      </button>
                    );
                  })}
                </div>
                {studentCourses.length === 0 && (
                  <small style={{ color: 'var(--accent-rose)', display: 'block', marginTop: '0.5rem' }}>
                    * Please select at least one course.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" placeholder="e.g. janedoe@university.edu" className="form-control" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: faceDescriptor ? 'var(--accent-emerald)' : 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                {faceDescriptor ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{faceDescriptor ? 'Biometric Face Descriptor Recorded' : 'Awaiting Biometric Face Capture'}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={isSubmitting || !faceDescriptor}>
              {isSubmitting ? (
                <>Saving Profiles...</>
              ) : (
                <>
                  <UserPlus size={18} />
                  Register & Enroll Student
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD COMPONENT
// ==========================================
function DashboardTab({ students, attendanceLogs, classSettings, onSettingsUpdated, onStudentDeleted, dbLoading, showToast }) {
  const [subTab, setSubTab] = useState('logs'); // 'logs', 'students', 'settings'

  // Settings Form States
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [coursesList, setCoursesList] = useState([]);
  const [newCourseInput, setNewCourseInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Initialize Settings Form inputs
  useEffect(() => {
    if (classSettings) {
      setStartTime(classSettings.start_time);
      setEndTime(classSettings.end_time);
      setGracePeriod(classSettings.grace_period_mins);
      setCoursesList(classSettings.courses || ['General']);
    }
  }, [classSettings]);

  // Reports Filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Extract unique courses for filtering
  const uniqueCourses = useMemo(() => {
    const courses = students.flatMap(s => s.courses || (s.course ? [s.course] : [])).filter(Boolean);
    return [...new Set(courses)];
  }, [students]);

  // Format date helper
  const getTodayISOStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalStudents = students.length;

    // Filter logs for selected date (default today for stats dashboard card metrics)
    const todayStr = getTodayISOStr();
    const todayLogs = attendanceLogs.filter(log => log.date === todayStr);

    const presentToday = todayLogs.filter(log => log.status === 'Present' || log.status === 'Completed' || log.status === 'Early Exit').length;
    const lateToday = todayLogs.filter(log => log.status === 'Late').length;
    const earlyExitToday = todayLogs.filter(log => log.status === 'Early Exit').length;

    return {
      totalStudents,
      presentToday,
      lateToday,
      earlyExitToday
    };
  }, [students, attendanceLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      const studentName = log.students?.name?.toLowerCase() || '';
      const studentEmail = log.students?.email?.toLowerCase() || '';
      const studentId = log.student_id?.toLowerCase() || '';
      const studentCourse = (log.course || log.students?.course || '').toLowerCase();
      const searchLower = searchFilter.toLowerCase();

      const matchesSearch = studentName.includes(searchLower) ||
        studentEmail.includes(searchLower) ||
        studentId.includes(searchLower);

      const matchesDate = dateFilter === '' || log.date === dateFilter;
      const matchesStatus = statusFilter === '' || log.status === statusFilter;
      const matchesCourse = courseFilter === '' || studentCourse === courseFilter.toLowerCase();

      return matchesSearch && matchesDate && matchesStatus && matchesCourse;
    });
  }, [attendanceLogs, searchFilter, dateFilter, statusFilter, courseFilter]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (coursesList.length === 0) {
      showToast('You must have at least one course in the global list.', 'warning');
      return;
    }
    setIsSavingSettings(true);
    try {
      await dbService.updateClassSettings({
        start_time: startTime,
        end_time: endTime,
        grace_period_mins: gracePeriod,
        courses: coursesList
      });
      showToast('Class configurations updated successfully!', 'success');
      onSettingsUpdated();
    } catch (err) {
      console.error(err);
      showToast('Error updating class times settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddGlobalCourse = (e) => {
    e.preventDefault();
    const trimmed = newCourseInput.trim();
    if (!trimmed) return;
    if (coursesList.includes(trimmed)) {
      showToast('Course already exists in the global list.', 'warning');
      return;
    }
    setCoursesList([...coursesList, trimmed]);
    setNewCourseInput('');
  };

  const handleRemoveGlobalCourse = (courseToRemove) => {
    if (coursesList.length <= 1) {
      showToast('You must keep at least one course in the system.', 'warning');
      return;
    }
    setCoursesList(coursesList.filter(c => c !== courseToRemove));
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete student ${studentName}? All their attendance history will be permanently deleted.`)) {
      return;
    }

    try {
      await dbService.deleteStudent(studentId);
      showToast(`Permanently deleted student profile: ${studentName}`, 'success');
      onStudentDeleted();
    } catch (err) {
      console.error(err);
      showToast('Error deleting student profile.', 'error');
    }
  };

  // CSV Report Export helper
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No logs match current filters to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Student ID', 'Name', 'Course Session', 'Email', 'Check-In Timestamp', 'Check-Out Timestamp', 'Status'];
    const rows = filteredLogs.map(log => [
      log.date,
      log.student_id,
      log.students?.name || 'Unknown',
      log.course || log.students?.course || 'General',
      log.students?.email || 'N/A',
      log.check_in ? new Date(log.check_in).toLocaleString() : '',
      log.check_out ? new Date(log.check_out).toLocaleString() : '',
      log.status
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Facial_Attendance_Report_${dateFilter || 'all_dates'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-layout">
      {/* Upper Metrics Grid */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon-box indigo">
            <UserCheck size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats.totalStudents}</span>
            <span className="metric-label">Total Enrolled</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats.presentToday}</span>
            <span className="metric-label">Present Today</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Clock size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats.lateToday}</span>
            <span className="metric-label">Lateness Logs</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box rose">
            <XCircle size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats.earlyExitToday}</span>
            <span className="metric-label">Early Exit Logs</span>
          </div>
        </div>
      </div>

      {/* Main glass card table wrapper */}
      <div className="glass-card" style={{ minHeight: '500px' }}>
        <div className="tabs-container">
          <button
            className={`tab-trigger ${subTab === 'logs' ? 'active' : ''}`}
            onClick={() => setSubTab('logs')}
          >
            Attendance Logs & Reports
          </button>
          <button
            className={`tab-trigger ${subTab === 'students' ? 'active' : ''}`}
            onClick={() => setSubTab('students')}
          >
            Student Directory
          </button>
          <button
            className={`tab-trigger ${subTab === 'settings' ? 'active' : ''}`}
            onClick={() => setSubTab('settings')}
          >
            Class Hours Settings
          </button>
        </div>

        {dbLoading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Synchronizing directory updates...</p>
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: LOGS & REPORTS */}
            {subTab === 'logs' && (
              <div>
                {/* Filter and Export Bar */}
                <div className="filter-bar">
                  <div className="filter-group" style={{ flex: '1 1 200px' }}>
                    <label>Search Directory</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search ID, Name, Email..."
                        className="filter-control"
                        style={{ width: '100%', paddingLeft: '2.2rem' }}
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                      />
                      <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Filter Date</label>
                    <input
                      type="date"
                      className="filter-control"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Filter Course</label>
                    <select
                      className="filter-control"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                    >
                      <option value="">All Courses</option>
                      {uniqueCourses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Filter Status</label>
                    <select
                      className="filter-control"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Early Exit">Early Exit</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <button className="btn-primary" onClick={exportToCSV} style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem', borderRadius: '10px', height: '39px' }}>
                    <Download size={16} />
                    Export CSV Report
                  </button>
                </div>

                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 0' }}>
                    No matching attendance logs found.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table-glass">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Student Name & ID</th>
                          <th>Course Session</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.date}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: '#fff' }}>{log.students?.name}</strong>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{log.student_id}</span>
                              </div>
                            </td>
                            <td style={{ color: '#fff' }}>{log.course || log.students?.course || 'General'}</td>
                            <td>
                              {log.check_in ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Clock size={14} style={{ color: 'var(--accent-indigo)' }} />
                                  {new Date(log.check_in).toLocaleTimeString()}
                                </span>
                              ) : (
                                '--'
                              )}
                            </td>
                            <td>
                              {log.check_out ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Clock size={14} style={{ color: 'var(--accent-purple)' }} />
                                  {new Date(log.check_out).toLocaleTimeString()}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Exit</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-pill ${log.status.toLowerCase().replace(' ', '-')}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: STUDENTS DIRECTORY */}
            {subTab === 'students' && (
              <div>
                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 0' }}>
                    No students registered yet. Select the 'Enroll Student' tab above to register.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table-glass">
                      <thead>
                        <tr>
                          <th>Registration Number</th>
                          <th>Name</th>
                          <th>Courses Enrolled</th>
                          <th>Email Address</th>
                          <th>Enrolled Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>{student.id}</td>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{student.name}</td>
                            <td>
                              <div className="course-tag-pills">
                                {(student.courses || [student.course]).filter(Boolean).map(course => (
                                  <span key={course} className="course-badge">{course}</span>
                                ))}
                                {!(student.courses?.length > 0 || student.course) && (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                )}
                              </div>
                            </td>
                            <td>{student.email}</td>
                            <td>{new Date(student.created_at).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="btn-danger"
                                onClick={() => handleDeleteStudent(student.id, student.name)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: CLASS HOURS SETTINGS */}
            {subTab === 'settings' && (
              <div style={{ maxWidth: '600px' }}>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>Configure Global Class Hours</h4>
                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">Standard Check-In Start Time</label>
                    <input
                      type="time"
                      step="1"
                      className="form-control"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grace Period (Minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      min="0"
                      max="180"
                      required
                    />
                    <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Arrivals after (Start Time + Grace Period) will be marked as **Late** in logs.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Standard Exit Time (End of Class)</label>
                    <input
                      type="time"
                      step="1"
                      className="form-control"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Checkouts before this time are automatically cataloged as **Early Exit** timestamps.
                    </small>
                  </div>

                  <div className="form-group" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <label className="form-label" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>Course Directory</label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Define the global list of courses. These populate the scanner dropdown and enrollment choices.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. CS 101"
                        className="form-control"
                        value={newCourseInput}
                        onChange={(e) => setNewCourseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddGlobalCourse(e);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleAddGlobalCourse}
                        style={{ padding: '0 1.25rem', borderRadius: '12px' }}
                      >
                        + Add Course
                      </button>
                    </div>

                    <div className="course-tag-pills" style={{ minHeight: '40px', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                      {coursesList.map(course => (
                        <span key={course} className="course-tag">
                          {course}
                          <button
                            type="button"
                            onClick={() => handleRemoveGlobalCourse(course)}
                            title={`Remove ${course}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {coursesList.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No courses added.
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSavingSettings}
                    style={{ marginTop: '1.5rem' }}
                  >
                    {isSavingSettings ? 'Saving Settings...' : 'Save Class Configurations'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ADMIN LOGIN COMPONENT
// ==========================================
function AdminLogin({ onLoginSuccess, showToast }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      showToast('Please enter the administrator password.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await dbService.verifyPassword(password);
      showToast('Dashboard unlocked successfully.', 'success');
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Authentication failed. Please verify the password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header-icon">
          <Lock size={32} />
        </div>
        <h2 className="login-title">Administrator Access</h2>
        <p className="login-subtitle">
          Please enter the administrator password to unlock management panels, settings, and student registration.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Unlocking...' : 'Unlock Dashboard'}
          </button>
        </form>
        <div className="login-footer-status">
          <Database size={14} />
          <span>
            {isSupabaseConfigured ? 'Database Connected' : 'Offline Mode (Default: admin123)'}
          </span>
        </div>
      </div>
    </div>
  );
}
