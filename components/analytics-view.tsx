"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Flame,
  Award,
  Calendar,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStudyStore } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AnalyticsView() {
  const { studyPlan, studyStats, dailyStudyLog, setCurrentView } = useStudyStore();

  const chartData = useMemo(() => {
    if (!studyPlan) return { weeklyData: [], subjectData: [], progressData: [] };

    // Weekly distribution
    const weeklyMinutes: number[] = [0, 0, 0, 0, 0, 0, 0];
    studyPlan.sessions.forEach((session) => {
      if (session.completed) {
        const day = new Date(session.date).getDay();
        weeklyMinutes[day] += session.duration;
      }
    });
    const weeklyData = DAYS.map((day, index) => ({
      day,
      minutes: weeklyMinutes[index],
      hours: Math.round(weeklyMinutes[index] / 60 * 10) / 10,
    }));

    // Subject distribution
    const subjectMinutes = new Map<string, { name: string; minutes: number; color: string }>();
    studyPlan.subjects.forEach((subject) => {
      subjectMinutes.set(subject.id, { name: subject.name, minutes: 0, color: subject.color });
    });
    studyPlan.sessions.forEach((session) => {
      if (session.completed) {
        const current = subjectMinutes.get(session.subjectId);
        if (current) {
          current.minutes += session.duration;
        }
      }
    });
    const subjectData = Array.from(subjectMinutes.values()).filter((s) => s.minutes > 0);

    // Progress over time
    const progressByDate = new Map<string, number>();
    let cumulative = 0;
    const sortedSessions = [...studyPlan.sessions]
      .filter((s) => s.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    sortedSessions.forEach((session) => {
      cumulative += session.duration;
      progressByDate.set(session.date, cumulative);
    });
    
    const progressData = Array.from(progressByDate.entries())
      .map(([date, minutes]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        minutes,
        hours: Math.round(minutes / 60 * 10) / 10,
      }))
      .slice(-14); // Last 14 data points

    return { weeklyData, subjectData, progressData };
  }, [studyPlan]);

  if (!studyPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No study plan found.</p>
      </div>
    );
  }

  const completedSessions = studyPlan.sessions.filter((s) => s.completed).length;
  const totalSessions = studyPlan.sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

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
              <h1 className="text-xl font-bold text-foreground">Study Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your progress and insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.currentStreak} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.longestStreak} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/20">
                <Clock className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Session</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.averageSessionLength} min</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/20">
                <Calendar className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.mostProductiveDay.slice(0, 3)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Progress Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Weekly Distribution
              </CardTitle>
              <CardDescription>Hours studied per day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.weeklyData}>
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}h`, 'Hours']}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <BookOpen className="h-5 w-5 text-accent" />
                Subject Distribution
              </CardTitle>
              <CardDescription>Time spent on each subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.subjectData}
                        dataKey="minutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {chartData.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {chartData.subjectData.map((subject) => (
                    <div key={subject.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="text-sm text-foreground">{subject.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(subject.minutes / 60)}h
                      </span>
                    </div>
                  ))}
                  {chartData.subjectData.length === 0 && (
                    <p className="text-sm text-muted-foreground">No completed sessions yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Over Time */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <TrendingUp className="h-5 w-5 text-chart-3" />
                Cumulative Progress
              </CardTitle>
              <CardDescription>Total study hours over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {chartData.progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.progressData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`${value}h total`, 'Progress']}
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorHours)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Complete some sessions to see your progress</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Target className="h-5 w-5 text-primary" />
              Weekly Goal Progress
            </CardTitle>
            <CardDescription>Complete all scheduled sessions this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">
                  {Math.round(studyStats.weeklyGoalProgress)}%
                </span>
              </div>
              <Progress value={studyStats.weeklyGoalProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {studyStats.weeklyGoalProgress >= 100
                  ? "Congratulations! You've completed your weekly goal!"
                  : `${Math.round(100 - studyStats.weeklyGoalProgress)}% remaining to reach your weekly goal`}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
