import { FastifyInstance, FastifyReply } from 'fastify';
import { TournamentModel, UserModel, RegistrationModel, TeamRegistrationModel, TransactionModel, NotificationModel } from '../store';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function tournamentRoutes(fastify: FastifyInstance) {
  // Helper to authenticate JWT
  const authenticate = async (request: any, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized token" });
    }
  };

  // Get all tournaments
  fastify.get('/', async (request: any, reply) => {
    let userRole = 'player';
    try {
      const decoded: any = await request.jwtVerify();
      userRole = decoded.role;
    } catch (e) {
      // Unauthenticated
    }

    if (userRole === 'admin') {
      return await TournamentModel.find({});
    } else {
      return await TournamentModel.find({ published: true });
    }
  });

  // Get tournament details by ID
  fastify.get('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    // Find registrants
    const registration = await RegistrationModel.findOne({ tournamentId: id });
    const registeredIds = registration ? registration.userIds : [];
    const registeredPlayers = await UserModel.find({ id: { $in: registeredIds } })
      .select('id name email');

    return { tournament, players: registeredPlayers };
  });

  // Create Tournament (Admin only)
  fastify.post('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { name, gameMode, entryFee, prizePool, map, date, time, maxSlots } = request.body as any;

    if (!name || !gameMode || entryFee === undefined || !prizePool || !map || !date || !time || !maxSlots) {
      return reply.code(400).send({ message: "All fields are required" });
    }

    const newId = 't-' + generateId();
    const newTournament = await TournamentModel.create({
      id: newId,
      name,
      gameMode,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      map,
      date,
      time,
      maxSlots: Number(maxSlots),
      joinedCount: 0,
      status: 'Upcoming',
      published: false
    });

    await RegistrationModel.create({
      tournamentId: newId,
      userIds: []
    });

    // System-wide notification about upcoming tournament
    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId: 'all',
      title: "New Tournament Created",
      message: `Tournament ${name} scheduled for ${date} at ${time}. Entry Fee: ${entryFee} INR.`,
      date: new Date().toISOString(),
      read: false
    });

    return reply.code(201).send(newTournament);
  });

  // Update Tournament (Admin only)
  fastify.put('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const { name, gameMode, entryFee, prizePool, map, date, time, maxSlots, status } = request.body as any;

    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    if (name !== undefined) tournament.name = name;
    if (gameMode !== undefined) tournament.gameMode = gameMode;
    if (entryFee !== undefined) tournament.entryFee = Number(entryFee);
    if (prizePool !== undefined) tournament.prizePool = Number(prizePool);
    if (map !== undefined) tournament.map = map;
    if (date !== undefined) tournament.date = date;
    if (time !== undefined) tournament.time = time;
    if (maxSlots !== undefined) tournament.maxSlots = Number(maxSlots);
    if (status !== undefined) tournament.status = status;

    await tournament.save();

    // If status is changed to Live or Completed, trigger appropriate notifications
    if (status === 'Live' || status === 'Completed') {
      await NotificationModel.create({
        id: 'n-' + generateId(),
        userId: 'all',
        title: `Tournament ${status}!`,
        message: `The tournament "${tournament.name}" is now ${status.toLowerCase()}. Check details.`,
        date: new Date().toISOString(),
        read: false
      });
    }

    return tournament;
  });

  // Delete Tournament (Admin only)
  fastify.delete('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    await TournamentModel.deleteOne({ id });
    await RegistrationModel.deleteOne({ tournamentId: id });
    await TeamRegistrationModel.deleteMany({ tournamentId: id });

    return { message: "Tournament deleted successfully" };
  });

  // Publish Tournament (Admin only)
  fastify.patch('/:id/publish', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    tournament.published = true;
    await tournament.save();

    // Send global notification
    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId: 'all',
      title: "New Tournament Published!",
      message: `Registration is now open for ${tournament.name}! Map: ${tournament.map}, Game Mode: ${tournament.gameMode}.`,
      date: new Date().toISOString(),
      read: false
    });

    return tournament;
  });

  // Join Tournament (Player only)
  fastify.post('/:id/join', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { id } = request.params;
    const userId = request.user.id;
    const body = request.body as any || {};
    const { teammates } = body;

    if (request.user.role !== 'player') {
      return reply.code(400).send({ message: "Only players can join tournaments" });
    }

    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    if (!tournament.published) {
      return reply.code(400).send({ message: "Tournament is not published yet" });
    }

    if (tournament.status !== 'Upcoming') {
      return reply.code(400).send({ message: `Cannot join tournament in status: ${tournament.status}` });
    }

    const player = await UserModel.findOne({ id: userId });
    if (!player) return reply.code(404).send({ message: "Player not found" });

    // Validate team members for Duo / Squad
    if (tournament.gameMode === 'Duo') {
      if (!Array.isArray(teammates) || teammates.length !== 1) {
        return reply.code(400).send({ message: "Duo tournament requires exactly 1 teammate UID and name." });
      }
      for (const tm of teammates) {
        if (!tm.ffUid || !tm.ffName) {
          return reply.code(400).send({ message: "Each teammate must have a Free Fire UID and Name." });
        }
      }
    }

    if (tournament.gameMode === 'Squad') {
      if (!Array.isArray(teammates) || teammates.length !== 3) {
        return reply.code(400).send({ message: "Squad tournament requires exactly 3 teammates UID and names." });
      }
      for (const tm of teammates) {
        if (!tm.ffUid || !tm.ffName) {
          return reply.code(400).send({ message: "Each teammate must have a Free Fire UID and Name." });
        }
      }
    }

    // Check if already joined
    let reg = await RegistrationModel.findOne({ tournamentId: id });
    if (!reg) {
      reg = await RegistrationModel.create({ tournamentId: id, userIds: [] });
    }

    if (reg.userIds.includes(userId)) {
      return reply.code(400).send({ message: "You are already registered for this tournament" });
    }

    if (tournament.joinedCount >= tournament.maxSlots) {
      return reply.code(400).send({ message: "Tournament is full" });
    }

    // Check balance
    if (player.walletBalance < tournament.entryFee) {
      return reply.code(400).send({ message: "Insufficient wallet balance. Please add funds." });
    }

    // Deduct entry fee
    player.walletBalance -= tournament.entryFee;
    tournament.joinedCount += 1;

    reg.userIds.push(userId);
    await reg.save();
    await player.save();
    await tournament.save();

    // Store team registration for Duo/Squad
    if (tournament.gameMode === 'Duo' || tournament.gameMode === 'Squad') {
      await TeamRegistrationModel.create({
        id: 'tr-' + generateId(),
        tournamentId: id,
        captainUserId: player.id,
        captainName: player.name,
        captainFfUid: player.inGameUid || '',
        captainFfName: player.inGameName || player.name,
        teammates: teammates,
        registeredAt: new Date().toISOString()
      });
    }

    // Record Transaction
    await TransactionModel.create({
      id: 'tx-' + generateId(),
      userId: player.id,
      userName: player.name,
      type: 'Entry Fee',
      amount: tournament.entryFee,
      status: 'Completed',
      date: new Date().toISOString()
    });

    // Notify Player
    const modeLabel = tournament.gameMode === 'Duo' ? 'Duo' : tournament.gameMode === 'Squad' ? 'Squad' : 'Solo';
    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId: player.id,
      title: "Registered Successfully!",
      message: `You successfully joined "${tournament.name}" as ${modeLabel}. Fee of ${tournament.entryFee} INR deducted.`,
      date: new Date().toISOString(),
      read: false
    });

    return {
      message: "Successfully joined tournament",
      tournament,
      walletBalance: player.walletBalance
    };
  });

  // Get team registrations for a tournament (Admin only)
  fastify.get('/:id/teams', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const tournament = await TournamentModel.findOne({ id });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    // For Solo: return list of individual registrants
    if (tournament.gameMode === 'Solo') {
      const reg = await RegistrationModel.findOne({ tournamentId: id });
      const registeredIds = reg ? reg.userIds : [];
      const soloPlayers = await UserModel.find({ id: { $in: registeredIds } });
      const soloEntries = soloPlayers.map(u => ({
        id: u.id,
        name: u.name,
        ffName: u.inGameName || u.name,
        ffUid: u.inGameUid || 'N/A'
      }));
      return { gameMode: 'Solo', entries: soloEntries };
    }

    // For Duo/Squad: return team registrations
    const teams = await TeamRegistrationModel.find({ tournamentId: id });
    return { gameMode: tournament.gameMode, entries: teams };
  });
}
