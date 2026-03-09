export type DifficultyLevel = "easy" | "medium" | "hard";

export type StudyTechnique = "pomodoro" | "spaced-repetition" | "active-recall" | "standard";

export interface Subject {
  id: string;
  name: string;
  difficulty: DifficultyLevel;
  color: string;
  estimatedHours: number;
  priority: number; // 1-5, higher = more important
}

export interface FreeTimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  completed: boolean;
  color: string;
  technique: StudyTechnique;
  notes?: string;
}

export interface StudyPlan {
  id: string;
  subjects: Subject[];
  startDate: string;
  endDate: string;
  freeTimeSlots: FreeTimeSlot[];
  sessions: StudySession[];
  createdAt: string;
  preferredTechnique: StudyTechnique;
}

export interface Notification {
  id: string;
  type: "weekly_check" | "due_reminder" | "session_reminder" | "achievement" | "streak";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface StudyPlanInput {
  subjects: Subject[];
  startDate: string;
  endDate: string;
  freeTimeSlots: FreeTimeSlot[];
  preferredTechnique: StudyTechnique;
}

export interface StudyStats {
  totalStudyMinutes: number;
  currentStreak: number;
  longestStreak: number;
  sessionsCompleted: number;
  averageSessionLength: number;
  mostProductiveDay: string;
  weeklyGoalProgress: number;
}

export interface PomodoroState {
  isActive: boolean;
  isBreak: boolean;
  timeRemaining: number;
  currentSessionId: string | null;
  pomodorosCompleted: number;
}
