import { generateToken } from "../utils/token.js";

import {
  addUser,
  findUser,
  deleteUser,
  getUserById,
  getAllUsers,
} from "../services/auth.service.js";


export const createUser = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const user = await addUser(name, email, password);

    res.status(201).json({
      success: true,
      message: "User successfully created",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await findUser(email, password);

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


export const getCurrentUser = async (req, res) => {

  try {

    const user = await getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};


export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));

    res.status(200).json({
      success: true,
      data: safeUsers,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const removeUser = async (req, res) => {

  try {

    const { id } = req.params;

    await deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User successfully deleted",
    });

  } catch (error) {
    
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
