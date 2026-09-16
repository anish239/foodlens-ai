import fs from 'fs';
import path from 'path';

// File-backed fallback user store for resilience across restarts
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const memoryUsersById = new Map();
const memoryUsersByEmail = new Map();

const loadUsersFromDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      if (raw.trim()) {
        const usersArray = JSON.parse(raw);
        if (Array.isArray(usersArray)) {
          memoryUsersById.clear();
          memoryUsersByEmail.clear();
          for (const u of usersArray) {
            if (u && u._id && u.email) {
              const idStr = String(u._id);
              const normalizedEmail = String(u.email).trim().toLowerCase();
              const userObj = { ...u, _id: idStr, email: normalizedEmail };
              memoryUsersById.set(idStr, userObj);
              memoryUsersByEmail.set(normalizedEmail, userObj);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not load users from persistent store:', err.message);
  }
};

const persistUsersToDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const allUsers = Array.from(memoryUsersById.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(allUsers, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ Could not persist users to disk store:', err.message);
  }
};

// Initialize from disk immediately
loadUsersFromDisk();

export const findMemoryUserByEmail = (email) => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (!memoryUsersByEmail.has(normalized)) {
    loadUsersFromDisk();
  }
  return memoryUsersByEmail.get(normalized) || null;
};

export const findMemoryUserById = (id) => {
  if (!id) return null;
  const idStr = String(id);
  if (!memoryUsersById.has(idStr)) {
    loadUsersFromDisk();
  }
  return memoryUsersById.get(idStr) || null;
};

export const saveMemoryUser = (user) => {
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const idStr = String(user._id);

  const storedUser = {
    ...user,
    _id: idStr,
    email: normalizedEmail,
  };

  memoryUsersById.set(idStr, storedUser);
  memoryUsersByEmail.set(normalizedEmail, storedUser);
  persistUsersToDisk();
  return storedUser;
};

export const updateMemoryUser = (id, updates) => {
  const existing = findMemoryUserById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  if (updates.preferences) {
    updated.preferences = {
      ...existing.preferences,
      ...updates.preferences,
    };
  }

  memoryUsersById.set(String(id), updated);
  if (updated.email) {
    memoryUsersByEmail.set(updated.email.trim().toLowerCase(), updated);
  }
  persistUsersToDisk();
  return updated;
};

export const syncMemoryUsersToMongo = async (mongooseInstance) => {
  const mongoose = mongooseInstance || (await import('mongoose')).default;
  if (mongoose.connection?.readyState !== 1) return;
  try {
    const allUsers = Array.from(memoryUsersById.values());
    const collection = mongoose.connection.db.collection('users');
    for (const u of allUsers) {
      if (!u.email) continue;
      const existing = await collection.findOne({ email: u.email });
      if (!existing) {
        let objectId;
        try {
          objectId = new mongoose.Types.ObjectId(String(u._id));
        } catch {
          objectId = new mongoose.Types.ObjectId();
        }
        await collection.insertOne({
          _id: objectId,
          name: u.name,
          email: u.email,
          password: u.password,
          profileImage: u.profileImage || null,
          preferences: u.preferences || {
            diet: null,
            healthGoals: [],
            allergies: [],
            restrictions: [],
          },
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not sync memory users to MongoDB:', err.message);
  }
};


