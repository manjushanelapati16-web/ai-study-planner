"use client";

import { useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  TrendingUp,
  BookOpen,
  Bell,
  RefreshCw,
  ChevronRight,
  Flame,
  Timer,
  BarChart3,
  Target,
  Sparkles,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/lib/store";
import type { StudySession } from "@/lib/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

function isFuture(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr > today;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function StudyDashboard() {
  const { studyPlan, toggleSessionComplete, setCurrentView, resetPlan, addNotification, notifications, studyStats, updateStats } = useStudyStore();

  // Update stats on mount
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  // Generate notifications on mount and weekly
  useEffect(() => {
    if (!studyPlan) return;

    const today = new Date();
    const endDate = new Date(studyPlan.endDate);
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Check if we need to add a "2 days before due" notification
    if (daysUntilEnd <= 2 && daysUntilEnd > 0) {
      const existingNotification = notifications.find(
        (n) => n.type === "due_reminder" && n.title.includes("days until deadline")
      );
      if (!existingNotification) {
        addNotification({
          id: `due-${Date.now()}`,
          type: "due_reminder",
          title: `${daysUntilEnd} days until deadline!`,
          message: "Your study schedule is ending soon. Make sure to complete all remaining sessions.",
          date: new Date().toISOString(),
          read: false,
        });
      }
    }

    // Check for weekly review
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) { // Sunday
      const lastWeeklyNotification = notifications.find(
        (n) => n.type === "weekly_check" && 
        new Date(n.date).toDateString() === today.toDateString()
      );
      if (!lastWeeklyNotification) {
        addNotification({
          id: `weekly-${Date.now()}`,
          type: "weekly_check",
          title: "Weekly Progress Review",
          message: "Time to review your study progress for this week!",
          date: new Date().toISOString(),
          read: false,
        });
      }
    }
  }, [studyPlan, addNotification, notifications]);

  const stats = useMemo(() => {
    if (!studyPlan) return null;

    const totalSessions = studyPlan.sessions.length;
    const completedSessions = studyPlan.sessions.filter((s) => s.completed).length;
    const totalMinutes = studyPlan.sessions.reduce((sum, s) => sum + s.duration, 0);
    const completedMinutes = studyPlan.sessions
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = studyPlan.sessions.filter((s) => s.date === today);
    const todayCompleted = todaySessions.filter((s) => s.completed).length;

    // Sessions per subject
    const subjectStats = studyPlan.subjects.map((subject) => {
      const subjectSessions = studyPlan.sessions.filter((s) => s.subjectId === subject.id);
      const completed = subjectSessions.filter((s) => s.completed).length;
      return {
        ...subject,
        totalSessions: subjectSessions.length,
        completedSessions: completed,
        progress: subjectSessions.length > 0 ? (completed / subjectSessions.length) * 100 : 0,
      };
    });

    // Upcoming sessions (next 7 days)
    const upcoming = studyPlan.sessions
      .filter((s) => !s.completed && (isToday(s.date) || isFuture(s.date)))
      .slice(0, 5);

    const daysUntilDeadline = getDaysUntil(studyPlan.endDate);

    return {
      totalSessions,
      completedSessions,
      progress: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      totalHours: Math.round(totalMinutes / 60),
      completedHours: Math.round(completedMinutes / 60),
      todaySessions,
      todayCompleted,
      subjectStats,
      upcoming,
      daysUntilDeadline,
    };
  }, [studyPlan]);

  if (!studyPlan || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No study plan found.</p>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StudyAI</h1>
              <p className="text-sm text-muted-foreground">
                {stats.daysUntilDeadline > 0
                  ? `${stats.daysUntilDeadline} days until deadline`
                  : "Deadline reached!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("pomodoro")}
              title="Pomodoro Timer"
            >
              <Timer className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("analytics")}
              title="Analytics"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("notifications")}
              className="relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("schedule")}
              title="Schedule"
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetPlan}
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Progress Hero */}
        <Card className="mb-6 border-border bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="mt-1 text-4xl font-bold text-foreground">
                  {Math.round(stats.progress)}%
                </p>
                <div className="mt-3">
                  <Progress value={stats.progress} className="h-3" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats.completedSessions} of {stats.totalSessions} sessions completed
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-accent/20">
                    <Flame className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{studyStats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-chart-3/20">
                    <Clock className="h-6 w-6 text-chart-3" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.completedHours}h</p>
                  <p className="text-xs text-muted-foreground">Studied</p>
                </div>
                <div className="text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-chart-4/20">
                    <Target className="h-6 w-6 text-chart-4" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Total Goal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Tasks */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  {"Today's Study Sessions"}
                </CardTitle>
                <CardDescription>
                  {stats.todaySessions.length > 0
                    ? `${stats.todaySessions.length - stats.todayCompleted} sessions remaining`
                    : "No sessions scheduled for today"}
                </CardDescription>
              </div>
              {stats.todaySessions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView("pomodoro")}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Timer
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.todaySessions.length > 0 ? (
                  stats.todaySessions.map((session) => (
                    <TaskItem
                      key={session.id}
                      session={session}
                      onToggle={() => toggleSessionComplete(session.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                      <CheckCircle2 className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-lg font-medium text-foreground">No sessions today!</p>
                    <p className="text-sm text-muted-foreground">
                      Enjoy your break or review previous topics.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <BookOpen className="h-5 w-5 text-accent" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.subjectStats.map((subject) => (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-medium text-foreground text-sm">{subject.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(subject.progress)}%
                      </span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <TrendingUp className="h-5 w-5 text-chart-3" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>Your next study sessions</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("schedule")}
              className="text-muted-foreground"
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.upcoming.length > 0 ? (
                stats.upcoming.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${session.color}20` }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: session.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{session.subjectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>
                    <Badge variant={isToday(session.date) ? "default" : "secondary"} className="flex-shrink-0">
                      {isToday(session.date) ? "Today" : formatDate(session.date)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-muted-foreground">All sessions completed!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setCurrentView("pomodoro")}
          >
            <Timer className="h-6 w-6 text-primary" />
            <span>Pomodoro Timer</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setCurrentView("analytics")}
          >
            <BarChart3 className="h-6 w-6 text-accent" />
            <span>View Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setCurrentView("schedule")}
          >
            <Calendar className="h-6 w-6 text-chart-3" />
            <span>Weekly Schedule</span>
          </Button>
        </div>
      </main>
    </div>
  );
}

function TaskItem({
  session,
  onToggle,
}: {
  session: StudySession;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
        session.completed
          ? "border-accent/30 bg-accent/10"
          : "border-border bg-secondary/30 hover:bg-secondary/50"
      }`}
    >
      <button
        onClick={onToggle}
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
            className={`font-medium truncate ${
              session.completed ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {session.subjectName}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.startTime} - {session.endTime}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className="text-xs">
          {session.technique === "pomodoro" ? "Pomodoro" : session.duration + " min"}
        </Badge>
        {!session.completed && (
          <Badge variant="secondary" className="text-xs">
            {session.duration} min
          </Badge>
        )}
      </div>
    </div>
  );
}
