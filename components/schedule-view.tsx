"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/lib/store";
import type { StudySession } from "@/lib/types";

function formatWeekRange(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sunday

  const formatOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", formatOptions)} - ${end.toLocaleDateString("en-US", formatOptions)}`;
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ScheduleView() {
  const { studyPlan, toggleSessionComplete, setCurrentView } = useStudyStore();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);

  const sessionsByDate = useMemo(() => {
    if (!studyPlan) return new Map<string, StudySession[]>();

    const map = new Map<string, StudySession[]>();
    studyPlan.sessions.forEach((session) => {
      const existing = map.get(session.date) || [];
      map.set(session.date, [...existing, session]);
    });
    return map;
  }, [studyPlan]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
    setSelectedDay(null);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDay(new Date());
  };

  if (!studyPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No study plan found.</p>
      </div>
    );
  }

  const selectedDateKey = selectedDay ? formatDateKey(selectedDay) : null;
  const selectedDaySessions = selectedDateKey ? sessionsByDate.get(selectedDateKey) || [] : [];
  const selectedDayIndex = selectedDay ? (selectedDay.getDay() + 6) % 7 : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Weekly Schedule</h1>
              <p className="text-sm text-muted-foreground">View and manage your study sessions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Week Navigation */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday} className="ml-2">
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">
              {formatWeekRange(currentWeek)}
            </span>
          </div>
        </div>

        {/* Week Calendar Strip */}
        <div className="mb-6 grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dateKey = formatDateKey(day);
            const sessions = sessionsByDate.get(dateKey) || [];
            const completedCount = sessions.filter((s) => s.completed).length;
            const isSelected = selectedDay && formatDateKey(selectedDay) === dateKey;
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : isTodayDate
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {DAY_NAMES[index]}
                </span>
                <span
                  className={`mt-1 text-xl font-bold ${
                    isSelected ? "text-primary" : isTodayDate ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
                {sessions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        completedCount === sessions.length ? "bg-accent" : "bg-muted-foreground"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{sessions.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                {FULL_DAY_NAMES[selectedDayIndex]}, {selectedDay.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDaySessions.length > 0 ? (
                <div className="space-y-3">
                  {selectedDaySessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                        session.completed
                          ? "border-accent/30 bg-accent/10"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <button
                        onClick={() => toggleSessionComplete(session.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {session.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-accent" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: session.color }}
                          />
                          <p
                            className={`font-medium ${
                              session.completed ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {session.subjectName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {session.startTime} - {session.endTime} ({session.duration} min)
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.completed ? "secondary" : "outline"}>
                        {session.technique === "pomodoro" ? "Pomodoro" : "Standard"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No sessions scheduled for this day</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Week Grid - Compact View */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {weekDays.map((day, index) => {
            const dateKey = formatDateKey(day);
            const sessions = sessionsByDate.get(dateKey) || [];
            const isTodayDate = isToday(day);

            if (sessions.length === 0) return null;

            return (
              <Card key={dateKey} className={`border-border bg-card ${isTodayDate ? "ring-2 ring-primary" : ""}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className={isTodayDate ? "text-primary" : "text-foreground"}>
                      {DAY_NAMES[index]} {day.getDate()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {sessions.filter(s => s.completed).length}/{sessions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-2 rounded-lg p-2 text-sm ${
                        session.completed ? "bg-accent/10" : "bg-secondary/30"
                      }`}
                    >
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: session.color }}
                      />
                      <span className={`truncate ${session.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {session.subjectName}
                      </span>
                    </div>
                  ))}
                  {sessions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{sessions.length - 3} more
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <Card className="mt-6 border-border bg-card">
          <CardContent className="flex flex-wrap items-center gap-4 py-4">
            <span className="text-sm font-medium text-foreground">Subjects:</span>
            {studyPlan.subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm text-muted-foreground">{subject.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
