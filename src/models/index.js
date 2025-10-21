const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || 'sqlite:./database.sqlite';
const sequelize = new Sequelize(databaseUrl, {
  logging: false
});

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  role: { type: DataTypes.ENUM('worker','employer','admin'), defaultValue: 'worker' },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING },
  passwordHash: { type: DataTypes.STRING },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationStatus: { type: DataTypes.ENUM('none','pending','verified','failed'), defaultValue: 'none' },
  subscriptionActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  subscriptionExpiresAt: { type: DataTypes.DATE, allowNull: true },
  statsApplied: { type: DataTypes.INTEGER, defaultValue: 0 },
  statsAccepted: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {});

const Job = sequelize.define('Job', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employerId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  positionsAvailable: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.ENUM('open','filled','closed'), defaultValue: 'open' }
}, {});

const Application = sequelize.define('Application', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  coverLetter: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('applied','accepted','rejected','withdrawn'), defaultValue: 'applied' }
}, {});

const Verification = sequelize.define('Verification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  idType: { type: DataTypes.ENUM('NIN','DRIVER_LICENSE','PASSPORT') },
  idNumberEncrypted: { type: DataTypes.STRING }, // store encrypted or hashed
  documentUrl: { type: DataTypes.STRING },
  selfieUrl: { type: DataTypes.STRING },
  result: { type: DataTypes.ENUM('pending','verified','failed'), defaultValue: 'pending' },
  providerResponse: { type: DataTypes.JSON }
}, {});

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  plan: { type: DataTypes.ENUM('1m','6m','12m') },
  amount: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('pending','active','cancelled','expired'), defaultValue: 'pending' },
  startedAt: { type: DataTypes.DATE },
  expiresAt: { type: DataTypes.DATE }
}, {});

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  amount: { type: DataTypes.INTEGER },
  gateway: { type: DataTypes.STRING },
  reference: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending','success','failed') }
}, {});

const Rating = sequelize.define('Rating', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employerId: { type: DataTypes.UUID },
  workerId: { type: DataTypes.UUID },
  rating: { type: DataTypes.INTEGER },
  review: { type: DataTypes.TEXT }
}, {});

const Ad = sequelize.define('Ad', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ownerId: { type: DataTypes.UUID },
  title: { type: DataTypes.STRING },
  tier: { type: DataTypes.ENUM('bronze','silver','gold') },
  startAt: { type: DataTypes.DATE },
  endAt: { type: DataTypes.DATE }
}, {});

// Associations
User.hasMany(Job, { foreignKey: 'employerId', sourceKey: 'id' });
Job.belongsTo(User, { foreignKey: 'employerId', targetKey: 'id' });

User.hasMany(Application, { foreignKey: 'userId', sourceKey: 'id' });
Application.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

Job.hasMany(Application, { foreignKey: 'jobId', sourceKey: 'id' });
Application.belongsTo(Job, { foreignKey: 'jobId', targetKey: 'id' });

User.hasMany(Verification, { foreignKey: 'userId' });
Verification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Job,
  Application,
  Verification,
  Subscription,
  Transaction,
  Rating,
  Ad,
  initModels: async () => {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // for dev; change to migrations for production
    console.log('DB initialized');
  }
};

