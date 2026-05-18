const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId:    { type: String, unique: true, sparse: true, trim: true },
  firstName:     { type: String, required: true, trim: true },
  lastName:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile:        { type: String, default: '', trim: true },
  password:      { type: String, required: true, minlength: 6 },
  role:          { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  managerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  departmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  designation:   { type: String, default: '' },
  profilePhoto:  { type: String, default: '' },
  isActive:      { type: Boolean, default: true },
  // Account approval workflow
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'deactivated'],
    default: 'active',
  },
  lastLogin:     { type: Date, default: null },
  avatarUrl:     { type: String, default: '' },
  // Email verification
  isEmailVerified:       { type: Boolean, default: false },
  emailVerifyToken:      { type: String, default: null },
  emailVerifyExpires:    { type: Date, default: null },
  // Password reset
  passwordResetToken:    { type: String, default: null },
  passwordResetExpires:  { type: Date, default: null },
  // Remember me
  rememberMeToken:       { type: String, default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  delete obj.rememberMeToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
