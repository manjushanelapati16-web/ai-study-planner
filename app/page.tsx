"use client";

import { useEffect, useState } from "react";
import { useStudyStore } from "@/lib/store";
import { StudySetupForm } from "@/components/study-setup-form";
import { StudyDashboard } from "@/components/study-dashboard";
import { ScheduleView } from "@/components/schedule-view";
import { NotificationsView } from "@/components/notifications-view";
import { AnalyticsView } from "@/components/analytics-view";
import { PomodoroTimer } from "@/components/pomodoro-timer";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { currentView, studyPlan } = useStudyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">StudyAI</p>
            <p className="text-sm text-muted-foreground">Loading your study plan...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no study plan exists, always show setup
  if (!studyPlan) {
    return <StudySetupForm />;
  }

  // Otherwise, render based on current view
  switch (currentView) {
    case "setup":
      return <StudySetupForm />;
    case "dashboard":
      return <StudyDashboard />;
    case "schedule":
      return <ScheduleView />;
    case "notifications":
      return <NotificationsView />;
    case "analytics":
      return <AnalyticsView />;
    case "pomodoro":
      return <PomodoroTimer />;
    default:
      return <StudyDashboard />;
  }
}
