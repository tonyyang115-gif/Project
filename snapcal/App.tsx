import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog, ViewState, MealType, ExerciseLog } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { FoodLogger } from './components/FoodLogger';
import { ExerciseLogger } from './components/ExerciseLogger';
import { Landing } from './components/Landing';
import { Profile } from './components/Profile';
import { Stats } from './components/Stats';
import { HealthTools } from './components/HealthTools';
import { Home, BarChart2, User, Camera, Heart } from 'lucide-react';

const STORAGE_KEY_USER = 'snapcal_user';
const STORAGE_KEY_LOGS = 'snapcal_logs';
const STORAGE_KEY_EXERCISES = 'snapcal_exercises';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [view, setView] = useState<ViewState>('LANDING'); // Default to LANDING
  const [isLoading, setIsLoading] = useState(true);
  
  // State to track which mode (Photo vs Search vs QuickScan) opened the logger
  const [logMode, setLogMode] = useState<'PHOTO' | 'SEARCH' | 'QUICK_SCAN'>('PHOTO');
  // State to track specific meal type if provided
  const [logMealType, setLogMealType] = useState<MealType | undefined>(undefined);

  // Load data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedExercises = localStorage.getItem(STORAGE_KEY_EXERCISES);

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('DASHBOARD');
    } else {
      setView('LANDING');
    }
    
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    
    if (savedExercises) {
      setExercises(JSON.parse(savedExercises));
    }

    setIsLoading(false);
  }, []);

  // Persist logs
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    }
  }, [logs]);

  // Persist exercises
  useEffect(() => {
    if (exercises.length > 0) {
      localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(exercises));
    }
  }, [exercises]);

  const handleStart = () => {
    setView('ONBOARDING');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    setView('DASHBOARD');
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  const handleLogFood = (newLog: MealLog) => {
    setLogs(prev => [newLog, ...prev]);
    setView('DASHBOARD');
  };

  const handleLogExercise = (newLog: ExerciseLog) => {
    setExercises(prev => [newLog, ...prev]);
    setView('DASHBOARD');
  };

  const openLogger = (mode: 'PHOTO' | 'SEARCH' | 'QUICK_SCAN', mealType?: MealType) => {
    setLogMode(mode);
    setLogMealType(mealType);
    setView('LOG_FOOD');
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-blue-600 bg-white">
       <div className="animate-pulse font-bold text-lg">Loading SnapCal...</div>
    </div>;
  }

  return (
    <div className="bg-white min-h-screen relative max-w-lg mx-auto shadow-2xl overflow-hidden font-sans">
      
      {view === 'LANDING' && (
        <Landing onStart={handleStart} />
      )}

      {view === 'ONBOARDING' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {user && (
        <>
          {view === 'DASHBOARD' && (
            <Dashboard 
              user={user} 
              logs={logs} 
              exercises={exercises}
              onLogFood={openLogger} 
              onLogExercise={() => setView('LOG_EXERCISE')}
            />
          )}

          {view === 'PROFILE' && (
            <Profile user={user} onUpdateUser={handleUpdateUser} />
          )}
          
          {view === 'STATS' && (
            <Stats user={user} logs={logs} exercises={exercises} />
          )}

          {view === 'HEALTH' && (
            <HealthTools user={user} />
          )}

          {view === 'LOG_FOOD' && (
            <FoodLogger 
              onSave={handleLogFood} 
              onCancel={() => setView('DASHBOARD')}
              initialMode={logMode}
              initialMealType={logMealType}
            />
          )}

          {view === 'LOG_EXERCISE' && (
            <ExerciseLogger 
              userWeight={user.weight}
              onSave={handleLogExercise}
              onCancel={() => setView('DASHBOARD')}
            />
          )}

          {/* Styled Bottom Navigation */}
          {(view === 'DASHBOARD' || view === 'PROFILE' || view === 'STATS' || view === 'HEALTH') && (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 h-20 z-40">
                <div className="flex justify-between items-center h-full pb-4">
                    <button 
                        className={`flex flex-col items-center gap-1 w-12 transition-colors ${view === 'DASHBOARD' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                        onClick={() => setView('DASHBOARD')}
                    >
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-bold">首页</span>
                    </button>
                    
                    <button 
                        className={`flex flex-col items-center gap-1 w-12 transition-colors ${view === 'STATS' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                        onClick={() => setView('STATS')}
                    >
                        <BarChart2 className="w-6 h-6" />
                        <span className="text-[10px] font-medium">统计</span>
                    </button>

                    {/* Central Camera Button - Aligned horizontally now */}
                    <button 
                        onClick={() => openLogger('QUICK_SCAN')}
                        className="w-12 h-12 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Camera className="w-6 h-6" />
                    </button>

                    <button 
                        className={`flex flex-col items-center gap-1 w-12 transition-colors ${view === 'HEALTH' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                        onClick={() => setView('HEALTH')}
                    >
                        <Heart className="w-6 h-6" />
                        <span className="text-[10px] font-medium">健康</span>
                    </button>

                    <button 
                        className={`flex flex-col items-center gap-1 w-12 transition-colors ${view === 'PROFILE' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                        onClick={() => setView('PROFILE')}
                    >
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">我的</span>
                    </button>
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}