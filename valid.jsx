const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isValidHttpUrl } = require('../utils/validators');

// One piece of evidence (project, certificate or portfolio link) attached to an offered skill
const portfolioItemSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, 'Skill is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['project', 'certificate', 'portfolio'],
        message: 'Type must be project, certificate or portfolio',
      },
      default: 'project',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be 100 characters or fewer'],
    },
    url: {
      type: String,
      required: [true, 'A link is required'],
      trim: true,
      maxlength: [500, 'Link must be 500 characters or fewer'],
      validate: {
        validator: isValidHttpUrl,
        message: 'Enter a valid web address starting with http:// or https://',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description must be 500 characters or fewer'],
    },
    credential: {
      type: String,
      default: '',
      trim: true,
      maxlength: [150, 'Credential must be 150 characters or fewer'],
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
      minlength: 6,
      select: false, // never return password in queries by default
    },
    bio: {
      type: String,
      default: '',
    },
    credits: {
      type: Number,
      default: 5,
    },
    skillsOffered: {
      type: [String],
      default: [],
    },
    skillsWanted: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Work samples, certificates and portfolio links for the skills this user offers
    portfolio: {
      type: [portfolioItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Mongoose 9: no `next` callback, just an async function
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);