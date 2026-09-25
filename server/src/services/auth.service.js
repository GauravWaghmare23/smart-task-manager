import { randomUUID } from "node:crypto";
import { db } from "../db/db.js";

export const addUser = async (name, email, password) => {

    if (!name || !email || !password) {
        throw new Error("All fields are required");
    }

    const existingUser = db.data.users.find((user) => user.email === email);

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const user = {
        id: randomUUID(),
        name,
        email,
        password,
        role: "USER",
    };

    db.data.users.push(user);

    await db.write();

    return user;
};

export const findUser = async (email, password) => {

    if (!email || !password) {
        throw new Error("All fields are required");
    }

    const existingUser = db.data.users.find((user) => user.email === email);

    if (!existingUser) {
        throw new Error("Invalid email or password");
    }

    if (existingUser.password !== password) {
        throw new Error("Invalid email or password");
    }

    return existingUser;
};

export const getUserById = async (userId) => {

    if (!userId) {
        throw new Error("User ID is required");
    }

    const user = db.data.users.find((user) => user.id === userId);

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const getAllUsers = async () => {

    return db.data.users;

};

export const deleteUser = async (userId) => {
    
    if (!userId) {
        throw new Error("User ID is required");
    }

    const existingUser = db.data.users.find((user) => user.id === userId);

    if (!existingUser) {
        throw new Error("User not found");
    }

    const existingTask = db.data.tasks.find((task) => task.assignedTo === userId);

    if (existingTask) {
        throw new Error("Cannot delete user with assigned tasks");
    }

    if (existingUser.role === "ADMIN") {
        const adminCount = db.data.users.filter(
            (user) => user.role === "ADMIN",
        ).length;

        if (adminCount <= 1) {
            throw new Error("Cannot delete the only admin");
        }
    }

    db.data.users = db.data.users.filter((user) => user.id !== userId);

    await db.write();

    return existingUser;
};
