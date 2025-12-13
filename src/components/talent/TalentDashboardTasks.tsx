import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckSquare, Clock, AlertTriangle, CheckCircle, Film, Building2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { UserTask } from "@/types/casting";

interface TalentDashboardTasksProps {
  userId: string;
}

const PRIORITY_COLORS = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500"
};

export function TalentDashboardTasks({ userId }: TalentDashboardTasksProps) {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("user_tasks")
      .select("*, casting_shows(title), departments(name)")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    setTasks((data as any[]) || []);
    setLoading(false);
  };

  const handleComplete = async (taskId: string) => {
    const { error } = await supabase
      .from("user_tasks")
      .update({
        status: "completed",
        completion_note: completionNote,
        completed_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to complete task");
    } else {
      toast.success("Task marked as complete!");
      setCompletingTask(null);
      setCompletionNote("");
      fetchTasks();
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    const { error } = await supabase
      .from("user_tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
    } else {
      fetchTasks();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

  const TaskCard = ({ task }: { task: UserTask }) => {
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const isDueToday = task.due_date && isToday(new Date(task.due_date));

    return (
      <Card className={isOverdue ? "border-red-500" : ""}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
                {task.priority}
              </Badge>
              {task.casting_shows && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Film className="h-3 w-3" />
                  {task.casting_shows.title}
                </span>
              )}
              {task.departments && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {task.departments.name}
                </span>
              )}
            </div>
            <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>

          <h4 className="font-medium mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {task.due_date && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : isDueToday ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : 'Due: '}
                  {format(new Date(task.due_date), "MMM d, yyyy")}
                </div>
              )}
            </div>

            {task.status !== 'completed' && (
              <div className="flex gap-2">
                {task.status === 'not_started' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, 'in_progress')}
                  >
                    Start
                  </Button>
                )}
                <Dialog open={completingTask === task.id} onOpenChange={(open) => !open && setCompletingTask(null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setCompletingTask(task.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Task: {task.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Completion Note (optional)</label>
                        <Textarea
                          value={completionNote}
                          onChange={(e) => setCompletionNote(e.target.value)}
                          placeholder="Add any notes about completing this task..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCompletingTask(null)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleComplete(task.id)}>
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {task.status === 'completed' && task.completion_note && (
            <div className="mt-2 p-2 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> {task.completion_note}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className={overdueTasks.length > 0 ? "border-red-500" : ""}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{overdueTasks.length}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{completedTasks.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2" />
            <p>No tasks assigned</p>
            <p className="text-sm">Tasks will appear here when assigned to you</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">To Do ({pendingTasks.length})</h3>
              <div className="space-y-3">
                {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Completed ({completedTasks.length})</h3>
              <div className="space-y-3">
                {completedTasks.slice(0, 5).map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
