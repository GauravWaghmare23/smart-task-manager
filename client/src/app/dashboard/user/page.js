"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  ListTodo,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { getMyTasks } from "@/services/api/task.api";
import { updateTaskStatus } from "@/services/api/task.api";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatStatus(status) {
  if (!status) {
    return "-";
  }

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriority(priority) {
  if (!priority) {
    return "-";
  }

  return (
    priority.charAt(0) +
    priority.slice(1).toLowerCase()
  );
}

function getPriorityClass(priority) {
  switch (priority) {
    case "HIGH":
      return "border-destructive/30 text-destructive";

    case "MEDIUM":
      return "border-yellow-500/30 text-yellow-600";

    case "LOW":
      return "border-green-500/30 text-green-600";

    default:
      return "text-muted-foreground";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "DONE":
      return <CheckCircle2 className="size-4" />;

    case "IN_PROGRESS":
      return <Clock3 className="size-4" />;

    default:
      return <ListTodo className="size-4" />;
  }
}

export default function UserDashboardPage() {
  const [tasks, setTasks] = useState([]);

  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingTaskId, setUpdatingTaskId] =
    useState(null);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError("");

      const filters = {};

      if (status !== "ALL") {
        filters.status = status;
      }

      if (priority !== "ALL") {
        filters.priority = priority;
      }

      const response = await getMyTasks(filters);

      setTasks(response.data || response);
    } catch (error) {
      console.error("My tasks error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load your tasks."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [status, priority]);

  const handleStatusChange = async (
    taskId,
    newStatus
  ) => {
    try {
      setUpdatingTaskId(taskId);

      await updateTaskStatus(
        taskId,
        newStatus
      );

      toast.success("Task status updated");

      await loadTasks();
    } catch (error) {
      console.error(
        "Update task status error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to update task status."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* =========================================
          HEADER
      ========================================== */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          My Tasks
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View and manage the tasks assigned to you.
        </p>
      </div>

      {/* =========================================
          STATS
      ========================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Tasks
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {totalTasks}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <ListTodo className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  To Do
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {todoTasks}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <ListTodo className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  In Progress
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {inProgressTasks}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Clock3 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {completedTasks}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================
          ERROR
      ========================================== */}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-destructive">
              {error}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTasks}
              disabled={isLoading}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* =========================================
          TASKS
      ========================================== */}

      {!error && (
        <Card>
          <CardHeader className="space-y-4 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">
                Assigned Tasks
              </CardTitle>

              <span className="text-sm text-muted-foreground">
                {tasks.length}{" "}
                {tasks.length === 1
                  ? "task"
                  : "tasks"}
              </span>
            </div>

            {/* Filters */}

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={status}
                onValueChange={setStatus}
                items={[
                  {
                    label: "All statuses",
                    value: "ALL",
                  },
                  {
                    label: "Todo",
                    value: "TODO",
                  },
                  {
                    label: "In Progress",
                    value: "IN_PROGRESS",
                  },
                  {
                    label: "Done",
                    value: "DONE",
                  },
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All statuses
                  </SelectItem>

                  <SelectItem value="TODO">
                    Todo
                  </SelectItem>

                  <SelectItem value="IN_PROGRESS">
                    In Progress
                  </SelectItem>

                  <SelectItem value="DONE">
                    Done
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priority}
                onValueChange={setPriority}
                items={[
                  {
                    label: "All priorities",
                    value: "ALL",
                  },
                  {
                    label: "Low",
                    value: "LOW",
                  },
                  {
                    label: "Medium",
                    value: "MEDIUM",
                  },
                  {
                    label: "High",
                    value: "HIGH",
                  },
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All priorities
                  </SelectItem>

                  <SelectItem value="LOW">
                    Low
                  </SelectItem>

                  <SelectItem value="MEDIUM">
                    Medium
                  </SelectItem>

                  <SelectItem value="HIGH">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading your tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListTodo className="mb-3 size-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  No tasks found
                </p>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  You don't currently have any tasks
                  matching these filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Task information */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {task.title}
                          </h3>

                          <span
                            className={`rounded-md border px-2 py-1 text-xs font-medium ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {formatPriority(
                              task.priority
                            )}
                          </span>
                        </div>

                        {task.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            {getStatusIcon(
                              task.status
                            )}

                            {formatStatus(
                              task.status
                            )}
                          </span>

                          <span>
                            Dependencies:{" "}
                            {task.dependencies
                              ?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Status control */}

                      <div className="w-full sm:w-[180px]">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Update status
                        </p>

                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              task.id,
                              value
                            )
                          }
                          disabled={
                            updatingTaskId ===
                            task.id
                          }
                          items={[
                            {
                              label: "Todo",
                              value: "TODO",
                            },
                            {
                              label: "In Progress",
                              value: "IN_PROGRESS",
                            },
                            {
                              label: "Done",
                              value: "DONE",
                            },
                          ]}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="TODO">
                              Todo
                            </SelectItem>

                            <SelectItem value="IN_PROGRESS">
                              In Progress
                            </SelectItem>

                            <SelectItem value="DONE">
                              Done
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {updatingTaskId ===
                          task.id && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <LoaderCircle className="size-3 animate-spin" />
                            Updating...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}