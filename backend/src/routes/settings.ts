import { FastifyInstance, FastifyReply } from 'fastify';
import { AppSettingsModel, NotificationModel } from '../store';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function settingsRoutes(fastify: FastifyInstance) {
  const authenticate = async (request: any, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized token" });
    }
  };

  // Get App Settings
  fastify.get('/', async () => {
    const settings = await AppSettingsModel.findOne({});
    return settings;
  });

  // Update App Settings (Admin only)
  fastify.put('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { logoUrl, appName, contactEmail, privacyPolicy, termsConditions, upiId, upiQrUrl, youtubeUrl, whatsappUrl } = request.body as any;

    let settings = await AppSettingsModel.findOne({});
    if (!settings) {
      settings = new AppSettingsModel();
    }

    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (appName !== undefined) settings.appName = appName;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (privacyPolicy !== undefined) settings.privacyPolicy = privacyPolicy;
    if (termsConditions !== undefined) settings.termsConditions = termsConditions;
    if (upiId !== undefined) settings.upiId = upiId;
    if (upiQrUrl !== undefined) settings.upiQrUrl = upiQrUrl;
    if (youtubeUrl !== undefined) settings.youtubeUrl = youtubeUrl;
    if (whatsappUrl !== undefined) settings.whatsappUrl = whatsappUrl;

    await settings.save();
    return settings;
  });

  // Get Notifications (Player/Admin specific)
  fastify.get('/notifications', { preValidation: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.id;
    const role = request.user.role;

    if (role === 'admin') {
      // Admins see all notifications
      return await NotificationModel.find({}).sort({ date: -1 });
    } else {
      // Players see "all" and their specific notifications
      return await NotificationModel.find({
        $or: [
          { userId: 'all' },
          { userId: userId }
        ]
      }).sort({ date: -1 });
    }
  });

  // Mark Notification as Read
  fastify.patch('/notifications/:id/read', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { id } = request.params;
    const userId = request.user.id;

    const notification = await NotificationModel.findOne({ id });
    if (!notification) return reply.code(404).send({ message: "Notification not found" });

    // Ensure it belongs to the player or is public
    if (notification.userId !== 'all' && notification.userId !== userId && request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    notification.read = true;
    await notification.save();
    return notification;
  });

  // Create Broadcast Notification (Admin only)
  fastify.post('/notifications', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { title, message } = request.body as any;
    if (!title || !message) {
      return reply.code(400).send({ message: "Title and message are required" });
    }

    const newNotification = await NotificationModel.create({
      id: 'n-' + generateId(),
      userId: 'all',
      title,
      message,
      date: new Date().toISOString(),
      read: false
    });

    return newNotification;
  });
}
