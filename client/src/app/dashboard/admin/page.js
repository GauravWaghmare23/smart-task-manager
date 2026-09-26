"use client";

import { useEffect, useState } from "react";

import {
  Users,
  ListTodo,
  CheckCircle2,
  Clock3,
  Circle,
  LoaderCircle,
} from "lucide-react";

import { getUsers } from "@/services/api/auth.api";
import { getAllTasks } from "@/services/api/task.api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [usersResponse, tasksResponse] =
          await Promise.all([
            getUsers(),
            getAllTasks(),
          ]);

        setUsers(usersResponse.data || usersResponse);
        setTasks(tasksResponse.data || tasksResponse);
      } catch (error) {
        console.error("Dashboard error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "DONE"
  ).length;

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      description: "Registered users",
      icon: Users,
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      description: "Tasks in the system",
      icon: ListTodo,
    },
    {
      title: "Completed",
      value: completedTasks,
      description: "Tasks marked as done",
      icon: CheckCircle2,
    },
    {
      title: "Pending",
      value: pendingTasks,
      description: "Tasks not completed",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-5 p-4">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Overview of your task management system.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {!error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>

                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>

                <CardContent className="px-5 pb-5">
                  <div className="text-2xl font-semibold">
                    {isLoading ? "..." : stat.value}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Overview */}
      {!error && (
        <Card>
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-base">
              Task Overview
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading task data...
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed py-10">
                <div className="text-center">
                  <ListTodo className="mx-auto mb-3 size-7 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    No tasks yet
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Create your first task to see task statistics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Circle className="size-4 text-muted-foreground" />

                    <span className="text-sm font-medium">
                      Todo
                    </span>
                  </div>

                  <p className="mt-2 text-2xl font-semibold">
                    {todoTasks}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Waiting to start
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-muted-foreground" />

                    <span className="text-sm font-medium">
                      In Progress
                    </span>
                  </div>

                  <p className="mt-2 text-2xl font-semibold">
                    {inProgressTasks}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Currently being worked on
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-muted-foreground" />

                    <span className="text-sm font-medium">
                      Done
                    </span>
                  </div>

                  <p className="mt-2 text-2xl font-semibold">
                    {completedTasks}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Completed tasks
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}