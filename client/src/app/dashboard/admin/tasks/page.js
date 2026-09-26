"use client";

import { useEffect, useState } from "react";

import {
  ListTodo,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import { getAllTasks } from "@/services/api/task.api";
import { getUsers } from "@/services/api/auth.api";

import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskDetailsDialog from "@/components/tasks/TaskDetailsDialog";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Load tasks and users
   *
   * Kept outside useEffect because:
   * - Retry button needs it
   * - CreateTaskDialog needs it
   * - TaskDetailsDialog needs it
   */
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [tasksResponse, usersResponse] =
        await Promise.all([
          getAllTasks(),
          getUsers(),
        ]);

      setTasks(
        tasksResponse.data || tasksResponse
      );

      setUsers(
        usersResponse.data || usersResponse
      );
    } catch (error) {
      console.error("Tasks error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load tasks."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Initial page load
   */
  useEffect(() => {
    loadTasks();
  }, []);

  /*
   * Filter tasks locally
   */
  const filteredTasks = tasks.filter((task) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      task.title
        ?.toLowerCase()
        .includes(searchValue) ||
      task.description
        ?.toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      status === "ALL" ||
      task.status === status;

    const matchesPriority =
      priority === "ALL" ||
      task.priority === priority;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  /*
   * Find assigned user
   */
  const getUserName = (userId) => {
    const user = users.find(
      (user) => user.id === userId
    );

    return user?.name || "Unassigned";
  };

  /*
   * Format status for display
   */
  const formatStatus = (value) => {
    if (!value) {
      return "-";
    }

    return value
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  /*
   * Format priority for display
   */
  const formatPriority = (value) => {
    if (!value) {
      return "-";
    }

    return (
      value.charAt(0) +
      value.slice(1).toLowerCase()
    );
  };

  /*
   * Clear filters
   */
  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPriority("ALL");
  };

  /*
   * Open task details
   */
  const handleViewTask = (task) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };

  /*
   * Close task details
   *
   * Clear selected task after the dialog closes.
   */
  const handleDetailsDialogChange = (open) => {
    setDetailsDialogOpen(open);

    if (!open) {
      setSelectedTask(null);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* =========================================
          PAGE HEADER
      ========================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Tasks
          </h1>

          <p className="text-sm text-muted-foreground">
            Create, assign, and manage tasks.
          </p>
        </div>

        <Button
          onClick={() =>
            setCreateDialogOpen(true)
          }
        >
          <Plus className="size-4" />
          Create Task
        </Button>
      </div>

      {/* =========================================
          ERROR STATE
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
          TASK CARD
      ========================================== */}
      {!error && (
        <Card>
          {/* Header + filters */}
          <CardHeader className="space-y-4 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">
                All Tasks
              </CardTitle>

              <span className="shrink-0 text-sm text-muted-foreground">
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1
                  ? "task"
                  : "tasks"}
              </span>
            </div>

            {/* Filters */}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
              {/* Search */}
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {/* Status */}
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
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
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
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Priority */}
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
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
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
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Clear */}
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={
                  search === "" &&
                  status === "ALL" &&
                  priority === "ALL"
                }
              >
                Clear
              </Button>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent className="px-0 pb-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 border-t py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-t py-12 text-center">
                <ListTodo className="mb-3 size-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  No tasks found
                </p>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {tasks.length === 0
                    ? "Create your first task to get started."
                    : "Try changing your filters or search terms."}
                </p>

                {tasks.length === 0 && (
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() =>
                      setCreateDialogOpen(true)
                    }
                  >
                    <Plus className="size-4" />
                    Create Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">
                        Task
                      </TableHead>

                      <TableHead>
                        Priority
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Assigned To
                      </TableHead>

                      <TableHead>
                        Dependencies
                      </TableHead>

                      <TableHead className="pr-5 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        {/* Task */}
                        <TableCell className="max-w-[320px] pl-5">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {task.title}
                            </p>

                            {task.description && (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          {formatPriority(
                            task.priority
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {formatStatus(
                            task.status
                          )}
                        </TableCell>

                        {/* Assigned user */}
                        <TableCell>
                          {getUserName(
                            task.assignedTo
                          )}
                        </TableCell>

                        {/* Dependencies */}
                        <TableCell>
                          {task.dependencies?.length ||
                            0}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="pr-5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewTask(task)
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================
          CREATE TASK DIALOG
      ========================================== */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        users={users}
        tasks={tasks}
        onTaskCreated={loadTasks}
      />

      {/* =========================================
          TASK DETAILS DIALOG
      ========================================== */}
      <TaskDetailsDialog
        task={selectedTask}
        open={detailsDialogOpen}
        onOpenChange={handleDetailsDialogChange}
        users={users}
        tasks={tasks}
        onTaskUpdated={loadTasks}
      />
    </div>
  );
}