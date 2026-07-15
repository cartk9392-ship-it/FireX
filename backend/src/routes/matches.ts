import { FastifyInstance, FastifyReply } from 'fastify';
import { MatchModel, TournamentModel, RegistrationModel, UserModel, MatchResultModel, TransactionModel, NotificationModel } from '../store';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function matchRoutes(fastify: FastifyInstance) {
  const authenticate = async (request: any, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized token" });
    }
  };

  // Get matches
  fastify.get('/', async (request: any, reply) => {
    const { tournamentId } = request.query as any;
    if (tournamentId) {
      return await MatchModel.find({ tournamentId });
    }
    return await MatchModel.find({});
  });

  // Get matches specifically for a player (tournaments they joined)
  fastify.get('/player-matches', { preValidation: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.id;
    // Find all tournaments this user is registered in
    const joinedRegs = await RegistrationModel.find({ userIds: userId });
    const tournamentIds = joinedRegs.map(r => r.tournamentId);

    // Return matches belonging to those tournaments
    return await MatchModel.find({ tournamentId: { $in: tournamentIds } });
  });

  // Get single match details and its leaderboard/results if any
  fastify.get('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const match = await MatchModel.findOne({ id });
    if (!match) return reply.code(404).send({ message: "Match not found" });

    const result = await MatchResultModel.findOne({ matchId: id });
    const reg = await RegistrationModel.findOne({ tournamentId: match.tournamentId });
    const tournamentRegs = reg ? reg.userIds : [];

    const assignedPlayers = await UserModel.find({ id: { $in: tournamentRegs } })
      .select('id name email');

    return { match, result: result || null, players: assignedPlayers };
  });

  // Create Match (Admin only)
  fastify.post('/', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { tournamentId, roomId, roomPassword, startTime, map } = request.body as any;

    if (!tournamentId || !roomId || !roomPassword || !startTime || !map) {
      return reply.code(400).send({ message: "All fields are required" });
    }

    const tournament = await TournamentModel.findOne({ id: tournamentId });
    if (!tournament) return reply.code(404).send({ message: "Tournament not found" });

    const newMatch = await MatchModel.create({
      id: 'm-' + generateId(),
      tournamentId,
      tournamentName: tournament.name,
      roomId,
      roomPasswordHash: roomPassword,
      startTime,
      map,
      status: 'Upcoming',
      resultsUploaded: false
    });

    // Notify all registered players for this tournament
    const reg = await RegistrationModel.findOne({ tournamentId });
    const playerIds = reg ? reg.userIds : [];
    
    for (const pId of playerIds) {
      await NotificationModel.create({
        id: 'n-' + generateId(),
        userId: pId,
        title: "Match Room Created!",
        message: `Match for tournament "${tournament.name}" is scheduled. Room ID: ${roomId}, Password: ${roomPassword}. Starts at ${startTime}.`,
        date: new Date().toISOString(),
        read: false
      });
    }

    return reply.code(201).send(newMatch);
  });

  // Update Match Status (Admin only)
  fastify.put('/:id', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const { status, roomId, roomPassword, startTime, map } = request.body as any;

    const match = await MatchModel.findOne({ id });
    if (!match) return reply.code(404).send({ message: "Match not found" });

    if (status) match.status = status;
    if (roomId) match.roomId = roomId;
    if (roomPassword) match.roomPasswordHash = roomPassword;
    if (startTime) match.startTime = startTime;
    if (map) match.map = map;

    await match.save();

    // Send notifications if status turns Live
    if (status === 'Live') {
      const reg = await RegistrationModel.findOne({ tournamentId: match.tournamentId });
      const playerIds = reg ? reg.userIds : [];
      
      for (const pId of playerIds) {
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: pId,
          title: "Match is Live!",
          message: `Join Room ${match.roomId} now! The Free Fire match is starting.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }

    return match;
  });

  // Upload Result & Distribute Prizes (Admin only)
  fastify.post('/:id/results', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { id } = request.params;
    const { results } = request.body as { results: any[] };

    const match = await MatchModel.findOne({ id });
    if (!match) return reply.code(404).send({ message: "Match not found" });

    if (match.resultsUploaded) {
      return reply.code(400).send({ message: "Results already uploaded for this match" });
    }

    const finalPlayerResults: any[] = [];

    // Process each result, verify player, adjust balance, record transaction, record notification
    for (const res of results) {
      const player = await UserModel.findOne({ id: res.playerId });
      if (!player) continue;

      const prize = Number(res.prizeAwarded) || 0;
      if (prize > 0) {
        player.walletBalance += prize;
        await player.save();
        
        // Record Transaction
        await TransactionModel.create({
          id: 'tx-' + generateId(),
          userId: player.id,
          userName: player.name,
          type: 'Prize',
          amount: prize,
          status: 'Completed',
          date: new Date().toISOString()
        });

        // Notify winner
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: player.id,
          title: "Prize Credited!",
          message: `Congratulations! You placed Rank ${res.rank} in ${match.tournamentName} and won ${prize} INR!`,
          date: new Date().toISOString(),
          read: false
        });
      } else {
        // Notify standard result
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: player.id,
          title: "Match Finished",
          message: `Results uploaded for ${match.tournamentName}. You placed Rank ${res.rank} with ${res.kills} kills.`,
          date: new Date().toISOString(),
          read: false
        });
      }

      finalPlayerResults.push({
        playerId: res.playerId,
        playerName: player.name,
        rank: Number(res.rank),
        kills: Number(res.kills),
        points: Number(res.points),
        prizeAwarded: prize
      });
    }

    // Save results
    const matchResult = await MatchResultModel.create({
      matchId: id,
      tournamentId: match.tournamentId,
      results: finalPlayerResults.sort((a, b) => a.rank - b.rank)
    });

    match.resultsUploaded = true;
    match.status = 'Completed';
    await match.save();

    // Update Tournament Status to Completed if all matches are complete
    const tournament = await TournamentModel.findOne({ id: match.tournamentId });
    if (tournament) {
      const allMatches = await MatchModel.find({ tournamentId: tournament.id });
      const allCompleted = allMatches.every(m => m.status === 'Completed' || m.resultsUploaded);
      if (allCompleted) {
        tournament.status = 'Completed';
        await tournament.save();
      }
    }

    return matchResult;
  });
}
