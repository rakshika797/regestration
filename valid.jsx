const mongoose = require('mongoose');
const User = require('../models/User');
const Swap = require('../models/Swap');
const { isValidHttpUrl, escapeRegex } = require('../utils/validators');

const MAX_PORTFOLIO_ITEMS = 20; // per user
const MAX_ITEMS_PER_SKILL = 5;

const sameSkill = (a, b) =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

const handleError = (error, res) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }
  return res.status(500).json({ message: 'Server error', error: error.message });
};

// @route   GET /api/users/profile
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    handleError(error, res);
  }
};

// @route   PUT /api/users/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, skillsOffered, skillsWanted, location, profilePicture } = req.body;

    if (skillsOffered !== undefined && !Array.isArray(skillsOffered)) {
      return res.status(400).json({ message: 'skillsOffered must be a list' });
    }
    if (skillsWanted !== undefined && !Array.isArray(skillsWanted)) {
      return res.status(400).json({ message: 'skillsWanted must be a list' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skillsOffered !== undefined) user.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) user.skillsWanted = skillsWanted;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // If a skill was removed from the profile, remove its portfolio evidence too
    if (skillsOffered !== undefined) {
      const orphaned = user.portfolio.filter(
        (item) => !user.skillsOffered.some((s) => sameSkill(s, item.skill))
      );
      orphaned.forEach((item) => user.portfolio.pull(item._id));
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      credits: updatedUser.credits,
      skillsOffered: updatedUser.skillsOffered,
      skillsWanted: updatedUser.skillsWanted,
      location: updatedUser.location,
      profilePicture: updatedUser.profilePicture,
      portfolio: updatedUser.portfolio,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   GET /api/users/search?skill=&location=
// @access  Private
// Profiles with portfolio evidence for the searched skill are shown first.
const searchUsers = async (req, res) => {
  try {
    const { skill, location } = req.query;

    if (!skill || typeof skill !== 'string' || !skill.trim()) {
      return res.status(400).json({ message: 'Please provide a skill to search for' });
    }

    const skillPattern = escapeRegex(skill.trim());

    const match = {
      skillsOffered: { $regex: skillPattern, $options: 'i' },
      isActive: true,
      _id: { $ne: req.user._id }, // exclude the searching user
    };

    if (typeof location === 'string' && location.trim()) {
      match.location = { $regex: escapeRegex(location.trim()), $options: 'i' };
    }

    const users = await User.aggregate([
      { $match: match },
      {
        $addFields: {
          // all work samples this user has added
          portfolioCount: { $size: { $ifNull: ['$portfolio', []] } },
          // work samples for the skill that was searched
          matchedPortfolioCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$portfolio', []] },
                as: 'item',
                cond: {
                  $regexMatch: {
                    input: '$$item.skill',
                    regex: skillPattern,
                    options: 'i',
                  },
                },
              },
            },
          },
          // which of the user's skills have evidence (used for badges on the card)
          showcasedSkills: {
            $setUnion: [
              {
                $map: {
                  input: { $ifNull: ['$portfolio', []] },
                  as: 'item',
                  in: '$$item.skill',
                },
              },
            ],
          },
        },
      },
      // Evidence for the searched skill first, then most evidence overall, then newest
      { $sort: { matchedPortfolioCount: -1, portfolioCount: -1, createdAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          bio: 1,
          skillsOffered: 1,
          skillsWanted: 1,
          location: 1,
          profilePicture: 1,
          credits: 1,
          portfolioCount: 1,
          matchedPortfolioCount: 1,
          showcasedSkills: 1,
        },
      },
    ]);

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   GET /api/users/credits
// @access  Private
const getMyCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name credits');

    const completedSwaps = await Swap.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'completed',
    })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .select('sender receiver skillOffered skillWanted status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10);

    const history = completedSwaps.map((swap) => {
      const isSender = swap.sender._id.toString() === req.user._id.toString();
      return {
        type: isSender ? 'earned' : 'spent',
        amount: isSender ? 1 : -1,
        skill: isSender ? swap.skillOffered : swap.skillWanted,
        with: isSender ? swap.receiver.name : swap.sender.name,
        date: swap.updatedAt,
      };
    });

    res.status(200).json({ credits: user.credits, history });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   POST /api/users/portfolio
// @access  Private
const addPortfolioItem = async (req, res) => {
  try {
    const { skill, type, title, url, description, credential } = req.body;

    if (!skill || !title || !url) {
      return res.status(400).json({ message: 'Skill, title and link are required' });
    }

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        message: 'Enter a valid web address starting with http:// or https://',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Evidence can only be attached to a skill the user actually offers
    const ownedSkill = user.skillsOffered.find((s) => sameSkill(s, skill));
    if (!ownedSkill) {
      return res.status(400).json({
        message: 'Add this skill to "Skills you offer" and save your profile first',
      });
    }

    if (user.portfolio.length >= MAX_PORTFOLIO_ITEMS) {
      return res.status(400).json({
        message: `You can add up to ${MAX_PORTFOLIO_ITEMS} work samples. Remove one to add another.`,
      });
    }

    const countForSkill = user.portfolio.filter((p) => sameSkill(p.skill, ownedSkill)).length;
    if (countForSkill >= MAX_ITEMS_PER_SKILL) {
      return res.status(400).json({
        message: `You can add up to ${MAX_ITEMS_PER_SKILL} work samples per skill.`,
      });
    }

    user.portfolio.push({
      skill: ownedSkill,
      type,
      title,
      url: url.trim(),
      description,
      credential,
    });

    await user.save();

    res.status(201).json({ message: 'Work sample added', portfolio: user.portfolio });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   PUT /api/users/portfolio/:itemId
// @access  Private
const updatePortfolioItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.itemId)) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const item = user.portfolio.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    const { type, title, url, description, credential } = req.body;

    if (url !== undefined) {
      if (!isValidHttpUrl(url)) {
        return res.status(400).json({
          message: 'Enter a valid web address starting with http:// or https://',
        });
      }
      item.url = url.trim();
    }
    if (type !== undefined) item.type = type;
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (credential !== undefined) item.credential = credential;

    await user.save();

    res.status(200).json({ message: 'Work sample updated', portfolio: user.portfolio });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   DELETE /api/users/portfolio/:itemId
// @access  Private
const deletePortfolioItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.itemId)) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const item = user.portfolio.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    user.portfolio.pull(item._id);
    await user.save();

    res.status(200).json({ message: 'Work sample removed', portfolio: user.portfolio });
  } catch (error) {
    handleError(error, res);
  }
};

// @route   GET /api/users/:id   (public profile, includes portfolio)
// @access  Private
const getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    // email is hidden on public profiles
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  searchUsers,
  getMyCredits,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getUserById,
};