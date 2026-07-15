import mongoose, { Schema, Document } from 'mongoose';

// TS Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'player' | 'admin';
  isBanned: boolean;
  walletBalance: number;
  inGameName?: string;
  inGameUid?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameMode: 'Solo' | 'Duo' | 'Squad';
  entryFee: number;
  prizePool: number;
  map: 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine';
  date: string;
  time: string;
  maxSlots: number;
  joinedCount: number;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  published: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roomId: string;
  roomPasswordHash: string;
  startTime: string;
  map: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  resultsUploaded: boolean;
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  rank: number;
  kills: number;
  points: number;
  prizeAwarded: number;
}

export interface MatchResult {
  matchId: string;
  tournamentId: string;
  results: PlayerResult[];
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'Deposit' | 'Withdrawal' | 'Prize' | 'Entry Fee' | 'Bonus';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  date: string;
  utrNumber?: string;
  playerUpiId?: string;
  remarks?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface TeamMember {
  ffUid: string;
  ffName: string;
}

export interface TeamRegistration {
  id: string;
  tournamentId: string;
  captainUserId: string;
  captainName: string;
  captainFfUid: string;
  captainFfName: string;
  teammates: TeamMember[];
  registeredAt: string;
}

export interface AppSettings {
  logoUrl: string;
  appName: string;
  contactEmail: string;
  privacyPolicy: string;
  termsConditions: string;
  upiId: string;
  upiQrUrl: string;
}

// ---------------- Mongoose Schema Definitions ----------------

const UserSchema = new Schema<User & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['player', 'admin'], default: 'player' },
  isBanned: { type: Boolean, required: true, default: false },
  walletBalance: { type: Number, required: true, default: 0 },
  inGameName: { type: String },
  inGameUid: { type: String }
});

const TournamentSchema = new Schema<Tournament & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gameMode: { type: String, required: true, enum: ['Solo', 'Duo', 'Squad'] },
  entryFee: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  map: { type: String, required: true, enum: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'] },
  date: { type: String, required: true },
  time: { type: String, required: true },
  maxSlots: { type: Number, required: true },
  joinedCount: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'], default: 'Upcoming' },
  published: { type: Boolean, required: true, default: false }
});

const MatchSchema = new Schema<Match & Document>({
  id: { type: String, required: true, unique: true },
  tournamentId: { type: String, required: true },
  tournamentName: { type: String, required: true },
  roomId: { type: String, required: true },
  roomPasswordHash: { type: String, required: true },
  startTime: { type: String, required: true },
  map: { type: String, required: true },
  status: { type: String, required: true, enum: ['Upcoming', 'Live', 'Completed'], default: 'Upcoming' },
  resultsUploaded: { type: Boolean, required: true, default: false }
});

const MatchResultSchema = new Schema<MatchResult & Document>({
  matchId: { type: String, required: true, unique: true },
  tournamentId: { type: String, required: true },
  results: [{
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    rank: { type: Number, required: true },
    kills: { type: Number, required: true },
    points: { type: Number, required: true },
    prizeAwarded: { type: Number, required: true }
  }]
});

const TransactionSchema = new Schema<Transaction & Document>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  type: { type: String, required: true, enum: ['Deposit', 'Withdrawal', 'Prize', 'Entry Fee', 'Bonus'] },
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  date: { type: String, required: true },
  utrNumber: { type: String },
  playerUpiId: { type: String },
  remarks: { type: String }
});

const NotificationSchema = new Schema<Notification & Document>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: String, required: true },
  read: { type: Boolean, required: true, default: false }
});

const TeamRegistrationSchema = new Schema<TeamRegistration & Document>({
  id: { type: String, required: true, unique: true },
  tournamentId: { type: String, required: true },
  captainUserId: { type: String, required: true },
  captainName: { type: String, required: true },
  captainFfUid: { type: String, required: true },
  captainFfName: { type: String, required: true },
  teammates: [{
    ffUid: { type: String, required: true },
    ffName: { type: String, required: true }
  }],
  registeredAt: { type: String, required: true }
});

const AppSettingsSchema = new Schema<AppSettings & Document>({
  logoUrl: { type: String, required: true },
  appName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  privacyPolicy: { type: String, required: true },
  termsConditions: { type: String, required: true },
  upiId: { type: String, default: "" },
  upiQrUrl: { type: String, default: "" },
  youtubeUrl: { type: String, default: "" },
  whatsappUrl: { type: String, default: "" }
});

// User Registrations mapping schema (tournamentId -> User IDs array)
const RegistrationSchema = new Schema({
  tournamentId: { type: String, required: true, unique: true },
  userIds: { type: [String], default: [] }
});

// Compile Models
export const UserModel = mongoose.model<User & Document>('User', UserSchema);
export const TournamentModel = mongoose.model<Tournament & Document>('Tournament', TournamentSchema);
export const MatchModel = mongoose.model<Match & Document>('Match', MatchSchema);
export const MatchResultModel = mongoose.model<MatchResult & Document>('MatchResult', MatchResultSchema);
export const TransactionModel = mongoose.model<Transaction & Document>('Transaction', TransactionSchema);
export const NotificationModel = mongoose.model<Notification & Document>('Notification', NotificationSchema);
export const TeamRegistrationModel = mongoose.model<TeamRegistration & Document>('TeamRegistration', TeamRegistrationSchema);
export const AppSettingsModel = mongoose.model<AppSettings & Document>('AppSettings', AppSettingsSchema);
export const RegistrationModel = mongoose.model('Registration', RegistrationSchema);

// Initial Database Seeding Helper
export async function seedDatabase() {
  try {
    // Check Settings
    let settings = await AppSettingsModel.findOne({});
    if (!settings) {
      settings = await AppSettingsModel.create({
        logoUrl: "/icon-512.png",
        appName: "FireX ERP",
        contactEmail: "ffnunty@gmail.com",
        privacyPolicy: "This privacy policy explains how FireX ERP processes and protects user data.",
        termsConditions: "By using the FireX ERP platform, users agree to follow professional competitive ethics.",
        upiId: "",
        upiQrUrl: "",
        youtubeUrl: "https://www.youtube.com/@fireX-Tournament",
        whatsappUrl: "https://chat.whatsapp.com/Cio3IxtVMl63LqHLpiWL37?s=cl&p=a&ilr=1&amv=1"
      });
      console.log("✅ Seeded default Application Settings");
    } else {
      let changed = false;
      if (settings.logoUrl.includes("unsplash.com")) {
        settings.logoUrl = "/icon-512.png";
        changed = true;
      }
      if (settings.contactEmail === "support@firex-erp.com") {
        settings.contactEmail = "ffnunty@gmail.com";
        changed = true;
      }
      if (!settings.youtubeUrl) {
        settings.youtubeUrl = "https://www.youtube.com/@fireX-Tournament";
        changed = true;
      }
      if (!settings.whatsappUrl) {
        settings.whatsappUrl = "https://chat.whatsapp.com/Cio3IxtVMl63LqHLpiWL37?s=cl&p=a&ilr=1&amv=1";
        changed = true;
      }

      if (changed) {
        await settings.save();
        console.log("✅ Automatically updated app settings with PWA links, youtube, and whatsapp defaults");
      }
    }

    // Check default Super Admin
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      await UserModel.create({
        id: "admin-1",
        name: "Tejas Super Admin",
        email: "tejas@gmail.com",
        passwordHash: "tejas4010",
        role: 'admin',
        isBanned: false,
        walletBalance: 100000
      });
      console.log("✅ Seeded default Super Admin user (tejas@gmail.com)");
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
