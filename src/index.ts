import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';

const app = express();
app.use(express.json());

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "test_db",
  entities: [User, Post],
  synchronize: true,
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initializeDatabase = async () => {
  await wait(20000);
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  } catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  }
};

initializeDatabase();

app.post('/users', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newUser = new User();    
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.email = email;
    
    const savedUser = await AppDataSource.manager.save(newUser);
    
    return res.status(201).json(savedUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Failed to create user!"});
  }
});

app.post('/posts', async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const user = await AppDataSource.manager.findOne(User, { where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "Error, User not found!" });
    }
    const post = new Post(title, description, userId);
    post.title = title;
    post.description = description;
    post.user = user;
    const savedPost = await AppDataSource.manager.save(post);
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
