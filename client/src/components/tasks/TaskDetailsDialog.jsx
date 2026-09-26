"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import {
  deleteTask,
  updateTaskStatus,
} from "@/services/api/task.api";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";

export default function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  users,
  tasks,
  onTaskUpdated,
}) {
  const [status, setStatus] = useState("TODO");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
    }
  }, [task]);

  if (!task) {
    return null;
  }

  const assignedUser = users.find(
    (user) => user.id === task.assignedTo
  );

  const dependencies = (task.dependencies || [])
    .map((dependencyId) =>
      tasks.find((item) => item.id === dependencyId)
    )
    .filter(Boolean);

  const incompleteDependencies =
    dependencies.filter(
      (dependency) => dependency.status !== "DONE"
    );

  const hasIncompleteDependencies =
    incompleteDependencies.length > 0;

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

  const formatPriority = (value) => {
    if (!value) {
      return "-";
    }

    return (
      value.charAt(0) +
      value.slice(1).toLowerCase()
    );
  };

  const handleStatusUpdate = async () => {
    if (status === task.status) {
      return;
    }

    if (
      status === "DONE" &&
      hasIncompleteDependencies
    ) {
      toast.error(
        "Complete all dependencies before marking this task as done."
      );

      return;
    }

    try {
      setIsUpdating(true);

      await updateTaskStatus(task.id, status);

      toast.success("Task status updated");

      await onTaskUpdated();

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to update task status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteTask(task.id);

      toast.success("Task deleted successfully");

      await onTaskUpdated();

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to delete task."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {task.title}
          </DialogTitle>

          <DialogDescription>
            View and manage task details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Description */}
          <div>
            <p className="mb-1 text-sm font-medium">
              Description
            </p>

            <p className="text-sm leading-6 text-muted-foreground">
              {task.description ||
                "No description provided."}
            </p>
          </div>

          <Separator />

          {/* Basic information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Priority
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatPriority(task.priority)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Assigned To
              </p>

              <p className="mt-1 text-sm font-medium">
                {assignedUser?.name ||
                  "Unassigned"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Current Status
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatStatus(task.status)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Dependencies
              </p>

              <p className="mt-1 text-sm font-medium">
                {dependencies.length}
              </p>
            </div>
          </div>

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <>
              <Separator />

              <div>
                <p className="mb-3 text-sm font-medium">
                  Dependencies
                </p>

                <div className="space-y-2">
                  {dependencies.map(
                    (dependency) => {
                      const isComplete =
                        dependency.status ===
                        "DONE";

                      return (
                        <div
                          key={dependency.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {dependency.title}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatStatus(
                                dependency.status
                              )}
                            </p>
                          </div>

                          {isComplete ? (
                            <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                          ) : (
                            <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}

          {/* Dependency warning */}
          {hasIncompleteDependencies && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-medium text-amber-900">
                  Task is blocked
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Complete all dependencies before
                  marking this task as done.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Update Status
            </p>

            <Select
              value={status}
              onValueChange={setStatus}
              disabled={
                isUpdating || isDeleting
              }
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

                <SelectItem
                  value="DONE"
                  disabled={
                    hasIncompleteDependencies
                  }
                >
                  Done
                </SelectItem>
              </SelectContent>
            </Select>

            {hasIncompleteDependencies && (
              <p className="text-xs text-muted-foreground">
                Done is unavailable until all
                dependencies are completed.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              isDeleting || isUpdating
            }
          >
            <Trash2 className="size-4" />

            {isDeleting
              ? "Deleting..."
              : "Delete"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={
                isDeleting || isUpdating
              }
            >
              Cancel
            </Button>

            <Button
              onClick={handleStatusUpdate}
              disabled={
                isDeleting ||
                isUpdating ||
                status === task.status
              }
            >
              {isUpdating
                ? "Updating..."
                : "Update Status"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}