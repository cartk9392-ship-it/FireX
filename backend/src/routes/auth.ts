import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserModel, NotificationModel, User } from '../store';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function authRoutes(fastify: FastifyInstance) {
  // Player Registration
  fastify.post('/register', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { name, email, password, inGameName, inGameUid } = request.body as any;

    if (!name || !email || !password) {
      return reply.code(400).send({ message: "All fields are required" });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return reply.code(400).send({ message: "Email is already registered" });
    }

    const newId = 'p-' + generateId();
    const newUser = await UserModel.create({
      id: newId,
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'player',
      isBanned: false,
      walletBalance: 0,
      inGameName,
      inGameUid
    });

    // Auto-create sign up notification
    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId: newUser.id,
      title: "Welcome to FireX!",
      message: `Hey ${name}, welcome to the ultimate Free Fire ERP platform. Add funds to your wallet to start playing!`,
      date: new Date().toISOString(),
      read: false
    });

    const token = fastify.jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role });

    return reply.code(201).send({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletBalance: newUser.walletBalance,
        inGameName: newUser.inGameName,
        inGameUid: newUser.inGameUid
      }
    });
  });

  // Login (Universal - checks credentials for players and fixed super admin)
  fastify.post('/login', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.code(400).send({ message: "Email and password are required" });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check fixed Super Admin credentials from env
    const adminEmail = process.env.ADMIN_EMAIL || "tejas@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "tejas4010";

    if (trimmedEmail === adminEmail.toLowerCase().trim()) {
      if (password === adminPassword) {
        const token = fastify.jwt.sign({ id: 'admin-fixed', email: adminEmail, role: 'admin' });
        return reply.send({
          token,
          user: {
            id: 'admin-fixed',
            name: "Super Admin",
            email: adminEmail,
            role: 'admin',
            walletBalance: 999999
          }
        });
      } else {
        return reply.code(401).send({ message: "Invalid Email or Password" });
      }
    }

    // Check regular Player
    const user = await UserModel.findOne({ email: trimmedEmail });
    if (!user || user.passwordHash !== password) {
      return reply.code(401).send({ message: "Invalid Email or Password" });
    }

    if (user.isBanned) {
      return reply.code(403).send({ message: "Your account has been banned. Contact admin support." });
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });

    return reply.send({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  });

  // Get current user profile (JWT protected)
  fastify.get('/me', {
    preValidation: [async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }]
  }, async (request: any, reply: FastifyReply) => {
    const jwtUser = request.user;
    if (jwtUser.id === 'admin-fixed') {
      return reply.send({
        id: 'admin-fixed',
        name: "Super Admin",
        email: process.env.ADMIN_EMAIL || "tejas@gmail.com",
        role: 'admin',
        walletBalance: 999999
      });
    }

    const user = await UserModel.findOne({ id: jwtUser.id });
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    if (user.isBanned) {
      return reply.code(403).send({ message: "Your account is banned." });
    }

    return reply.send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance,
      inGameName: user.inGameName,
      inGameUid: user.inGameUid
    });
  });
}
