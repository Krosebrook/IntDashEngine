
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

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' as const });
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const updateRole = (userId: string, newRole: User['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('sending');
    
    // Simulate API delay
    setTimeout(() => {
        const newUser: User = {
            id: `u${Date.now()}`,
            name: inviteForm.email.split('@')[0], // Placeholder name
            email: inviteForm.email,
            role: inviteForm.role,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${inviteForm.email}`
        };
        setUsers(prev => [...prev, newUser]);
        setInviteStatus('success');
        
        setTimeout(() => {
            setIsInviteOpen(false);
            setInviteStatus('idle');
            setInviteForm({ email: '', role: 'viewer' });
        }, 1500);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-white">User Management</h3>
          <p className="text-slate-400 text-sm">Review and manage access levels for INT Inc employees.</p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors focus:ring-2 focus:ring-blue-400 outline-none"
        >
          Invite User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse" aria-label="User list">
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
                    <img src={user.avatar} className="w-8 h-8 rounded-full bg-slate-800" alt="" aria-hidden="true" />
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
                  <label htmlFor={`role-select-${user.id}`} className="sr-only">Change role for {user.name}</label>
                  <select 
                    id={`role-select-${user.id}`}
                    value={user.role}
                    disabled={user.id === currentUser.id}
                    onChange={(e) => updateRole(user.id, e.target.value as User['role'])}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="invite-title">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 id="invite-title" className="text-lg font-bold text-white">Invite New User</h3>
                  <button onClick={() => setIsInviteOpen(false)} className="text-slate-500 hover:text-white" aria-label="Close modal">✕</button>
              </div>
              
              {inviteStatus === 'success' ? (
                  <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                      <h4 className="text-white font-bold mb-2">Invitation Sent!</h4>
                      <p className="text-sm text-slate-400">An email has been sent to {inviteForm.email}.</p>
                  </div>
              ) : (
                  <form onSubmit={handleInvite} className="p-6 space-y-4">
                      <div>
                          <label htmlFor="invite-email" className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                          <input 
                              id="invite-email"
                              type="email" 
                              required
                              value={inviteForm.email}
                              onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="colleague@int.com"
                          />
                      </div>
                      <div>
                          <label htmlFor="invite-role" className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                          <select 
                              id="invite-role"
                              value={inviteForm.role}
                              onChange={e => setInviteForm({...inviteForm, role: e.target.value as User['role']})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                              <option value="viewer">Viewer (Read Only)</option>
                              <option value="editor">Editor (Can edit KPIs)</option>
                              <option value="admin">Admin (Full Access)</option>
                          </select>
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-3">
                          <button type="button" onClick={() => setIsInviteOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
                          <button 
                             type="submit" 
                             disabled={inviteStatus === 'sending'}
                             className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                          >
                             {inviteStatus === 'sending' ? 'Sending...' : 'Send Invitation'}
                          </button>
                      </div>
                  </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
