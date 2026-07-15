import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { tournamentRoutes } from './routes/tournaments';
import { matchRoutes } from './routes/matches';
import { playerRoutes } from './routes/players';
import { walletRoutes } from './routes/wallet';
import { settingsRoutes } from './routes/settings';

import mongoose from 'mongoose';
import { seedDatabase } from './store';
import dns from 'dns';

// Force Node to use Google DNS to resolve MongoDB Atlas SRV query records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const server = fastify({ logger: true });

const start = async () => {
  try {
    // Connect to MongoDB Database
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/firex_local';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(dbUri);
    console.log("🚀 Connected successfully to MongoDB Database instance");

    // Seed database
    await seedDatabase();
    // Register CORS
    await server.register(cors, {
      origin: '*', // For development, allow all origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    });

    // Register JWT
    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'super_secret_firex_key_12345'
    });

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(tournamentRoutes, { prefix: '/api/tournaments' });
    await server.register(matchRoutes, { prefix: '/api/matches' });
    await server.register(playerRoutes, { prefix: '/api/players' });
    await server.register(walletRoutes, { prefix: '/api/wallet' });
    await server.register(settingsRoutes, { prefix: '/api/settings' });

    // Health check route
    server.get('/health', async () => {
      return { status: 'OK', uptime: process.uptime() };
    });

    const port = Number(process.env.PORT) || 5000;
    
    // Listen on port
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Fastify ERP backend server running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
