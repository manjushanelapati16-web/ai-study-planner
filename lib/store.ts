"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudyPlan, Notification, PomodoroState, StudyStats } from "./types";

interface StudyStore {
  // Study Plan
  studyPlan: StudyPlan | null;
  setStudyPlan: (plan: StudyPlan) => void;
  
  // Sessions
  toggleSessionComplete: (sessionId: string) => void;
  addSessionNote: (sessionId: string, note: string) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // UI State
  currentView: "setup" | "dashboard" | "schedule" | "notifications" | "analytics" | "pomodoro";
  setCurrentView: (view: "setup" | "dashboard" | "schedule" | "notifications" | "analytics" | "pomodoro") => void;
  
  // Pomodoro Timer
  pomodoro: PomodoroState;
  startPomodoro: (sessionId: string) => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  updatePomodoroTime: (time: number) => void;
  completePomodoro: () => void;
  
  // Study Stats
  studyStats: StudyStats;
  updateStats: () => void;
  
  // Daily Study Log
  dailyStudyLog: Record<string, number>;
  logStudyTime: (date: string, minutes: number) => void;
  
  // Reset
  resetPlan: () => void;
}

const initialPomodoroState: PomodoroState = {
  isActive: false,
  isBreak: false,
  timeRemaining: 25 * 60,
  currentSessionId: null,
  pomodorosCompleted: 0,
};

const initialStats: StudyStats = {
  totalStudyMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  sessionsCompleted: 0,
  averageSessionLength: 0,
  mostProductiveDay: "Monday",
  weeklyGoalProgress: 0,
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      studyPlan: null,
      setStudyPlan: (plan) => set({ studyPlan: plan, currentView: "dashboard" }),
      
      toggleSessionComplete: (sessionId) => {
        const { studyPlan, logStudyTime, addNotification, notifications } = get();
        if (!studyPlan) return;
        
        const session = studyPlan.sessions.find(s => s.id === sessionId);
        const wasCompleted = session?.completed;
        
        const updatedSessions = studyPlan.sessions.map((s) =>
          s.id === sessionId ? { ...s, completed: !s.completed } : s
        );
        
        set({
          studyPlan: { ...studyPlan, sessions: updatedSessions },
        });
        
        // Log study time when completing
        if (session && !wasCompleted) {
          const today = new Date().toISOString().split("T")[0];
          logStudyTime(today, session.duration);
          
          // Check for achievements
          const completedCount = updatedSessions.filter(s => s.completed).length;
          
          if (completedCount === 1) {
            addNotification({
              id: `achievement-first-${Date.now()}`,
              type: "achievement",
              title: "First Step!",
              message: "You completed your first study session. Keep going!",
              date: new Date().toISOString(),
              read: false,
            });
          } else if (completedCount === 10) {
            addNotification({
              id: `achievement-10-${Date.now()}`,
              type: "achievement",
              title: "Getting Serious!",
              message: "10 sessions completed! You're building great habits.",
              date: new Date().toISOString(),
              read: false,
            });
          } else if (completedCount === 50) {
            addNotification({
              id: `achievement-50-${Date.now()}`,
              type: "achievement",
              title: "Study Master!",
              message: "50 sessions completed! You're crushing it!",
              date: new Date().toISOString(),
              read: false,
            });
          }
        }
        
        get().updateStats();
      },
      
      addSessionNote: (sessionId, note) => {
        const { studyPlan } = get();
        if (!studyPlan) return;
        
        const updatedSessions = studyPlan.sessions.map((s) =>
          s.id === sessionId ? { ...s, notes: note } : s
        );
        
        set({
          studyPlan: { ...studyPlan, sessions: updatedSessions },
        });
      },
      
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      
      currentView: "setup",
      setCurrentView: (view) => set({ currentView: view }),
      
      // Pomodoro
      pomodoro: initialPomodoroState,
      startPomodoro: (sessionId) =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isActive: true,
            currentSessionId: sessionId,
            timeRemaining: state.pomodoro.isBreak ? 5 * 60 : 25 * 60,
          },
        })),
      pausePomodoro: () =>
        set((state) => ({
          pomodoro: { ...state.pomodoro, isActive: false },
        })),
      resetPomodoro: () =>
        set(() => ({
          pomodoro: initialPomodoroState,
        })),
      updatePomodoroTime: (time) =>
        set((state) => ({
          pomodoro: { ...state.pomodoro, timeRemaining: time },
        })),
      completePomodoro: () =>
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isActive: false,
            isBreak: !state.pomodoro.isBreak,
            pomodorosCompleted: state.pomodoro.isBreak
              ? state.pomodoro.pomodorosCompleted
              : state.pomodoro.pomodorosCompleted + 1,
            timeRemaining: state.pomodoro.isBreak ? 25 * 60 : 5 * 60,
          },
        })),
      
      // Stats
      studyStats: initialStats,
      updateStats: () => {
        const { studyPlan, dailyStudyLog } = get();
        if (!studyPlan) return;
        
        const completedSessions = studyPlan.sessions.filter(s => s.completed);
        const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
        const avgLength = completedSessions.length > 0 ? totalMinutes / completedSessions.length : 0;
        
        // Calculate streak
        let currentStreak = 0;
        let longestStreak = 0;
        const dates = Object.keys(dailyStudyLog).sort().reverse();
        const today = new Date().toISOString().split("T")[0];
        
        for (let i = 0; i < dates.length; i++) {
          const date = dates[i];
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split("T")[0];
          
          if (date === expectedDateStr && dailyStudyLog[date] > 0) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        // Calculate longest streak
        let tempStreak = 0;
        const sortedDates = Object.keys(dailyStudyLog).sort();
        for (let i = 0; i < sortedDates.length; i++) {
          if (dailyStudyLog[sortedDates[i]] > 0) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }
        
        // Find most productive day
        const dayTotals: Record<string, number> = {
          Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
          Thursday: 0, Friday: 0, Saturday: 0,
        };
        
        completedSessions.forEach(session => {
          const dayName = new Date(session.date).toLocaleDateString("en-US", { weekday: "long" });
          dayTotals[dayName] = (dayTotals[dayName] || 0) + session.duration;
        });
        
        const mostProductiveDay = Object.entries(dayTotals)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "Monday";
        
        // Weekly goal (target: complete all sessions for this week)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        const weekSessions = studyPlan.sessions.filter(s => {
          const date = new Date(s.date);
          return date >= startOfWeek && date < endOfWeek;
        });
        const weekCompleted = weekSessions.filter(s => s.completed).length;
        const weeklyGoalProgress = weekSessions.length > 0 
          ? (weekCompleted / weekSessions.length) * 100 
          : 0;
        
        set({
          studyStats: {
            totalStudyMinutes: totalMinutes,
            currentStreak,
            longestStreak: Math.max(longestStreak, currentStreak),
            sessionsCompleted: completedSessions.length,
            averageSessionLength: Math.round(avgLength),
            mostProductiveDay,
            weeklyGoalProgress,
          },
        });
      },
      
      dailyStudyLog: {},
      logStudyTime: (date, minutes) =>
        set((state) => ({
          dailyStudyLog: {
            ...state.dailyStudyLog,
            [date]: (state.dailyStudyLog[date] || 0) + minutes,
          },
        })),
      
      resetPlan: () => set({ 
        studyPlan: null, 
        currentView: "setup", 
        notifications: [],
        pomodoro: initialPomodoroState,
        studyStats: initialStats,
        dailyStudyLog: {},
      }),
    }),
    {
      name: "study-planner-storage-v2",
    }
  )
);
