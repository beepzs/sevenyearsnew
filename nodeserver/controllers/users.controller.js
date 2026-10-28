import { prisma } from '../db.js';

export const getUsersAndRoles = async (req, res) => {
  try {
    const [users, rolesList] = await Promise.all([
      prisma.user.findMany(),
      prisma.role.findMany(),
    ]);

    const rolesObj = {};
    rolesList.forEach((r) => {
      rolesObj[r.key] = { name: r.name, desc: r.desc, permissions: r.permissions };
    });

    res.json({ success: true, users, roles: rolesObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
