"use client";

import { useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import { createTask } from "@/services/api/task.api";

import { createTaskSchema } from "@/schemas/task.schema";

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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function CreateTaskDialog({
  open,
  onOpenChange,
  users,
  tasks,
  onTaskCreated,
}) {
  const [serverError, setServerError] = useState("");

  const form = useForm({
    resolver: zodResolver(createTaskSchema),

    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      assignedTo: "",
      dependencies: [],
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedTo: "",
        dependencies: [],
      });

      setServerError("");
    }
  }, [open, form]);

  const onSubmit = async (formData) => {
    try {
      setServerError("");

      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        dependencies: formData.dependencies,
      });

      toast.success("Task created successfully");

      onOpenChange(false);

      await onTaskCreated();
    } catch (error) {
      console.error("Create task error:", error);

      const message =
        error.response?.data?.message ||
        "Unable to create task.";

      setServerError(message);

      toast.error(message);
    }
  };

  const toggleDependency = (taskId, checked) => {
    const currentDependencies =
      form.getValues("dependencies");

    if (checked) {
      form.setValue(
        "dependencies",
        [...currentDependencies, taskId],
        {
          shouldValidate: true,
        }
      );
    } else {
      form.setValue(
        "dependencies",
        currentDependencies.filter(
          (id) => id !== taskId
        ),
        {
          shouldValidate: true,
        }
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>

          <DialogDescription>
            Create a task and assign it to a user.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FieldGroup>
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                >
                  <FieldLabel htmlFor="task-title">
                    Title
                  </FieldLabel>

                  <Input
                    {...field}
                    id="task-title"
                    placeholder="e.g. Implement authentication"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                >
                  <FieldLabel htmlFor="task-description">
                    Description
                  </FieldLabel>

                  <Textarea
                    {...field}
                    id="task-description"
                    placeholder="Describe what needs to be done..."
                    className="min-h-24 resize-none"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Priority */}
              <Controller
                name="priority"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>
                      Priority
                    </FieldLabel>

                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={[
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
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>

                      <SelectContent>
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

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Assigned User */}
              <Controller
                name="assignedTo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>
                      Assign To
                    </FieldLabel>

                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>

                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                          >
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Dependencies */}
            <Controller
              name="dependencies"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>
                    Dependencies
                  </FieldLabel>

                  <p className="text-xs text-muted-foreground">
                    Select tasks that must be completed before
                    this task can be marked as done.
                  </p>

                  {tasks.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        No existing tasks available.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-32 rounded-md border">
                      <div className="space-y-3 p-3">
                        {tasks.map((task) => {
                          const checked =
                            field.value.includes(task.id);

                          return (
                            <label
                              key={task.id}
                              className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleDependency(
                                    task.id,
                                    value === true
                                  )
                                }
                              />

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {task.title}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {task.status}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {serverError && (
            <p className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Creating..."
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}