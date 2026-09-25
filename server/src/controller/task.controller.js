import {
  createTask,
  getTasks,
  getAllTasks,
  deleteTask,
  updateStatus,
  getTaskById,
} from "../services/task.service.js";

export const createTaskController = async (req, res) => {
  try {
    const createdBy = req.user.userId;

    const {
      title,
      description,
      priority,
      assignedTo,
      dependencies = [],
    } = req.body;

    const task = await createTask({
      title,
      description,
      priority,
      assignedTo,
      createdBy,
      dependencies,
    });

    res.status(201).json({
      success: true,
      message: "Task successfully created and assigned",
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTasksController = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { priority, status } = req.query;

    const tasks = await getTasks(userId, { priority, status });

    res.status(200).json({
      success: true,
      message: "Tasks successfully received",
      data: tasks,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllTasksController = async (req, res) => {
  try {
    const { priority, status } = req.query;

    const tasks = await getAllTasks({ priority, status });

    res.status(200).json({
      success: true,
      message: "Tasks successfully retrieved",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaskByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await getTaskById(id, req.user);

    res.status(200).json({
      success: true,
      message: "Task successfully retrieved",
      data: task,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTaskController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await deleteTask(id);

    res.status(200).json({
      success: true,
      message: "Task successfully deleted",
      data: deletedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTaskStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedTask = await updateStatus(id, status, req.user);

    res.status(200).json({
      success: true,
      message: "Task status successfully updated",
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
