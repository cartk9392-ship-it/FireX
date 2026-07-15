import { FastifyInstance, FastifyReply } from 'fastify';
import { TransactionModel, UserModel, NotificationModel } from '../store';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function walletRoutes(fastify: FastifyInstance) {
  const authenticate = async (request: any, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized token" });
    }
  };

  // Get current user's transaction history & balance (Player)
  fastify.get('/my-wallet', { preValidation: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.id;
    const user = await UserModel.findOne({ id: userId });
    if (!user) return reply.code(404).send({ message: "User not found" });

    const txs = await TransactionModel.find({ userId }).sort({ date: -1 });
    return {
      balance: user.walletBalance,
      transactions: txs
    };
  });

  // Get all transaction history (Admin only)
  fastify.get('/admin/transactions', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }
    return await TransactionModel.find({}).sort({ date: -1 });
  });

  // Get pending deposit requests (Admin only)
  fastify.get('/admin/deposits/pending', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }
    const pendingDeposits = await TransactionModel.find({
      type: 'Deposit',
      status: 'Pending'
    }).sort({ date: -1 });
    return pendingDeposits;
  });

  // Submit UPI Deposit Request (Player) — creates Pending transaction, does NOT credit wallet
  fastify.post('/deposit', { preValidation: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.id;
    const { amount, utrNumber } = request.body as any;

    if (!amount || Number(amount) <= 0) {
      return reply.code(400).send({ message: "Invalid deposit amount" });
    }

    if (!utrNumber || String(utrNumber).trim().length < 6) {
      return reply.code(400).send({ message: "Please enter a valid UTR / Transaction Reference number." });
    }

    const user = await UserModel.findOne({ id: userId });
    if (!user) return reply.code(404).send({ message: "User not found" });

    // Check if UTR already submitted to prevent duplicate
    const duplicate = await TransactionModel.findOne({
      utrNumber: String(utrNumber).trim(),
      type: 'Deposit'
    });
    if (duplicate) {
      return reply.code(400).send({ message: "This UTR number has already been submitted. Please check your transaction history." });
    }

    const depositAmount = Number(amount);
    const netDepositAmount = depositAmount - 1;

    const newTx = await TransactionModel.create({
      id: 'tx-' + generateId(),
      userId,
      userName: user.name,
      type: 'Deposit',
      amount: netDepositAmount, // GST deducted amount shown to admin
      status: 'Pending',
      utrNumber: String(utrNumber).trim(),
      date: new Date().toISOString()
    });

    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId,
      title: "Deposit Request Submitted",
      message: `Your deposit request of ₹${depositAmount} INR (GST Deducted: ₹${netDepositAmount} INR, UTR: ${utrNumber}) is pending admin verification.`,
      date: new Date().toISOString(),
      read: false
    });

    return {
      message: "Deposit request submitted successfully. Pending admin approval.",
      transaction: newTx
    };
  });

  // Admin: Approve or Reject a Deposit Request
  fastify.post('/admin/deposits/:txId/process', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { txId } = request.params as any;
    const { action } = request.body as any; // 'approve' or 'reject'

    const tx = await TransactionModel.findOne({ id: txId, type: 'Deposit' });
    if (!tx) return reply.code(404).send({ message: "Deposit transaction not found" });

    if (tx.status !== 'Pending') {
      return reply.code(400).send({ message: "This deposit request has already been processed" });
    }

    const user = await UserModel.findOne({ id: tx.userId });

    if (action === 'approve') {
      tx.status = 'Approved';
      await tx.save();

      // Now credit the wallet
      if (user) {
        user.walletBalance += tx.amount;
        await user.save();

        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: user.id,
          title: "Deposit Approved ✅",
          message: `Your deposit of ₹${tx.amount} INR (UTR: ${tx.utrNumber}) has been verified and credited to your wallet. New balance: ₹${user.walletBalance} INR.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    } else if (action === 'reject') {
      tx.status = 'Rejected';
      await tx.save();

      // Wallet was never credited so no refund needed
      if (user) {
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: user.id,
          title: "Deposit Rejected ❌",
          message: `Your deposit request of ₹${tx.amount} INR (UTR: ${tx.utrNumber}) was rejected by admin. Please contact support if this is an error.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    } else {
      return reply.code(400).send({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    return tx;
  });

  // Request withdrawal (creates a 'Pending' transaction)
  fastify.post('/withdraw', { preValidation: [authenticate] }, async (request: any, reply) => {
    const userId = request.user.id;
    const { amount, upiId } = request.body as any;

    if (!amount || Number(amount) <= 0) {
      return reply.code(400).send({ message: "Invalid withdrawal amount" });
    }

    if (!upiId || String(upiId).trim().length < 3) {
      return reply.code(400).send({ message: "Please provide a valid UPI ID (e.g., name@ybl) for payout." });
    }

    const user = await UserModel.findOne({ id: userId });
    if (!user) return reply.code(404).send({ message: "User not found" });

    const withdrawAmount = Number(amount);
    if (user.walletBalance < withdrawAmount) {
      return reply.code(400).send({ message: "Insufficient balance for withdrawal" });
    }

    // Deduct from wallet immediately (hold funds in escrow status 'Pending')
    user.walletBalance -= withdrawAmount;
    await user.save();

    const netWithdrawAmount = withdrawAmount - 1;

    const newTx = await TransactionModel.create({
      id: 'tx-' + generateId(),
      userId,
      userName: user.name,
      type: 'Withdrawal',
      amount: netWithdrawAmount, // Net payout amount shown to admin
      status: 'Pending',
      playerUpiId: String(upiId).trim(),
      date: new Date().toISOString()
    });

    await NotificationModel.create({
      id: 'n-' + generateId(),
      userId,
      title: "Withdrawal Requested",
      message: `Your request to withdraw ₹${withdrawAmount} INR (Net Payout: ₹${netWithdrawAmount} INR to UPI ID: ${upiId}) is pending admin approval.`,
      date: new Date().toISOString(),
      read: false
    });

    return {
      message: "Withdrawal requested successfully",
      balance: user.walletBalance,
      transaction: newTx
    };
  });

  // Process/Approve withdrawal (Admin only)
  fastify.post('/admin/withdrawals/:txId/process', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { txId } = request.params as any;
    const { action } = request.body as any; // 'approve' or 'reject'

    const tx = await TransactionModel.findOne({ id: txId, type: 'Withdrawal' });
    if (!tx) return reply.code(404).send({ message: "Withdrawal transaction not found" });

    if (tx.status !== 'Pending') {
      return reply.code(400).send({ message: "Transaction is already processed" });
    }

    const user = await UserModel.findOne({ id: tx.userId });

    if (action === 'approve') {
      tx.status = 'Approved';
      await tx.save();

      if (user) {
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: user.id,
          title: "Withdrawal Approved",
          message: `Your withdrawal of ₹${tx.amount} INR has been approved and processed.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    } else if (action === 'reject') {
      tx.status = 'Rejected';
      await tx.save();

      if (user) {
        user.walletBalance += tx.amount + 1; // Refund original gross amount (net + 1 fee)
        await user.save();

        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: user.id,
          title: "Withdrawal Rejected",
          message: `Your withdrawal of ₹${tx.amount + 1} INR was rejected. The amount has been refunded to your wallet.`,
          date: new Date().toISOString(),
          read: false
        });
      }
    } else {
      return reply.code(400).send({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    return tx;
  });

  // Distribute Promotional Bonus (Admin only)
  fastify.post('/admin/bonus', { preValidation: [authenticate] }, async (request: any, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ message: "Access forbidden" });
    }

    const { target, amount, message } = request.body as any;
    const bonusAmount = Number(amount);

    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      return reply.code(400).send({ message: "Invalid bonus amount. Must be greater than 0." });
    }

    if (!message || message.trim().length === 0) {
      return reply.code(400).send({ message: "Please specify a bonus message or event name." });
    }

    const dateStr = new Date().toISOString();

    if (target === 'all') {
      const players = await UserModel.find({ role: 'player' });
      if (players.length === 0) {
        return reply.code(400).send({ message: "No players registered in the system yet." });
      }

      for (const p of players) {
        p.walletBalance += bonusAmount;
        await p.save();
        
        // Add transaction
        await TransactionModel.create({
          id: 'tx-' + generateId(),
          userId: p.id,
          userName: p.name,
          type: 'Bonus',
          amount: bonusAmount,
          status: 'Completed',
          remarks: message.trim(),
          date: dateStr
        });

        // Add Notification
        await NotificationModel.create({
          id: 'n-' + generateId(),
          userId: p.id,
          title: "🎁 Festival Bonus Credited!",
          message: `${message.trim()} (₹${bonusAmount} INR added to your wallet).`,
          date: dateStr,
          read: false
        });
      }

      return { message: `Successfully distributed ₹${bonusAmount} bonus to all ${players.length} players.` };
    } else {
      const player = await UserModel.findOne({ id: target, role: 'player' });
      if (!player) {
        return reply.code(404).send({ message: "Selected player not found." });
      }

      player.walletBalance += bonusAmount;
      await player.save();

      // Add transaction
      await TransactionModel.create({
        id: 'tx-' + generateId(),
        userId: player.id,
        userName: player.name,
        type: 'Bonus',
        amount: bonusAmount,
        status: 'Completed',
        remarks: message.trim(),
        date: dateStr
      });

      // Add Notification
      await NotificationModel.create({
        id: 'n-' + generateId(),
        userId: player.id,
        title: "🎁 Bonus Credited!",
        message: `${message.trim()} (₹${bonusAmount} INR added to your wallet).`,
        date: dateStr,
        read: false
      });

      return { message: `Successfully credited ₹${bonusAmount} bonus to player ${player.name}.` };
    }
  });
}
