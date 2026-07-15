import { FastifyInstance, FastifyReply } from 'fastify';
import { UserModel, TournamentModel, RegistrationModel, MatchResultModel, MatchModel, TransactionModel, NotificationModel } from '../store';

export async function playerRoutes(fastify: FastifyInstance) {
  const authenticate = async (request: any, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized token" });
    }
  };

  // Get all players (Admin only)
  fastify.get('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { search, filter } = request.query as any;

    const query: any = { role: 'player' };

    if (search) {
      const q = search.toLowerCase();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    if (filter) {
      if (filter === 'banned') {
        query.isBanned = true;
      } else if (filter === 'active') {
        query.isBanned = false;
      }
    }

    const players = await UserModel.find(query);
    return players;
  });

  // Get specific player details and history (Admin or the Player themselves)
  fastify.get('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { id } = request.params;
    const userId = request.user.id;
    const userRole = request.user.role;

    if (userRole !== 'admin' && userId !== id) {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const player = await UserModel.findOne({ id });
    if (!player) return reply.code(404).send({ message: "Player not found" });

    // Find all tournaments they registered for by querying the Registration schema
    const matchingRegistrations = await RegistrationModel.find({ userIds: id });
    const tournamentIds = matchingRegistrations.map(r => r.tournamentId);
    const joinedTournaments = await TournamentModel.find({ id: { $in: tournamentIds } });

    // Find all matching results
    const results: any[] = [];
    const matchResults = await MatchResultModel.find({ "results.playerId": id });

    for (const mr of matchResults) {
      const pres = mr.results.find(r => r.playerId === id);
      if (pres) {
        const match = await MatchModel.findOne({ id: mr.matchId });
        results.push({
          matchId: mr.matchId,
          tournamentId: mr.tournamentId,
          tournamentName: match ? match.tournamentName : "Unknown Tournament",
          rank: pres.rank,
          kills: pres.kills,
          points: pres.points,
          prize: pres.prizeAwarded
        });
      }
    }

    // Transactions
    const txHistory = await TransactionModel.find({ userId: id }).sort({ date: -1 });

    return {
      player: {
        id: player.id,
        name: player.name,
        email: player.email,
        isBanned: player.isBanned,
        walletBalance: player.walletBalance,
        inGameName: player.inGameName,
        inGameUid: player.inGameUid
      },
      tournaments: joinedTournaments,
      matchResults: results,
      transactions: txHistory
    };
  });

  // Ban/Unban Player (Admin only)
  fastify.patch('/:id/ban', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const { ban } = request.body as any;

    const player = await UserModel.findOne({ id });
    if (!player) return reply.code(404).send({ message: "Player not found" });

    player.isBanned = ban;
    await player.save();

    // Push notification to target player
    await NotificationModel.create({
      id: 'n-' + Math.random().toString(36).substr(2, 9),
      userId: player.id,
      title: ban ? "Account Banned" : "Account Restored",
      message: ban
        ? "Your account has been suspended due to policy violations. Contact support."
        : "Your account suspension has been lifted. Welcome back!",
      date: new Date().toISOString(),
      read: false
    });

    return player;
  });

  // Remove Player (Admin only)
  fastify.delete('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const player = await UserModel.findOne({ id });
    if (!player) return reply.code(404).send({ message: "Player not found" });

    await UserModel.deleteOne({ id });

    // Clean up registrations
    await RegistrationModel.updateMany(
      { userIds: id },
      { $pull: { userIds: id } }
    );

    return { message: "Player removed successfully" };
  });

  // Update player profile details (Admin or Player themselves)
  fastify.patch('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    const { id } = request.params;
    const userId = request.user.id;
    const userRole = request.user.role;

    if (userRole !== 'admin' && userId !== id) {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { inGameName, inGameUid } = request.body as any;

    const player = await UserModel.findOne({ id });
    if (!player) return reply.code(404).send({ message: "Player not found" });

    if (inGameName !== undefined) player.inGameName = inGameName;
    if (inGameUid !== undefined) player.inGameUid = inGameUid;

    await player.save();

    return {
      message: "Profile updated successfully",
      player: {
        id: player.id,
        name: player.name,
        email: player.email,
        walletBalance: player.walletBalance,
        inGameName: player.inGameName,
        inGameUid: player.inGameUid
      }
    };
  });
}
