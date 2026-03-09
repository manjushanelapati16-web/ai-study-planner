"use client";

import {
  Bell,
  AlertTriangle,
  CalendarCheck,
  Clock,
  ArrowLeft,
  CheckCheck,
  Trash2,
  Award,
  Flame,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/lib/store";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const NOTIFICATION_ICONS = {
  weekly_check: CalendarCheck,
  due_reminder: AlertTriangle,
  session_reminder: Clock,
  achievement: Award,
  streak: Flame,
};

const NOTIFICATION_COLORS = {
  weekly_check: "text-primary bg-primary/20",
  due_reminder: "text-destructive bg-destructive/20",
  session_reminder: "text-chart-3 bg-chart-3/20",
  achievement: "text-accent bg-accent/20",
  streak: "text-chart-5 bg-chart-5/20",
};

const NOTIFICATION_BADGES = {
  weekly_check: { label: "Weekly", variant: "default" as const },
  due_reminder: { label: "Urgent", variant: "destructive" as const },
  session_reminder: { label: "Reminder", variant: "secondary" as const },
  achievement: { label: "Achievement", variant: "default" as const },
  streak: { label: "Streak", variant: "secondary" as const },
};

export function NotificationsView() {
  const { notifications, markNotificationRead, clearNotifications, setCurrentView } = useStudyStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
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
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              const iconColor = NOTIFICATION_COLORS[notification.type] || "text-muted-foreground bg-secondary";
              const badge = NOTIFICATION_BADGES[notification.type];

              return (
                <Card
                  key={notification.id}
                  className={`border-border transition-all cursor-pointer hover:bg-secondary/30 ${
                    notification.read ? "bg-card/50 opacity-75" : "bg-card"
                  }`}
                  onClick={() => !notification.read && markNotificationRead(notification.id)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-semibold ${
                                notification.read ? "text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {badge && (
                              <Badge variant={badge.variant} className="text-xs">
                                {badge.label}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(notification.date)}
                          </span>
                          {!notification.read && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No notifications</h3>
              <p className="text-center text-sm text-muted-foreground max-w-sm">
                {"You'll receive reminders for weekly progress checks, upcoming deadlines, and achievements."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Bell className="h-5 w-5 text-primary" />
              Notification Types
            </CardTitle>
            <CardDescription>What reminders you'll receive</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Weekly Check-in</p>
                <p className="text-sm text-muted-foreground">
                  Every Sunday, review your progress
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground">Due Date Reminder</p>
                <p className="text-sm text-muted-foreground">
                  2 days before your deadline
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Achievements</p>
                <p className="text-sm text-muted-foreground">
                  Celebrate your milestones
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/20">
                <Flame className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Streak Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Keep your study streak alive
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
