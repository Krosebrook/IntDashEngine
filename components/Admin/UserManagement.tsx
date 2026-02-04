
import React, { useState } from 'react';
import { User } from '../../types';

interface Props {
  currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([
    currentUser,
    { id: 'u2', name: 'Sarah Miller', email: 'sarah@int.com', role: 'editor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'u3', name: 'James Wilson', email: 'james@int.com', role: 'viewer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
    { id: 'u4', name: 'Elena Rodriguez', email: 'elena@int.com', role: 'viewer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  ]);

  const updateRole = (userId: string, newRole: User['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white">User Management</h3>
          <p className="text-slate-400 text-sm">Review and manage access levels for INT Inc employees.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors">
          Invite User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Current Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} className="w-8 h-8 rounded-full bg-slate-800" alt="" />
                    <div>
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' :
                    user.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <select 
                    value={user.role}
                    disabled={user.id === currentUser.id}
                    onChange={(e) => updateRole(user.id, e.target.value as User['role'])}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
