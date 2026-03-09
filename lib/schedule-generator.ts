import type { StudyPlanInput, StudySession, StudyPlan, Subject, FreeTimeSlot, StudyTechnique } from "./types";

const DIFFICULTY_WEIGHTS = {
  hard: 3,
  medium: 2,
  easy: 1,
};

const PRIORITY_MULTIPLIER = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.2,
  5: 1.4,
};

// Optimal session durations based on study technique
const TECHNIQUE_DURATIONS: Record<StudyTechnique, { min: number; max: number; breakAfter: number }> = {
  pomodoro: { min: 25, max: 25, breakAfter: 5 },
  "spaced-repetition": { min: 30, max: 45, breakAfter: 10 },
  "active-recall": { min: 40, max: 60, breakAfter: 15 },
  standard: { min: 45, max: 90, breakAfter: 15 },
};

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function getDayIndex(day: string): number {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days.indexOf(day.toLowerCase());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Smart scheduling considers optimal learning times
function getOptimalTimeScore(hour: number): number {
  // Peak cognitive hours: 9-11am, 2-4pm
  if (hour >= 9 && hour <= 11) return 1.2;
  if (hour >= 14 && hour <= 16) return 1.1;
  if (hour >= 19 && hour <= 21) return 0.9; // Evening study
  if (hour >= 6 && hour <= 8) return 1.0; // Morning
  return 0.8; // Late night or early morning
}

export function generateStudyPlan(input: StudyPlanInput): StudyPlan {
  const { subjects, startDate, endDate, freeTimeSlots, preferredTechnique } = input;
  
  // Calculate end date - 2 days before actual end
  const actualEndDate = new Date(endDate);
  actualEndDate.setDate(actualEndDate.getDate() - 2);
  
  const start = new Date(startDate);
  const end = actualEndDate;
  
  // Calculate total available study time
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate weighted study hours needed per subject (considering difficulty and priority)
  const totalWeight = subjects.reduce(
    (sum, s) => sum + DIFFICULTY_WEIGHTS[s.difficulty] * s.estimatedHours * (PRIORITY_MULTIPLIER[s.priority as keyof typeof PRIORITY_MULTIPLIER] || 1),
    0
  );
  
  // Generate sessions
  const sessions: StudySession[] = [];
  let sessionId = 0;
  
  // Create a map of available slots per day of week
  const slotsByDay: Map<number, FreeTimeSlot[]> = new Map();
  freeTimeSlots.forEach((slot) => {
    const dayIndex = getDayIndex(slot.day);
    if (!slotsByDay.has(dayIndex)) {
      slotsByDay.set(dayIndex, []);
    }
    slotsByDay.get(dayIndex)!.push(slot);
  });
  
  // Track study time per subject
  const studyTimePerSubject: Map<string, number> = new Map();
  subjects.forEach((s) => studyTimePerSubject.set(s.id, 0));
  
  // Target time per subject (harder and higher priority subjects get more time)
  const targetTimePerSubject: Map<string, number> = new Map();
  const totalAvailableMinutes = freeTimeSlots.reduce((sum, slot) => {
    const duration = parseTime(slot.endTime) - parseTime(slot.startTime);
    return sum + duration * Math.ceil(totalDays / 7);
  }, 0);
  
  subjects.forEach((s) => {
    const weight = DIFFICULTY_WEIGHTS[s.difficulty] * s.estimatedHours * (PRIORITY_MULTIPLIER[s.priority as keyof typeof PRIORITY_MULTIPLIER] || 1);
    const targetMinutes = (weight / totalWeight) * totalAvailableMinutes;
    targetTimePerSubject.set(s.id, targetMinutes);
  });
  
  // Get technique settings
  const techniqueSettings = TECHNIQUE_DURATIONS[preferredTechnique];
  
  // Iterate through each day
  let currentDate = new Date(start);
  let subjectIndex = 0;
  let lastSubjectId: string | null = null;
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const slotsForDay = slotsByDay.get(dayOfWeek) || [];
    
    // Sort slots by optimal time score
    const sortedSlots = [...slotsForDay].sort((a, b) => {
      const hourA = parseInt(a.startTime.split(":")[0]);
      const hourB = parseInt(b.startTime.split(":")[0]);
      return getOptimalTimeScore(hourB) - getOptimalTimeScore(hourA);
    });
    
    for (const slot of sortedSlots) {
      const slotStart = parseTime(slot.startTime);
      const slotEnd = parseTime(slot.endTime);
      let currentTime = slotStart;
      
      while (currentTime < slotEnd) {
        // Find the subject that needs the most study time relative to its target
        // But avoid scheduling the same subject twice in a row for variety
        let bestSubject: Subject | null = null;
        let maxNeed = -Infinity;
        
        for (const subject of subjects) {
          if (subject.id === lastSubjectId && subjects.length > 1) continue;
          
          const current = studyTimePerSubject.get(subject.id) || 0;
          const target = targetTimePerSubject.get(subject.id) || 0;
          const need = (target - current) * (PRIORITY_MULTIPLIER[subject.priority as keyof typeof PRIORITY_MULTIPLIER] || 1);
          
          if (need > maxNeed) {
            maxNeed = need;
            bestSubject = subject;
          }
        }
        
        if (!bestSubject || maxNeed <= -1000) {
          // All subjects have enough time, distribute evenly
          bestSubject = subjects[subjectIndex % subjects.length];
          subjectIndex++;
        }
        
        // Session duration based on technique and difficulty
        let baseDuration = techniqueSettings.min;
        const difficultyBonus = DIFFICULTY_WEIGHTS[bestSubject.difficulty] * 5;
        let sessionDuration = Math.min(baseDuration + difficultyBonus, techniqueSettings.max);
        
        // Don't exceed slot end time
        sessionDuration = Math.min(sessionDuration, slotEnd - currentTime);
        
        if (sessionDuration < 20) break; // Skip if less than 20 minutes
        
        sessions.push({
          id: `session-${sessionId++}`,
          subjectId: bestSubject.id,
          subjectName: bestSubject.name,
          date: formatDate(currentDate),
          startTime: formatTime(currentTime),
          endTime: formatTime(currentTime + sessionDuration),
          duration: sessionDuration,
          completed: false,
          color: bestSubject.color,
          technique: preferredTechnique,
        });
        
        // Update tracking
        const currentStudyTime = studyTimePerSubject.get(bestSubject.id) || 0;
        studyTimePerSubject.set(bestSubject.id, currentStudyTime + sessionDuration);
        lastSubjectId = bestSubject.id;
        
        currentTime += sessionDuration + techniqueSettings.breakAfter; // Break between sessions
      }
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  // Sort sessions by date and time
  sessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });
  
  return {
    id: `plan-${Date.now()}`,
    subjects,
    startDate,
    endDate,
    freeTimeSlots,
    sessions,
    createdAt: new Date().toISOString(),
    preferredTechnique,
  };
}

export function getStudyTips(difficulty: string, technique: StudyTechnique): string[] {
  const tips: string[] = [];
  
  if (difficulty === "hard") {
    tips.push("Break complex topics into smaller chunks");
    tips.push("Use visual diagrams and mind maps");
    tips.push("Teach the concept to someone else");
  } else if (difficulty === "medium") {
    tips.push("Connect new concepts to what you already know");
    tips.push("Practice with varied examples");
  } else {
    tips.push("Quick review sessions work well");
    tips.push("Focus on application rather than memorization");
  }
  
  if (technique === "pomodoro") {
    tips.push("25 min focused work, then 5 min break");
    tips.push("After 4 pomodoros, take a longer 15-30 min break");
  } else if (technique === "spaced-repetition") {
    tips.push("Review at increasing intervals: 1 day, 3 days, 1 week");
    tips.push("Focus more on items you get wrong");
  } else if (technique === "active-recall") {
    tips.push("Close your notes and try to recall from memory");
    tips.push("Use flashcards or practice questions");
  }
  
  return tips;
}
