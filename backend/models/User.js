//models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ['inspector', 'dealer', 'insurance', 'admin', 'user'],
        message: 'Role must be inspector, dealer, insurance, admin or user',
      },
      required: [true, 'Role is required'],
    },

    // Partner accounts require admin approval before access is granted.
    // Admin accounts are approved by default.
    partnerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    organization: {
      type: String,
      trim: true,
      maxlength: [150, 'Organization name cannot exceed 150 characters'],
    },

    phone: {
      type: String,
      trim: true,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Auto-approve admin and user accounts
userSchema.pre('save', function (next) {
  if ((this.role === 'admin' || this.role === 'user') && this.isNew) {
    this.partnerStatus = 'approved';
  }
  next();
});

// Instance method: compare plain password against stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Instance method: safe public representation (no password, no internal fields)
  userSchema.methods.toPublicJSON = function () {
    return {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      partnerStatus: this.partnerStatus,
      organization: this.organization,
      createdAt: this.createdAt,
      tokenVersion: this.tokenVersion,
    };
  };

module.exports = mongoose.model('User', userSchema);
