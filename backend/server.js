const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'premium_attendance_secret_key_123';

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:', {
  dialect: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
  storage: process.env.DATABASE_URL ? undefined : './database.sqlite',
  logging: false,
  dialectOptions: process.env.DATABASE_URL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// --- MODELS --- //
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'employee' },
  department: { type: DataTypes.STRING, defaultValue: 'General' },
  baseSalary: { type: DataTypes.FLOAT, defaultValue: 30000 }, // Monthly base salary
});

const Attendance = sequelize.define('Attendance', {
  date: { type: DataTypes.STRING },
  clockIn: { type: DataTypes.STRING },
  clockOut: { type: DataTypes.STRING }
});

const Leave = sequelize.define('Leave', {
  type: { type: DataTypes.STRING },
  startDate: { type: DataTypes.STRING },
  endDate: { type: DataTypes.STRING },
  reason: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
});

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'Assigned' },
  workLink: { type: DataTypes.STRING },
  feedback: { type: DataTypes.TEXT }
});

const Salary = sequelize.define('Salary', {
  month: { type: DataTypes.STRING }, // e.g. "2026-03"
  presentDays: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalWorkingDays: { type: DataTypes.INTEGER, defaultValue: 26 },
  baseSalary: { type: DataTypes.FLOAT, defaultValue: 30000 },
  deductions: { type: DataTypes.FLOAT, defaultValue: 0 },
  bonus: { type: DataTypes.FLOAT, defaultValue: 0 },
  netSalary: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, paid
  paidDate: { type: DataTypes.STRING },
});

const Project = sequelize.define('Project', {
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Active' }
});

// --- RELATIONSHIPS --- //
User.hasMany(Attendance, { foreignKey: 'userId', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Leave, { foreignKey: 'userId', onDelete: 'CASCADE' });
Leave.belongsTo(User, { foreignKey: 'userId' });

Task.belongsTo(User, { as: 'Intern', foreignKey: 'internId' });
Task.belongsTo(User, { as: 'Lead', foreignKey: 'teamLeadId' });
User.hasMany(Task, { as: 'InternTasks', foreignKey: 'internId' });
User.hasMany(Task, { as: 'LeadTasks', foreignKey: 'teamLeadId' });

User.hasMany(Salary, { foreignKey: 'userId', onDelete: 'CASCADE' });
Salary.belongsTo(User, { foreignKey: 'userId' });

// --- INITIALIZE DB --- //
const initDB = async () => {
  await sequelize.sync({ alter: true });

  const adminExists = await User.findOne({ where: { email: 'admin@attendance.com' } });
  
  if (!adminExists) {
    const usersToSeed = [
      { name: 'Admin User',    email: 'admin@attendance.com', password: 'admin123',  role: 'admin',     department: 'Management',      baseSalary: 80000 },
      { name: 'HR Manager',   email: 'hr@attendance.com',    password: 'hr123',    role: 'hr',        department: 'Human Resources', baseSalary: 60000 },
      { name: 'Team Lead',    email: 'lead@attendance.com',  password: 'lead123',  role: 'team_lead', department: 'Engineering',     baseSalary: 70000 },
      { name: 'Intern Student', email: 'intern@attendance.com', password: 'intern123', role: 'intern',  department: 'Engineering',     baseSalary: 15000 },
      { name: 'Regular Staff', email: 'john@attendance.com', password: 'user123',  role: 'employee',  department: 'Engineering',     baseSalary: 45000 },
    ];

    for (const u of usersToSeed) {
      const created = await User.create({ ...u, password: bcrypt.hashSync(u.password, 10) });
      // Seed salary for current month
      const month = new Date().toISOString().slice(0, 7);
      const presentDays = Math.floor(Math.random() * 10) + 15;
      const workingDays = 26;
      const netSalary = ((created.baseSalary / workingDays) * presentDays).toFixed(2);
      await Salary.create({
        userId: created.id, month, presentDays,
        totalWorkingDays: workingDays, baseSalary: created.baseSalary,
        deductions: 0, bonus: 0, netSalary: parseFloat(netSalary), status: 'pending'
      });
    }

    await Project.create({ name: 'Novahamotech Portal', status: 'Active' });
    console.log('✅ Default users seeded.');
  }

  console.log('✅ SQLite Database Connected & Synced.');
};
initDB();

// ---------------------------------------------------------------- //
// 2. API ENDPOINTS
// ---------------------------------------------------------------- //

// --- AUTHENTICATION --- //
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, baseSalary: user.baseSalary } });
});

// --- ATTENDANCE --- //
app.post('/api/attendance/check', async (req, res) => {
  const { userId, type } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString();
  let record = await Attendance.findOne({ where: { userId, date: today } });
  if (type === 'in') {
    if (record) return res.status(400).json({ message: 'Already clocked in today.' });
    record = await Attendance.create({ userId, date: today, clockIn: time });
  } else {
    if (!record) return res.status(400).json({ message: 'Not clocked in today.' });
    if (record.clockOut) return res.status(400).json({ message: 'Already clocked out.' });
    record.clockOut = time;
    await record.save();
  }
  res.json({ message: `Successfully clocked ${type}`, record });
});

app.get('/api/attendance/:userId', async (req, res) => {
  res.json(await Attendance.findAll({ where: { userId: req.params.userId } }));
});

// --- LEAVE MANAGEMENT --- //
app.post('/api/leaves/request', async (req, res) => {
  const leave = await Leave.create(req.body);
  res.json({ message: 'Leave request submitted.', leave });
});

app.get('/api/leaves/:userId', async (req, res) => {
  res.json(await Leave.findAll({ where: { userId: req.params.userId } }));
});

app.get('/api/admin/leaves', async (req, res) => {
  const leaves = await Leave.findAll({ include: [{ model: User, attributes: ['name'] }] });
  res.json(leaves);
});

app.put('/api/leaves/:id/status', async (req, res) => {
  const leave = await Leave.findByPk(req.params.id);
  if (!leave) return res.status(404).json({ message: 'Not found' });
  leave.status = req.body.status;
  await leave.save();
  res.json({ message: `Leave ${leave.status}`, leave });
});

// --- USER MANAGEMENT --- //
app.get('/api/users', async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const payload = { ...req.body, password: bcrypt.hashSync(req.body.password, 10) };
    const user = await User.create(payload);
    // Create salary record for current month
    const month = new Date().toISOString().slice(0, 7);
    await Salary.create({ userId: user.id, month, baseSalary: user.baseSalary || 30000, netSalary: user.baseSalary || 30000, status: 'pending' });
    res.json({ message: 'User added successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ message: 'User removed from system.' });
});

app.put('/api/users/:id/salary', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  user.baseSalary = req.body.baseSalary;
  await user.save();
  res.json({ message: 'Base salary updated.', user });
});

// --- TASKS --- //
app.post('/api/tasks', async (req, res) => {
  const task = await Task.create(req.body);
  res.json({ message: 'Task assigned successfully.', task });
});

app.get('/api/tasks', async (req, res) => {
  const { internId, teamLeadId } = req.query;
  const where = {};
  if (internId) where.internId = internId;
  if (teamLeadId) where.teamLeadId = teamLeadId;
  const tasks = await Task.findAll({
    where,
    include: [
      { model: User, as: 'Intern', attributes: ['name'] },
      { model: User, as: 'Lead', attributes: ['name'] }
    ]
  });
  res.json(tasks);
});

app.put('/api/tasks/:id', async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  if (req.body.status) task.status = req.body.status;
  if (req.body.workLink) task.workLink = req.body.workLink;
  if (req.body.feedback) task.feedback = req.body.feedback;
  await task.save();
  res.json({ message: 'Task updated.', task });
});

// --- SALARY MANAGEMENT --- //

// Get salary records for a user
app.get('/api/salary/:userId', async (req, res) => {
  const records = await Salary.findAll({
    where: { userId: req.params.userId },
    order: [['month', 'DESC']]
  });
  res.json(records);
});

// Get all salary records (Admin/HR)
app.get('/api/admin/salaries', async (req, res) => {
  const salaries = await Salary.findAll({
    include: [{ model: User, attributes: ['name', 'email', 'role', 'department', 'baseSalary'] }],
    order: [['month', 'DESC']]
  });
  res.json(salaries);
});

// Auto-calculate salary based on attendance for a month
app.post('/api/salary/calculate', async (req, res) => {
  try {
    const { month } = req.body; // "2026-03"
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    const results = [];

    for (const user of users) {
      // Count attendance days in that month
      const allAtt = await Attendance.findAll({ where: { userId: user.id } });
      const presentDays = allAtt.filter(a => a.date && a.date.startsWith(month)).length;
      const workingDays = 26;
      const perDay = user.baseSalary / workingDays;
      // Deduction for absent days
      const absentDays = workingDays - presentDays;
      const deductions = absentDays > 5 ? parseFloat((perDay * (absentDays - 5)).toFixed(2)) : 0;
      const netSalary = parseFloat((user.baseSalary - deductions).toFixed(2));

      // Upsert salary record
      let salaryRec = await Salary.findOne({ where: { userId: user.id, month } });
      if (salaryRec) {
        salaryRec.presentDays = presentDays;
        salaryRec.totalWorkingDays = workingDays;
        salaryRec.baseSalary = user.baseSalary;
        salaryRec.deductions = deductions;
        salaryRec.netSalary = netSalary;
        await salaryRec.save();
      } else {
        salaryRec = await Salary.create({ userId: user.id, month, presentDays, totalWorkingDays: workingDays, baseSalary: user.baseSalary, deductions, bonus: 0, netSalary, status: 'pending' });
      }
      results.push({ user: user.name, netSalary, presentDays });
    }
    res.json({ message: 'Salary calculated for all employees.', results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark salary as paid
app.put('/api/salary/:id/pay', async (req, res) => {
  const sal = await Salary.findByPk(req.params.id);
  if (!sal) return res.status(404).json({ message: 'Not found' });
  sal.status = 'paid';
  sal.paidDate = new Date().toISOString().split('T')[0];
  await sal.save();
  res.json({ message: 'Salary marked as paid.', sal });
});

// Update bonus/deduction
app.put('/api/salary/:id', async (req, res) => {
  const sal = await Salary.findByPk(req.params.id);
  if (!sal) return res.status(404).json({ message: 'Not found' });
  if (req.body.bonus !== undefined) sal.bonus = req.body.bonus;
  if (req.body.deductions !== undefined) sal.deductions = req.body.deductions;
  sal.netSalary = parseFloat((sal.baseSalary + (sal.bonus || 0) - (sal.deductions || 0)).toFixed(2));
  await sal.save();
  res.json({ message: 'Salary updated.', sal });
});

// --- ADMIN STATS --- //
app.get('/api/admin/stats', async (req, res) => {
  const totalUsers = await User.count();
  const today = new Date().toISOString().split('T')[0];
  const presentToday = await Attendance.count({ where: { date: today } });
  const pendingLeaves = await Leave.count({ where: { status: 'pending' } });
  const totalSalaryPending = await Salary.sum('netSalary', { where: { status: 'pending' } });
  const records = await Attendance.findAll({
    include: [{ model: User, attributes: ['name'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ totalUsers, presentToday, pendingLeaves, totalSalaryPending: totalSalaryPending || 0, records });
});

app.listen(PORT, () => {
  console.log(`🚀 Novahamotech Server running on http://localhost:${PORT}`);
});
