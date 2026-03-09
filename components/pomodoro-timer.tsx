"use client";

import { useEffect, useCallback, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/lib/store";

export function PomodoroTimer() {
  const {
    studyPlan,
    pomodoro,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    updatePomodoroTime,
    completePomodoro,
    toggleSessionComplete,
    setCurrentView,
  } = useStudyStore();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    pomodoro.currentSessionId
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplete = useCallback(() => {
    completePomodoro();
    
    // Play notification sound (browser notification)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(
          pomodoro.isBreak ? "Break time over!" : "Pomodoro complete!",
          {
            body: pomodoro.isBreak
              ? "Time to get back to studying!"
              : "Great work! Take a 5 minute break.",
            icon: "/icon.svg",
          }
        );
      }
    }
  }, [completePomodoro, pomodoro.isBreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (pomodoro.isActive && pomodoro.timeRemaining > 0) {
      interval = setInterval(() => {
        updatePomodoroTime(pomodoro.timeRemaining - 1);
      }, 1000);
    } else if (pomodoro.timeRemaining === 0 && pomodoro.isActive) {
      handleComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.isActive, pomodoro.timeRemaining, updatePomodoroTime, handleComplete]);

  useEffect(() => {
    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const todaySessions = studyPlan?.sessions.filter(
    (s) => s.date === new Date().toISOString().split("T")[0] && !s.completed
  ) || [];

  const currentSession = studyPlan?.sessions.find((s) => s.id === selectedSessionId);

  const progress = pomodoro.isBreak
    ? ((5 * 60 - pomodoro.timeRemaining) / (5 * 60)) * 100
    : ((25 * 60 - pomodoro.timeRemaining) / (25 * 60)) * 100;

  const handleStartWithSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    startPomodoro(sessionId);
  };

  const handleCompleteSession = () => {
    if (selectedSessionId) {
      toggleSessionComplete(selectedSessionId);
      resetPomodoro();
      setSelectedSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Pomodoro Timer</h1>
              <p className="text-sm text-muted-foreground">
                {pomodoro.pomodorosCompleted} pomodoros completed today
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Timer Card */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center py-12">
            {/* Timer Display */}
            <div className="relative mb-8">
              <div className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-border bg-secondary/30">
                <div className="text-center">
                  <p className="text-6xl font-bold tabular-nums text-foreground">
                    {formatTime(pomodoro.timeRemaining)}
                  </p>
                  <p className="mt-2 text-lg text-muted-foreground">
                    {pomodoro.isBreak ? "Break Time" : "Focus Time"}
                  </p>
                </div>
              </div>
              {/* Progress Ring */}
              <svg
                className="absolute inset-0 -rotate-90"
                viewBox="0 0 256 256"
              >
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="8"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke={pomodoro.isBreak ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>

            {/* Status Badge */}
            <Badge
              variant={pomodoro.isBreak ? "secondary" : "default"}
              className="mb-6 gap-2 px-4 py-2"
            >
              {pomodoro.isBreak ? (
                <>
                  <Coffee className="h-4 w-4" />
                  Take a break
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  {currentSession ? currentSession.subjectName : "Ready to focus"}
                </>
              )}
            </Badge>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {pomodoro.isActive ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={pausePomodoro}
                  className="h-14 w-14 rounded-full p-0"
                >
                  <Pause className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    if (selectedSessionId) {
                      startPomodoro(selectedSessionId);
                    } else if (todaySessions.length > 0) {
                      handleStartWithSession(todaySessions[0].id);
                    }
                  }}
                  disabled={!selectedSessionId && todaySessions.length === 0}
                  className="h-14 w-14 rounded-full p-0"
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={resetPomodoro}
                className="h-14 w-14 rounded-full p-0"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Complete Session Button */}
            {selectedSessionId && !pomodoro.isBreak && (
              <Button
                variant="outline"
                onClick={handleCompleteSession}
                className="mt-6 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Session Complete
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">{"Today's Sessions"}</CardTitle>
            <CardDescription>Select a session to start your pomodoro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todaySessions.length > 0 ? (
                todaySessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      selectedSessionId === session.id
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: session.color }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{session.subjectName}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.startTime} - {session.endTime} ({session.duration} min)
                        </p>
                      </div>
                    </div>
                    {selectedSessionId === session.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-accent" />
                  <p className="font-medium text-foreground">All done for today!</p>
                  <p className="text-sm text-muted-foreground">
                    No more sessions scheduled. Great work!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Tips */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Pomodoro Technique Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  1
                </span>
                <span>Work with full focus for 25 minutes - no distractions!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  2
                </span>
                <span>Take a 5-minute break to rest your mind</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  3
                </span>
                <span>After 4 pomodoros, take a longer 15-30 minute break</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  4
                </span>
                <span>Track your progress and celebrate small wins!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
