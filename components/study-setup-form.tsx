"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen, Clock, Calendar, Sparkles, Brain, Zap, Timer, GraduationCap, Target, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { Subject, FreeTimeSlot, DifficultyLevel, StudyTechnique } from "@/lib/types";
import { generateStudyPlan } from "@/lib/schedule-generator";
import { useStudyStore } from "@/lib/store";

const SUBJECT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const STUDY_TECHNIQUES: { id: StudyTechnique; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "pomodoro",
    name: "Pomodoro Technique",
    description: "25-min focused sessions with 5-min breaks. Great for maintaining concentration.",
    icon: <Timer className="h-5 w-5" />,
  },
  {
    id: "spaced-repetition",
    name: "Spaced Repetition",
    description: "Review at optimal intervals for long-term retention. Best for memorization.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    id: "active-recall",
    name: "Active Recall",
    description: "Test yourself frequently. Proven to be highly effective for learning.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "standard",
    name: "Standard Sessions",
    description: "Flexible 45-90 min sessions. Good for deep work and projects.",
    icon: <BookOpen className="h-5 w-5" />,
  },
];

export function StudySetupForm() {
  const { setStudyPlan, setCurrentView } = useStudyStore();
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [freeTimeSlots, setFreeTimeSlots] = useState<FreeTimeSlot[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preferredTechnique, setPreferredTechnique] = useState<StudyTechnique>("pomodoro");
  const [isGenerating, setIsGenerating] = useState(false);

  // New subject form state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDifficulty, setNewSubjectDifficulty] = useState<DifficultyLevel>("medium");
  const [newSubjectHours, setNewSubjectHours] = useState("10");
  const [newSubjectPriority, setNewSubjectPriority] = useState([3]);

  // New time slot form state
  const [newSlotDay, setNewSlotDay] = useState("Monday");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("12:00");

  const addSubject = () => {
    if (!newSubjectName.trim()) return;

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: newSubjectName,
      difficulty: newSubjectDifficulty,
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
      estimatedHours: parseInt(newSubjectHours) || 10,
      priority: newSubjectPriority[0],
    };

    setSubjects([...subjects, newSubject]);
    setNewSubjectName("");
    setNewSubjectHours("10");
    setNewSubjectDifficulty("medium");
    setNewSubjectPriority([3]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const addTimeSlot = () => {
    const newSlot: FreeTimeSlot = {
      day: newSlotDay,
      startTime: newSlotStart,
      endTime: newSlotEnd,
    };

    setFreeTimeSlots([...freeTimeSlots, newSlot]);
  };

  const removeTimeSlot = (index: number) => {
    setFreeTimeSlots(freeTimeSlots.filter((_, i) => i !== index));
  };

  const handleGeneratePlan = async () => {
    if (subjects.length === 0 || freeTimeSlots.length === 0 || !startDate || !endDate) {
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing time with visual feedback
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const plan = generateStudyPlan({
      subjects,
      startDate,
      endDate,
      freeTimeSlots,
      preferredTechnique,
    });

    setStudyPlan(plan);
    setCurrentView("dashboard");
    setIsGenerating(false);
  };

  const canProceedToStep2 = subjects.length > 0;
  const canProceedToStep3 = freeTimeSlots.length > 0;
  const canGenerate = startDate && endDate && canProceedToStep2 && canProceedToStep3;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 shadow-lg shadow-primary/20">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              AI Study Planner
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Create your personalized study schedule powered by intelligent algorithms. 
              Optimized for your subjects, difficulty levels, and available time.
            </p>
            
            {/* Progress Steps */}
            <div className="mt-8 flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => setStep(s)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                      step === s
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : step > s
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </button>
                  {s < 4 && (
                    <div className={`h-0.5 w-8 md:w-16 ${step > s ? "bg-accent" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground md:gap-12 md:text-sm">
              <span className={step === 1 ? "text-primary font-medium" : ""}>Subjects</span>
              <span className={step === 2 ? "text-primary font-medium" : ""}>Schedule</span>
              <span className={step === 3 ? "text-primary font-medium" : ""}>Dates</span>
              <span className={step === 4 ? "text-primary font-medium" : ""}>Technique</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Step 1: Subjects */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Add Your Subjects
                </CardTitle>
                <CardDescription>
                  Add subjects with their difficulty levels, estimated study hours, and priority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="subject-name" className="text-foreground">Subject Name</Label>
                    <Input
                      id="subject-name"
                      placeholder="e.g., Mathematics, Physics, History..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubject()}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Difficulty Level</Label>
                      <Select value={newSubjectDifficulty} onValueChange={(v) => setNewSubjectDifficulty(v as DifficultyLevel)}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Easy
                            </span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500" />
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value="hard">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Hard
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Estimated Hours</Label>
                      <Input
                        type="number"
                        min="1"
                        max="200"
                        value={newSubjectHours}
                        onChange={(e) => setNewSubjectHours(e.target.value)}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Priority Level</Label>
                      <span className="text-sm text-muted-foreground">
                        {newSubjectPriority[0] === 1 && "Low"}
                        {newSubjectPriority[0] === 2 && "Below Average"}
                        {newSubjectPriority[0] === 3 && "Normal"}
                        {newSubjectPriority[0] === 4 && "High"}
                        {newSubjectPriority[0] === 5 && "Critical"}
                      </span>
                    </div>
                    <Slider
                      value={newSubjectPriority}
                      onValueChange={setNewSubjectPriority}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>Critical</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={addSubject}
                    disabled={!newSubjectName.trim()}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                </div>

                {/* Subject List */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Added Subjects ({subjects.length})
                  </h4>
                  {subjects.map((subject, index) => (
                    <div
                      key={subject.id}
                      className="group flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 transition-all hover:bg-secondary/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${subject.color}20` }}
                        >
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{subject.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant={
                                subject.difficulty === "hard"
                                  ? "destructive"
                                  : subject.difficulty === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {subject.difficulty}
                            </Badge>
                            <span>{subject.estimatedHours}h</span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              P{subject.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubject(subject.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {subjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
                      <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No subjects added yet. Add your first subject above.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Free Time Slots */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Clock className="h-5 w-5 text-accent" />
                  Set Your Available Time
                </CardTitle>
                <CardDescription>
                  Tell us when you're free to study each week. The AI will optimize your schedule based on these slots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Day of Week</Label>
                    <Select value={newSlotDay} onValueChange={setNewSlotDay}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">Start Time</Label>
                      <Input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-foreground">End Time</Label>
                      <Input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  <Button onClick={addTimeSlot} variant="secondary" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Time Slot
                  </Button>
                </div>

                {/* Time Slot Grid */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Weekly Schedule ({freeTimeSlots.length} slots)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {freeTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 transition-all hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-xs font-medium text-accent">
                            {slot.day.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{slot.day}</p>
                            <p className="text-sm text-muted-foreground">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(index)}
                          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {freeTimeSlots.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
                      <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No time slots added. Add when you're free to study.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Date Range */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Study Period
                </CardTitle>
                <CardDescription>
                  Set your exam or deadline date. Your schedule will be complete 2 days before to allow for final review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-input border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">When do you want to start studying?</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">End Date (Exam/Deadline)</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      className="bg-input border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Your exam or project deadline</p>
                  </div>
                </div>
                
                {startDate && endDate && (
                  <div className="mt-6 rounded-xl bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Study Period Summary</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days total, 
                          schedule completes {new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 2)).toLocaleDateString("en-US", { month: "short", day: "numeric" })} (2 days before deadline)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!startDate || !endDate}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Study Technique */}
        {step === 4 && (
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Brain className="h-5 w-5 text-accent" />
                  Choose Your Study Technique
                </CardTitle>
                <CardDescription>
                  Select a scientifically-proven study method that suits your learning style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {STUDY_TECHNIQUES.map((technique) => (
                    <button
                      key={technique.id}
                      onClick={() => setPreferredTechnique(technique.id)}
                      className={`group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all ${
                        preferredTechnique === technique.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          preferredTechnique === technique.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {technique.icon}
                        </div>
                        {preferredTechnique === technique.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          preferredTechnique === technique.id ? "text-primary" : "text-foreground"
                        }`}>
                          {technique.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {technique.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Plan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm text-muted-foreground">Subjects</p>
                    <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm text-muted-foreground">Weekly Slots</p>
                    <p className="text-2xl font-bold text-foreground">{freeTimeSlots.length}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold text-foreground">
                      {subjects.reduce((sum, s) => sum + s.estimatedHours, 0)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleGeneratePlan}
                disabled={!canGenerate || isGenerating}
                className="gap-2 px-8"
              >
                {isGenerating ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate AI Study Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
