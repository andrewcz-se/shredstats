import React, { useState, useEffect, useContext, createContext, useMemo, forwardRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Home,
  LayoutList,
  BarChart2,
  LogOut,
  User,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  Guitar,
  Users,
  Menu,
  ArrowRight,
  Download,
  Printer,
  Mail,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection 
} from 'firebase/firestore';

// --- FIREBASE SETUP ---

// Helper to determine config. Prioritizes Vite env vars, falls back to system config for preview.
const getFirebaseConfig = () => {
  // NOTE: For local Vite development, uncomment the block below. 
  // We have commented it out to prevent environment warnings in the preview.
  
  const viteEnv = import.meta.env;
  if (viteEnv && viteEnv.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: viteEnv.VITE_FIREBASE_API_KEY,
      authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: viteEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: viteEnv.VITE_FIREBASE_APP_ID
    };
  }
  

  // Fallback for the AI preview environment
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
      apiKey: "YOUR_VITE_FIREBASE_API_KEY",
      authDomain: "YOUR_VITE_FIREBASE_AUTH_DOMAIN",
      projectId: "YOUR_VITE_FIREBASE_PROJECT_ID",
      storageBucket: "YOUR_VITE_FIREBASE_STORAGE_BUCKET",
      messagingSenderId: "YOUR_VITE_FIREBASE_MESSAGING_SENDER_ID",
      appId: "YOUR_VITE_FIREBASE_APP_ID"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'guitar-tracker-default';

// --- DATA (Mock JSON) ---

const GUITARISTS_DATA = [
  {
    "id": "eddie_van_halen",
    "name": "Eddie Van Halen",
    "bio": "A Dutch-American musician, songwriter, and producer. He was the main songwriter and lead guitarist of the American rock band Van Halen."
  },
  {
    "id": "dimebag_darrell",
    "name": "Dimebag Darrell",
    "bio": "An American musician and songwriter, best known as the guitarist and a founding member of Pantera and Damageplan."
  },
  {
    "id": "alexi_laiho",
    "name": "Alexi Laiho",
    "bio": "A Finnish guitarist, composer, and vocalist. He was best known as the lead guitarist, lead vocalist, and founding member of the melodic death metal band Children of Bodom."
  }
];

const TECHNIQUES_DATA = [
  {
    "id": "legato",
    "name": "Legato",
    "description": "Playing musical notes smoothly and connected, often using hammer-ons and pull-offs to avoid picking every note.",
    "guitaristId": "eddie_van_halen",
    "defaultMetrics": [
      { "id": "speed", "label": "Speed (BPM)", "unit": "bpm" },
      { "id": "accuracy", "label": "Accuracy", "unit": "%" }
    ]
  },
  {
    "id": "two_hand_tapping",
    "name": "Two-Hand Tapping",
    "description": "Using both hands on the fretboard to tap notes, allowing for wide intervals and fast passages.",
    "guitaristId": "eddie_van_halen",
    "defaultMetrics": [
      { "id": "speed", "label": "Speed (BPM)", "unit": "bpm" },
      { "id": "cleanliness", "label": "Cleanliness (1-10)", "unit": "" }
    ]
  },
  {
    "id": "divebombs",
    "name": "Divebombs",
    "description": "Using the whammy bar to dramatically drop the pitch of a note and, optionally, return it.",
    "guitaristId": "dimebag_darrell",
    "defaultMetrics": [
      { "id": "return_pitch", "label": "Return to Pitch Accuracy", "unit": "%" }
    ]
  },
  {
    "id": "pinch_harmonics",
    "name": "Pinch Harmonics",
    "description": "A guitar technique to achieve high-pitched, 'squealing' harmonics by grazing the string with the thumb of the picking hand.",
    "guitaristId": "dimebag_darrell",
    "defaultMetrics": [
      { "id": "consistency", "label": "Consistency", "unit": "%" }
    ]
  },
  {
    "id": "shred_legato",
    "name": "Shred Legato",
    "description": "A very fast, aggressive form of legato playing often incorporating 3-note-per-string scales and complex patterns.",
    "guitaristId": "alexi_laiho",
    "defaultMetrics": [
      { "id": "speed", "label": "Speed (BPM)", "unit": "bpm" },
      { "id": "stamina", "label": "Stamina (seconds)", "unit": "sec" }
    ]
  }
];

// --- CONTEXT ---

// Data Context: Holds current user's plans and progress
const DataContext = createContext(null);
const useData = () => useContext(DataContext);

// --- HELPER COMPONENTS ---

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      ref={ref}
      disabled={isLoading || props.disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
      {props.children}
    </button>
  );
});

const Input = React.forwardRef(({ className, icon: Icon, ...props }, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="text-gray-400" size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  );
});

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

// --- CORE COMPONENTS ---

const StatGraph = ({ data, dataKey, name, unit, isPrint = false }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 p-4">No data to display.</div>;
  }

  const chartComponents = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date" 
        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      />
      <YAxis label={{ value: unit, angle: -90, position: 'insideLeft', dy: 30, dx: 12 }} />
      <Tooltip
        labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        formatter={(value, name) => [`${value} ${unit}`, name]}
      />
      <Legend verticalAlign="top" align="right" />
      <Line type="monotone" dataKey={dataKey} name={name} stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
    </>
  );

  if (isPrint) {
    return (
      <LineChart 
        width={700} 
        height={300} 
        data={data} 
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        {chartComponents}
      </LineChart>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        {chartComponents}
      </LineChart>
    </ResponsiveContainer>
  );
};

const TechniquePickerModal = ({ isOpen, onClose, onSelectTechnique }) => {
  const [selectedGuitarist, setSelectedGuitarist] = useState(null);

  const techniquesByGuitarist = GUITARISTS_DATA.map(guitarist => ({
    ...guitarist,
    techniques: TECHNIQUES_DATA.filter(t => t.guitaristId === guitarist.id)
  }));

  if (selectedGuitarist) {
    const guitarist = techniquesByGuitarist.find(g => g.id === selectedGuitarist);
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={guitarist.name}>
        <div className="flex flex-col space-y-3">
          <Button variant="secondary" onClick={() => setSelectedGuitarist(null)} className="self-start">
            <ChevronLeft size={16} className="mr-1" /> Back to Guitarists
          </Button>
          <p className="text-sm text-gray-600">{guitarist.bio}</p>
          <hr />
          <h4 className="font-semibold">Techniques:</h4>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {guitarist.techniques.map(tech => (
              <div key={tech.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tech.name}</span>
                  <Button size="sm" onClick={() => onSelectTechnique(tech.id)}>
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Technique">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {techniquesByGuitarist.map(guitarist => (
          <button
            key={guitarist.id}
            onClick={() => setSelectedGuitarist(guitarist.id)}
            className="rounded-lg p-4 border border-gray-300 hover:bg-gray-100 hover:shadow-md transition text-left"
          >
            <h4 className="font-semibold text-lg text-blue-600">{guitarist.name}</h4>
            <p className="text-sm text-gray-500">
              {guitarist.techniques.map(t => t.name).join(', ')}
            </p>
          </button>
        ))}
      </div>
    </Modal>
  );
};

// --- VIEW COMPONENTS ---

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let msg = 'An error occurred';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      if (err.code === 'auth/user-not-found') msg = 'No user found with this email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center mb-6">
          <Guitar size={48} className="mx-auto text-blue-600 mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Shred Stats!</h2>
          <p className="text-gray-500">{isSignUp ? 'Create an account' : 'Sign in to your account'}</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 flex items-center text-sm">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <Input
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ setPage, page }) => {
  const { user } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, page: 'dashboard' },
    { name: 'Plans', icon: LayoutList, page: 'plans' },
    { name: 'Statistics', icon: BarChart2, page: 'statistics' },
  ];

  const NavButton = ({ item }) => (
    <Button
      variant={page === item.page ? 'primary' : 'ghost'}
      className="w-full justify-start text-left"
      onClick={() => {
        setPage(item.page);
        setIsMobileMenuOpen(false);
      }}
    >
      <item.icon size={18} className="mr-3" />
      {item.name}
    </Button>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 flex md:hidden items-center justify-between bg-white p-4 border-b border-gray-200 print-hide">
        <div className="flex items-center space-x-2">
          <Guitar size={24} className="text-blue-600" />
          <span className="font-bold text-lg">Shred Stats</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu size={24} />
        </Button>
      </header>

      {/* Sidebar / Mobile Menu */}
      <aside
        className={`fixed md:sticky top-0 z-20 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out print-hide
                   ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                   md:translate-x-0 md:flex md:flex-col md:w-64 p-4`}
      >
        <div className="flex-grow">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center space-x-3 mb-6">
            <Guitar size={32} className="text-blue-600" />
            <span className="font-bold text-2xl text-gray-800">Shred Stats</span>
          </div>

          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <NavButton key={item.page} item={item} />
            ))}
          </nav>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4 overflow-hidden">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
              <User size={20} />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            <LogOut size={18} className="mr-3" />
            Log Out
          </Button>
        </div>
      </aside>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black bg-opacity-50 md:hidden print-hide" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};


const DashboardView = () => {
  const { userData, updateUserData } = useData();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [progressData, setProgressData] = useState({});

  const plans = useMemo(() => userData.plans || [], [userData]);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    } else if (selectedPlanId && !plans.find(p => p.id === selectedPlanId)) {
      setSelectedPlanId(plans[0]?.id || null);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);
  
  const planTechniques = useMemo(() => {
    return selectedPlan ? selectedPlan.techniqueIds.map(id => TECHNIQUES_DATA.find(t => t.id === id)) : [];
  }, [selectedPlan]);

  // Load progress for selected date/plan
  useEffect(() => {
    if (selectedPlanId && userData.progress) {
      const entry = userData.progress.find(p => p.planId === selectedPlanId && p.date === selectedDate);
      if (entry) {
        setProgressData(entry.metrics);
      } else {
        const emptyData = {};
        planTechniques.forEach(tech => {
          tech.defaultMetrics.forEach(metric => {
            emptyData[`${tech.id}_${metric.id}`] = '';
          });
        });
        setProgressData(emptyData);
      }
    }
  }, [selectedDate, selectedPlanId, userData.progress, planTechniques]);

  const handleMetricChange = (techId, metricId, value) => {
    setProgressData(prev => ({
      ...prev,
      [`${techId}_${metricId}`]: value
    }));
  };

  const handleSaveProgress = async () => {
    if (!userData.progress) return;
    
    const existingEntryIndex = userData.progress.findIndex(p => p.planId === selectedPlanId && p.date === selectedDate);
    
    const metricsToSave = {};
    Object.keys(progressData).forEach(key => {
      if (progressData[key] !== '') {
        metricsToSave[key] = Number(progressData[key]);
      }
    });

    let newProgress = [...userData.progress];

    if (Object.keys(metricsToSave).length === 0) {
      if (existingEntryIndex > -1) {
        newProgress.splice(existingEntryIndex, 1);
        await updateUserData({ progress: newProgress });
      }
      alert("No data to save.");
      return;
    }

    const newEntry = {
      id: `entry_${Date.now()}`,
      planId: selectedPlanId,
      date: selectedDate,
      metrics: metricsToSave
    };

    if (existingEntryIndex > -1) {
      newProgress[existingEntryIndex] = { ...newProgress[existingEntryIndex], ...newEntry };
    } else {
      newProgress.push(newEntry);
    }
    
    await updateUserData({ progress: newProgress });
    //alert("Progress saved!");
  };
  
  const getWeekDays = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getUTCDay(); 
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(date.setUTCDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      return d.toISOString().split('T')[0];
    });
  };
  
  const weekDays = getWeekDays(selectedDate);
  
  const progressByDay = weekDays.reduce((acc, date) => {
    const entry = userData.progress?.find(p => p.planId === selectedPlanId && p.date === date);
    acc[date] = entry ? Object.keys(entry.metrics).length > 0 : false;
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {plans.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg text-gray-600">You don't have any practice plans yet.</p>
          <p className="text-gray-500 mb-4">Go to the "Plans" tab to create one!</p>
          <Target size={48} className="mx-auto text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.planName}</option>
              ))}
            </select>
             <Input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
             />
          </div>
          
          <div className="mb-8 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">This Week's Progress</h3>
            <div className="flex gap-2 min-w-max pb-2">
              {weekDays.map(date => {
                const d = new Date(date + 'T12:00:00Z'); 
                const isSelected = date === selectedDate;
                const hasProgress = progressByDay[date];
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition min-w-[80px]
                                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}
                                ${hasProgress && !isSelected ? 'bg-green-50' : ''}`}
                  >
                    <span className="text-sm font-medium text-gray-500">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-2xl font-bold text-gray-800">
                      {d.getUTCDate()}
                    </span>
                    {hasProgress && (
                      <CheckCircle2 size={16} className="text-green-500 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Log Practice for {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <div className="space-y-6">
              {planTechniques.length === 0 && <p className="text-gray-500">This plan has no techniques. Edit the plan to add some.</p>}
              {planTechniques.map(tech => (
                <div key={tech.id}>
                  <h3 className="text-xl font-semibold text-gray-700">{tech.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {tech.defaultMetrics.map(metric => {
                      const key = `${tech.id}_${metric.id}`;
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-600">
                            {metric.label} {metric.unit && `(${metric.unit})`}
                          </label>
                          <Input
                            type="number"
                            value={progressData[key] || ''}
                            onChange={(e) => handleMetricChange(tech.id, metric.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProgress}>
                  <Save size={18} className="mr-2" /> Save Progress
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PlansView = () => {
  const { userData, updateUserData } = useData();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); 

  const plans = userData.plans || [];

  const startNewPlan = () => {
    setCurrentPlan({
      id: `plan_${Date.now()}`,
      planName: 'New Practice Plan',
      techniqueIds: []
    });
    setIsEditing(true);
  };

  const startEditingPlan = (plan) => {
    setCurrentPlan(plan);
    setIsEditing(true);
  };

  const savePlan = async () => {
    const existingPlanIndex = plans.findIndex(p => p.id === currentPlan.id);
    const newPlans = [...plans];
    
    if (existingPlanIndex > -1) {
      newPlans[existingPlanIndex] = currentPlan;
    } else {
      newPlans.push(currentPlan);
    }

    await updateUserData({ plans: newPlans });
    setIsEditing(false);
    setCurrentPlan(null);
  };

  const deletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan? All associated progress will be lost.")) return;
    
    const newPlans = plans.filter(p => p.id !== planId);
    const newProgress = (userData.progress || []).filter(p => p.planId !== planId);
    
    await updateUserData({ plans: newPlans, progress: newProgress });
  };

  const addTechniqueToPlan = (techId) => {
    if (!currentPlan.techniqueIds.includes(techId)) {
      setCurrentPlan(prev => ({
        ...prev,
        techniqueIds: [...prev.techniqueIds, techId]
      }));
    }
    setIsPickerOpen(false);
  };

  const removeTechniqueFromPlan = (techId) => {
    setCurrentPlan(prev => ({
      ...prev,
      techniqueIds: prev.techniqueIds.filter(id => id !== techId)
    }));
  };

  if (isEditing) {
    const planTechniques = currentPlan.techniqueIds.map(id => TECHNIQUES_DATA.find(t => t.id === id));
    return (
      <div className="p-6">
        <Button variant="secondary" onClick={() => setIsEditing(false)} className="mb-4">
          <ChevronLeft size={16} className="mr-1" /> Back to Plans
        </Button>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Plan</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">Plan Name</label>
            <Input
              type="text"
              value={currentPlan.planName}
              onChange={(e) => setCurrentPlan(prev => ({ ...prev, planName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <hr className="my-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Techniques in this plan</h3>
          <div className="space-y-3 mb-4">
            {planTechniques.length === 0 && (
              <p className="text-gray-500">No techniques added yet.</p>
            )}
            {planTechniques.map(tech => {
              const guitarist = GUITARISTS_DATA.find(g => g.id === tech.guitaristId);
              return (
                <div key={tech.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                  <div>
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({guitarist.name})</span>
                  </div>
                  <Button variant="danger" size="icon" onClick={() => removeTechniqueFromPlan(tech.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={() => setIsPickerOpen(true)}>
              <Plus size={18} className="mr-2" /> Add Technique
            </Button>
            <Button onClick={savePlan}>
              <Save size={18} className="mr-2" /> Save Plan
            </Button>
          </div>
        </div>
        <TechniquePickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectTechnique={addTechniqueToPlan}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Plans</h1>
        <Button onClick={startNewPlan}>
          <Plus size={18} className="mr-2" /> Create New Plan
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 && <p className="text-gray-500 col-span-full">No plans created yet.</p>}
        {plans.map(plan => {
          const planTechniques = plan.techniqueIds.map(id => TECHNIQUES_DATA.find(t => t.id === id)?.name).filter(Boolean);
          return (
            <div key={plan.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">{plan.planName}</h2>
              <div className="flex-grow mb-4">
                <h4 className="font-medium text-gray-600 mb-1">Techniques:</h4>
                {planTechniques.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-500 text-sm">
                    {planTechniques.map(name => <li key={name}>{name}</li>)}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No techniques in this plan.</p>
                )}
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Button variant="danger" size="icon" onClick={() => deletePlan(plan.id)}>
                  <Trash2 size={16} />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => startEditingPlan(plan)}>
                  <Edit size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PrintableGraphs = ({ userData }) => {
  return (
    <div>
      <h1 className="print-graph-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        All Technique Progress Graphs
      </h1>
      {TECHNIQUES_DATA.map(tech => (
        <div key={tech.id}>
          {tech.defaultMetrics.map(metric => {
            const chartData = (userData.progress || [])
              .map(entry => {
                const metricKey = `${tech.id}_${metric.id}`;
                if (entry.metrics && entry.metrics.hasOwnProperty(metricKey)) {
                  return {
                    date: entry.date,
                    [metric.id]: entry.metrics[metricKey]
                  };
                }
                return null;
              })
              .filter(Boolean)
              .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (chartData.length === 0) {
              return null;
            }

            return (
              <div key={metric.id} className="print-graph-container">
                <h2 className="print-graph-title">
                  {tech.name} - {metric.label}
                </h2>
                <StatGraph
                  data={chartData}
                  dataKey={metric.id}
                  name={metric.label}
                  unit={metric.unit}
                  isPrint={true} 
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const PrintableStatistics = ({ userData }) => {
  if (!userData || !userData.progress || !userData.progress.length) {
    return <p>No statistics available to print.</p>;
  }

  const rows = [];
  userData.progress.forEach(entry => {
    const plan = userData.plans.find(p => p.id === entry.planId);
    const planName = plan ? plan.planName : 'Unknown Plan';

    Object.entries(entry.metrics).forEach(([key, value]) => {
      const tech = TECHNIQUES_DATA.find(t =>
        t.defaultMetrics.some(m => `${t.id}_${m.id}` === key)
      );
      const metric = tech?.defaultMetrics.find(m => `${tech.id}_${m.id}` === key);
      if (tech && metric) {
        rows.push({
          date: entry.date,
          plan: planName,
          technique: tech.name,
          metric: metric.label,
          value,
          unit: metric.unit || ''
        });
      }
    });
  });

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        All Recorded Statistics
      </h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Plan</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Technique</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Metric</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Value</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.date}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.plan}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.technique}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.metric}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.value}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px' }}>{r.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const StatisticsView = () => {
  const { userData, user } = useData();
  const [selectedTech, setSelectedTech] = useState(TECHNIQUES_DATA[0].id);
  const [selectedMetric, setSelectedMetric] = useState(TECHNIQUES_DATA[0].defaultMetrics[0].id);

  const tech = TECHNIQUES_DATA.find(t => t.id === selectedTech);
  const metric = tech.defaultMetrics.find(m => m.id === selectedMetric);

  // Prepare data for the chart
  const chartData = (userData.progress || [])
    .map(entry => {
      const metricKey = `${selectedTech}_${selectedMetric}`;
      if (entry.metrics && entry.metrics.hasOwnProperty(metricKey)) {
        return {
          date: entry.date,
          [selectedMetric]: entry.metrics[metricKey]
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate week-over-week progress
  const getWeekOverWeek = () => {
    const sortedData = [...chartData];
    if (sortedData.length < 2) return { value: "N/A", percent: 0, change: 'none' };
    
    const lastEntry = sortedData[sortedData.length - 1];
    const prevEntry = sortedData[sortedData.length - 2];
    
    const lastValue = lastEntry[selectedMetric];
    const prevValue = prevEntry[selectedMetric];
    
    const percentChange = ((lastValue - prevValue) / prevValue) * 100;
    
    return {
      value: `${lastValue} ${metric.unit}`,
      percent: Math.abs(percentChange.toFixed(0)),
      change: percentChange > 0 ? 'increase' : 'decrease'
    };
  };
  
  const wow = getWeekOverWeek();

  // Find all-time best
  const allTimeBest = chartData.reduce((max, entry) => {
    return entry[selectedMetric] > max ? entry[selectedMetric] : max;
  }, 0);

  const handleTechChange = (e) => {
    const newTechId = e.target.value;
    setSelectedTech(newTechId);
    setSelectedMetric(TECHNIQUES_DATA.find(t => t.id === newTechId).defaultMetrics[0].id);
  };

const printSection = (selector, title = '') => {
  const source = document.querySelector(selector);
  if (!source) {
    alert('Nothing to print.');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title || 'Print'}</title>
        <style>
          html, body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #000; }
          h1, h2, h3 { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          thead th { background: #f3f4f6; }
          .print-graph-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; }
          .print-graph-container { page-break-inside: avoid; padding: 1.5rem 0; width: 100%; }
          @page { margin: 16mm; }
        </style>
      </head>
      <body>
        ${source.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  const win = iframe.contentWindow;
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 250);
  }, 50);
};

  const handleExportCSV = () => {
    if (!userData.progress || userData.progress.length === 0) {
      alert("No progress data to export.");
      return;
    }

    const csvRows = ["date,plan_name,technique_name,metric_name,value,unit"];

    const sanitizeField = (field) => {
      if (field === null || field === undefined) return '""';
      let str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes(' ')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    userData.progress.forEach(entry => {
      const plan = userData.plans.find(p => p.id === entry.planId);
      const planName = plan ? plan.planName : 'Unknown Plan';

      Object.entries(entry.metrics).forEach(([key, value]) => {
        let techName = key; 
        let metricName = 'value'; 
        let unit = ''; 
        let found = false;

        for (const tech of TECHNIQUES_DATA) {
          for (const metric of tech.defaultMetrics) {
            const testKey = `${tech.id}_${metric.id}`;
            if (testKey === key) {
              techName = tech.name;
              metricName = metric.label;
              unit = metric.unit || '';
              found = true;
              break;
            }
          }
          if (found) break;
        }
        
        const row = [
          entry.date,
          planName,
          techName,
          metricName,
          value,
          unit
        ].map(sanitizeField).join(',');
        
        csvRows.push(row);
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const exportFileName = `guitar_tracker_export_${user?.email}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', exportFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="print-hide">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Statistics</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV}>
              <Download size={18} className="mr-2" />
              Export All Data (CSV)
            </Button>
              <Button variant="secondary" onClick={() => printSection('.print-only', 'All Technique Progress Graphs')}>
                <Printer size={18} className="mr-2" />
                Print All Graphs
              </Button>
              <Button variant="secondary" onClick={() => printSection('.print-only-stats', 'All Recorded Statistics')}>
                <Printer size={18} className="mr-2" />
                Print All Statistics
              </Button>

          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-600">Technique</label>
            <select
              value={selectedTech}
              onChange={handleTechChange}
              className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {TECHNIQUES_DATA.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {tech.defaultMetrics.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-600">All-Time Best</h3>
            <p className="text-3xl font-bold text-blue-600">
              {allTimeBest || 'N/A'} <span className="text-lg font-medium text-gray-500">{metric.unit}</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-600">Last Session</h3>
            <p className="text-3xl font-bold text-blue-600">
              {wow.value}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-600">Progress vs. Previous</h3>
            {wow.change === 'none' ? (
              <p className="text-3xl font-bold text-gray-500">N/A</p>
            ) : (
              <p className={`text-3xl font-bold ${wow.change === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp size={28} className={`inline-block ${wow.change === 'decrease' ? 'transform rotate-180' : ''}`} />
                {wow.percent}%
              </p>
            )}
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Progress: {tech.name} - {metric.label}
          </h2>
          <StatGraph 
            data={chartData} 
            dataKey={selectedMetric} 
            name={metric.label} 
            unit={metric.unit} 
          />
        </div>
      </div>
      
      <div className="print-only">
        <PrintableGraphs userData={userData} />
      </div>
      <div className="print-only-stats" style={{ display: 'none' }}>
  <PrintableStatistics userData={userData} />
</div>

    </div>
  );
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ plans: [], progress: [] });
  const [loadingData, setLoadingData] = useState(false);
  const [page, setPage] = useState('dashboard');

  // 1. Initialize Authentication and Listen for Changes
  useEffect(() => {
    const initAuth = async () => {
      // Check if we are in the AI Preview Environment and have a custom token
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
         try {
            await signInWithCustomToken(auth, __initial_auth_token);
         } catch (e) {
            console.error("Preview token auth failed", e);
         }
      }
      // Note: We do NOT fall back to anonymous auth here automatically, 
      // as we want the user to see the Login screen.
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData({ plans: [], progress: [] }); // Clear data on logout
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data from Firestore when User is Authenticated
  useEffect(() => {
    if (!user) return;

    setLoadingData(true);
    // Follows strict rule: /artifacts/{appId}/users/{userId}/{collectionName}
    // We store all tracker data in a single document for simplicity and atomicity
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'trackerData');

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Initialize empty data if doc doesn't exist
        setUserData({ plans: [], progress: [] });
      }
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Function to update data (used by child components)
  const updateUserData = async (newDataPartial) => {
    if (!user) return;
    
    // Optimistic update for UI responsiveness
    setUserData(prev => ({ ...prev, ...newDataPartial }));

    // Write to Firestore
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'trackerData');
      // Merging with existing state to ensure we don't overwrite with partial data
      // But we must be careful: setDoc with merge=true is safer
      await setDoc(userDocRef, { ...userData, ...newDataPartial }, { merge: true });
    } catch (e) {
      console.error("Error saving to Firestore", e);
      alert("Failed to save changes to the cloud. Please check your connection.");
    }
  };

  // 4. Print Styles
  useEffect(() => {
    const styleId = 'app-print-styles';
    let styleEl = document.getElementById(styleId);

    if (styleEl) return; 

    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        header, aside, .print-hide { display: none !important; visibility: hidden !important; }
        .print-only { display: block !important; visibility: visible !important; width: 100%; position: absolute; top: 0; left: 0; padding: 1rem; }
        .print-graph-container { page-break-inside: avoid; padding-top: 1.5rem; padding-bottom: 1.5rem; width: 100%; }
        .print-graph-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #000; }
      }
      .print-only { display: none; visibility: hidden; }
    `;
    document.head.appendChild(styleEl);
  }, []);

  const dataContextValue = {
    userData,
    updateUserData,
    user,
    loadingData
  };
  
  if (!user) {
    return <AuthScreen />;
  }

  if (loadingData && !userData.plans) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={dataContextValue}>
      <div className="flex h-screen bg-gray-100">
        <Navbar page={page} setPage={setPage} />
        <main className="flex-1 overflow-y-auto">
          {(() => {
            switch (page) {
              case 'dashboard':
                return <DashboardView />;
              case 'plans':
                return <PlansView />;
              case 'statistics':
                return <StatisticsView />;
              default:
                return <DashboardView />;
            }
          })()}
        </main>
      </div>
    </DataContext.Provider>
  );
}