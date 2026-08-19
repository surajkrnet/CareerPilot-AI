'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Search,
  MessageSquare,
  FileText,
  ExternalLink,
  ChevronRight,
  Trash2,
  CheckCircle2,
  X,
  MapPin,
  IndianRupee,
  GripVertical,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer, ApplicationTrackerItem } from '@/lib/career-store';
import { createClient } from '@/lib/supabase/client';

function formatDisplaySalary(rawSalary?: string): string {
  if (!rawSalary) return '18L - 28L LPA';
  const cleaned = rawSalary
    .replace(/\$/g, '')
    .replace(/₹/g, '')
    .replace(/k\b/gi, 'L')
    .replace(/k(?=[^a-zA-Z]|$)/gi, 'L')
    .replace(/k/gi, 'L')
    .trim();

  return cleaned.includes('LPA') ? cleaned : `${cleaned} LPA`;
}

export default function TrackerPage() {
  const { applications, setApplications, setActiveInterviewCompany, setActiveInterviewRole } = useCareer();
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [activeTabFilter, setActiveTabFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [jobToDelete, setJobToDelete] = useState<ApplicationTrackerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag & Drop State
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // New Application Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('Bengaluru / Remote');
  const [newSalary, setNewSalary] = useState('₹18L - ₹28L LPA');
  const [newStatus, setNewStatus] = useState<ApplicationTrackerItem['status']>('applied');
  const [addErrorMsg, setAddErrorMsg] = useState<string | null>(null);

  // Load saved applications from Supabase on mount
  useEffect(() => {
    async function loadUserApplications() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: dbApps, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (dbApps && dbApps.length > 0) {
          const mapped: ApplicationTrackerItem[] = dbApps.map((a: any) => ({
            id: a.id,
            company: a.company_name || a.company || 'Tech Company',
            role: a.job_title || a.role || 'Software Engineer',
            location: a.location || 'Bengaluru / Hybrid',
            salary: a.salary || '₹18L - ₹32L LPA',
            matchScore: typeof a.match_score === 'number' ? a.match_score : 90,
            appliedDate: a.applied_date ? new Date(a.applied_date).toLocaleDateString() : 'Recent',
            status: (['saved', 'applied', 'interviewing', 'offered', 'rejected'].includes(a.status?.toLowerCase())
              ? a.status.toLowerCase()
              : 'applied') as ApplicationTrackerItem['status'],
            jdText: a.notes || '',
          }));

          // Merge with default initial applications without duplicate IDs
          setApplications((prev) => {
            const dbIds = new Set(mapped.map((m) => m.id));
            const remaining = prev.filter((p) => !dbIds.has(p.id));
            return [...mapped, ...remaining];
          });
        }
      } catch (err) {
        console.error('Tracker load applications error:', err);
      }
    }

    loadUserApplications();
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTabFilter === 'all' || app.status === activeTabFilter;
    return matchesSearch && matchesTab;
  });

  const columns: Array<{ id: ApplicationTrackerItem['status']; label: string; badgeVariant: 'cream' | 'coral' | 'teal' | 'amber' | 'success' }> = [
    { id: 'saved', label: 'Saved Roles', badgeVariant: 'cream' },
    { id: 'applied', label: 'Applied', badgeVariant: 'teal' },
    { id: 'interviewing', label: 'Interviewing', badgeVariant: 'coral' },
    { id: 'offered', label: 'Offered', badgeVariant: 'success' },
    { id: 'rejected', label: 'Rejected', badgeVariant: 'amber' },
  ];

  const handleStatusChange = async (appId: string, nextStatus: ApplicationTrackerItem['status']) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
    );

    const changedApp = applications.find((a) => a.id === appId);
    if (changedApp) {
      setToastMsg(`✓ Moved "${changedApp.company}" to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setToastMsg(null), 3000);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('applications')
          .update({ status: nextStatus })
          .eq('id', appId)
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('Status update note:', e);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, colId: ApplicationTrackerItem['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (id) {
      handleStatusChange(id, colId);
    }
    setDraggedAppId(null);
    setDragOverCol(null);
  };

  const handleAddApplication = async () => {
    if (!newCompany.trim() || !newRole.trim()) {
      setAddErrorMsg('Please fill in both Company Name and Target Role.');
      return;
    }
    setAddErrorMsg(null);

    const newId = `app-${Date.now()}`;
    const newApp: ApplicationTrackerItem = {
      id: newId,
      company: newCompany.trim(),
      role: newRole.trim(),
      location: newLocation.trim() || 'Bengaluru / Remote',
      salary: newSalary.trim() || '₹18L - ₹28L LPA',
      matchScore: Math.floor(Math.random() * 10) + 88,
      appliedDate: new Date().toISOString().split('T')[0],
      status: newStatus,
      jdText: `${newCompany} - ${newRole} requirements...`,
    };

    setApplications((prev) => [newApp, ...prev]);
    setIsAddModalOpen(false);
    setNewCompany('');
    setNewRole('');
    setToastMsg(`✓ "${newApp.role}" at ${newApp.company} added to tracker!`);
    setTimeout(() => setToastMsg(null), 3000);

    // Save to Supabase if authenticated
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('applications').insert({
          user_id: user.id,
          company_name: newApp.company,
          job_title: newApp.role,
          status: newApp.status,
          match_score: newApp.matchScore,
          applied_date: new Date().toISOString(),
          notes: newApp.jdText,
        });
      }
    } catch (e) {
      console.warn('Supabase application insert note:', e);
    }
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);

    const deletedRole = jobToDelete.role;
    const deletedCompany = jobToDelete.company;
    const deletedId = jobToDelete.id;

    // Remove from local UI state
    setApplications((prev) => prev.filter((a) => a.id !== deletedId));

    // Delete from Supabase if authenticated
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('applications')
          .delete()
          .eq('id', deletedId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Supabase delete error note:', err);
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
      setToastMsg(`🗑️ Deleted "${deletedRole}" at ${deletedCompany} from pipeline.`);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-28 pb-20 space-y-8 text-[#121110] dark:text-[#faf9f5] transition-colors duration-200">
      
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 p-4 rounded-xl bg-[#cc785c] text-white text-xs font-mono font-bold shadow-2xl flex items-center gap-3 coral-glow"
          >
            <Sparkles className="w-4 h-4" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ded7cb] dark:border-white/[0.08] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#cc785c] font-bold flex items-center gap-1.5 font-mono mb-1.5">
            <Briefcase className="w-3.5 h-3.5" /> Autonomous Opportunity Pipeline
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5]">
            Application Pipeline &amp; Kanban
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#a09d96] mt-1 font-medium">
            Drag and drop applications across hiring stages, manage compensation packages, delete archived roles, and launch instant AI mock interview drills.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Toggle View Mode */}
          <div className="bg-[#ded7cb]/60 dark:bg-[#201e1c] p-1 rounded-xl border border-[#ded7cb] dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#cc785c] text-white font-bold shadow-sm' : 'text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-[#faf9f5] font-medium'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#cc785c] text-white font-bold shadow-sm' : 'text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-[#faf9f5] font-medium'
              }`}
            >
              Tabbed Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddErrorMsg(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Role</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
          {['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected'].map((tab) => {
            const count = tab === 'all' ? applications.length : applications.filter((a) => a.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTabFilter(tab)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-mono font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                  activeTabFilter === tab
                    ? 'bg-[#cc785c] text-white font-bold shadow-md'
                    : 'bg-[#ffffff] dark:bg-[#181716] text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-[#faf9f5] border border-[#ded7cb] dark:border-white/10'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#57534e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/10 rounded-xl focus:outline-none focus:border-[#cc785c] text-[#121110] dark:text-[#faf9f5] font-mono shadow-sm placeholder-[#57534e] font-medium"
          />
        </div>

      </div>

      {/* VIEW MODE 1: KANBAN BOARD (DRAG AND DROP) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
          {columns.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragOverCol(col.id)}
                onDragLeave={() => setDragOverCol((curr) => (curr === col.id ? null : curr))}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-4 rounded-2xl border transition-all min-h-[160px] sm:min-h-[540px] flex flex-col justify-between ${
                  isOver
                    ? 'bg-[#ede8df] dark:bg-[#201e1c] border-[#cc785c] ring-2 ring-[#cc785c]/50 shadow-2xl scale-[1.01]'
                    : 'bg-[#f0ebe1] dark:bg-[#181716] border-[#ded7cb] dark:border-white/[0.08] shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#ded7cb] dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-[#121110] dark:text-[#faf9f5]">{col.label}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={col.badgeVariant} size="sm">{colApps.length}</Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setNewStatus(col.id);
                          setAddErrorMsg(null);
                          setIsAddModalOpen(true);
                        }}
                        className="w-6 h-6 rounded-lg bg-[#ded7cb]/50 dark:bg-white/10 hover:bg-[#cc785c] hover:text-white flex items-center justify-center text-[#57534e] dark:text-[#a09d96] transition-colors cursor-pointer"
                        title={`Add role directly to ${col.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3">
                    {colApps.map((app) => (
                      <motion.div
                        key={app.id}
                        layout
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e as any, app.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-[#ffffff] dark:bg-[#201e1c] p-4 sm:p-5 rounded-2xl border border-[#ded7cb] dark:border-white/10 space-y-3.5 hover:border-[#cc785c]/60 transition-all shadow-md cursor-grab active:cursor-grabbing group relative ${
                          draggedAppId === app.id ? 'opacity-40 border-dashed border-[#cc785c]' : ''
                        }`}
                      >
                        {/* Top: Header Info & Delete Button */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-[#57534e] group-hover:text-[#cc785c] transition-colors shrink-0" />
                              <h4 className="font-display font-bold text-sm sm:text-base text-[#121110] dark:text-[#faf9f5] truncate">
                                {app.company}
                              </h4>
                            </div>
                            <p className="text-xs text-[#57534e] dark:text-[#a09d96] font-medium mt-0.5 truncate pl-5">
                              {app.role}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#2e8544]/15 text-[#2e8544] dark:text-[#5db872] border border-[#2e8544]/30 h-6">
                              {app.matchScore}%
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setJobToDelete(app);
                              }}
                              className="w-6 h-6 flex items-center justify-center text-[#57534e] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all cursor-pointer active:scale-95"
                              title="Delete application from pipeline"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Location and Salary in Rupees (₹) */}
                        <div className="text-[11px] text-[#57534e] space-y-1 font-mono pt-1.5 border-t border-[#ded7cb] dark:border-white/5">
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            <MapPin className="w-3 h-3 text-[#cc785c] shrink-0" /> {app.location}
                          </div>
                          <div className="flex items-center gap-1.5 text-[#2e8544] dark:text-[#5db872] font-bold">
                            <IndianRupee className="w-3 h-3 shrink-0" /> {formatDisplaySalary(app.salary)}
                          </div>
                        </div>

                        {/* REDESIGNED PROMINENT MOCK INTERVIEW BUTTON */}
                        <div className="pt-2 border-t border-[#ded7cb] dark:border-white/10 space-y-2">
                          <Link
                            href="/interview"
                            onClick={() => {
                              setActiveInterviewCompany(app.company);
                              setActiveInterviewRole(app.role);
                            }}
                            className="block"
                          >
                            <button
                              type="button"
                              className="w-full py-2.5 px-3 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Start AI Interview Drill</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </Link>

                          {/* Quick stage selector */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#57534e] pt-1">
                            <span className="font-semibold">Move stage:</span>
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationTrackerItem['status'])}
                              className="text-[10px] bg-[#f6f4ee] dark:bg-[#181716] text-[#121110] dark:text-[#faf9f5] px-2 py-1 rounded-lg border border-[#ded7cb] dark:border-white/10 focus:outline-none cursor-pointer font-medium"
                            >
                              <option value="saved">Saved</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {colApps.length === 0 && (
                      <div
                        className={`p-6 text-center text-xs font-mono text-[#57534e] italic border border-dashed rounded-xl transition-all ${
                          isOver ? 'border-[#cc785c] text-[#cc785c] bg-[#ffffff] dark:bg-[#201e1c]' : 'border-[#ded7cb] dark:border-white/10'
                        }`}
                      >
                        {isOver ? 'Drop application here' : `No applications in ${col.label}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 text-center">
                  <span className="text-[10px] font-mono text-[#57534e] opacity-75 font-medium">
                    Drop zone: {col.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABBED TABLE */}
      {viewMode === 'table' && (
        <Card variant="dark-elevated" className="p-0 overflow-hidden bg-[#ffffff] dark:bg-[#1f1e1b] border-[#ded7cb] dark:border-white/10 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0ebe1] dark:bg-[#252320] border-b border-[#ded7cb] dark:border-white/10 text-xs font-bold text-[#121110] dark:text-[#faf9f5] uppercase tracking-wider font-mono">
                  <th className="p-4">Company &amp; Role</th>
                  <th className="p-4">Location &amp; Package (INR)</th>
                  <th className="p-4">ATS Match</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded7cb] dark:divide-white/10 text-xs font-medium">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f6f4ee] dark:hover:bg-[#181715] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[#121110] dark:text-[#faf9f5] text-sm">{app.company}</div>
                      <div className="text-[#57534e] dark:text-[#8e8b82]">{app.role}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[#2d2a26] dark:text-[#a09d96]">{app.location}</div>
                      <div className="text-[11px] text-[#2e8544] dark:text-[#5db872] font-mono font-bold flex items-center gap-1 mt-0.5">
                        <IndianRupee className="w-3 h-3" />
                        <span>{formatDisplaySalary(app.salary)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="teal" size="sm">{app.matchScore}% Match</Badge>
                    </td>
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationTrackerItem['status'])}
                        className="text-xs bg-[#f6f4ee] dark:bg-[#252320] text-[#121110] dark:text-[#faf9f5] px-2 py-1 rounded border border-[#ded7cb] dark:border-white/10 cursor-pointer font-medium"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="p-4 text-[#57534e] font-mono">{app.appliedDate}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/interview"
                          onClick={() => {
                            setActiveInterviewCompany(app.company);
                            setActiveInterviewRole(app.role);
                          }}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1.5 h-8 bg-[#cc785c] hover:bg-[#a9583e] font-mono uppercase text-white font-bold"
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                          >
                            AI Drill ↗
                          </Button>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setJobToDelete(app)}
                          className="p-1.5 text-[#57534e] hover:text-red-600 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          title="Delete application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ADD APPLICATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#ffffff] dark:bg-[#1f1e1b] border border-[#ded7cb] dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl text-[#121110] dark:text-[#faf9f5]"
          >
            <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-3">
              <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">Add Target Application</h3>
              <button
                type="button"
                onClick={() => {
                  setAddErrorMsg(null);
                  setIsAddModalOpen(false);
                }}
                className="text-[#57534e] hover:text-[#121110] dark:hover:text-[#faf9f5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-mono font-bold">
                {addErrorMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#121110] dark:text-[#faf9f5] mb-1 font-mono uppercase text-[11px]">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy, Razorpay, Linear, Stripe"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f4ee] dark:bg-[#252320]/60 border border-[#ded7cb] dark:border-white/10 rounded-xl text-xs text-[#121110] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#121110] dark:text-[#faf9f5] mb-1 font-mono uppercase text-[11px]">Target Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Software Developer, Backend Engineer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f4ee] dark:bg-[#252320]/60 border border-[#ded7cb] dark:border-white/10 rounded-xl text-xs text-[#121110] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#121110] dark:text-[#faf9f5] mb-1 font-mono uppercase text-[11px]">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Bengaluru / Remote"
                    className="w-full p-2.5 bg-[#f6f4ee] dark:bg-[#252320]/60 border border-[#ded7cb] dark:border-white/10 rounded-xl text-xs text-[#121110] dark:text-[#faf9f5] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#121110] dark:text-[#faf9f5] mb-1 font-mono uppercase text-[11px]">Package (INR LPA)</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="₹18L - ₹28L LPA"
                    className="w-full p-2.5 bg-[#f6f4ee] dark:bg-[#252320]/60 border border-[#ded7cb] dark:border-white/10 rounded-xl text-xs text-[#121110] dark:text-[#faf9f5] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#121110] dark:text-[#faf9f5] mb-1 font-mono uppercase text-[11px]">Initial Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationTrackerItem['status'])}
                  className="w-full p-2.5 bg-[#f6f4ee] dark:bg-[#252320]/60 border border-[#ded7cb] dark:border-white/10 rounded-xl text-xs text-[#121110] dark:text-[#faf9f5] font-medium"
                >
                  <option value="saved">Saved Role</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ded7cb] dark:border-white/10">
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddApplication} className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-bold">
                Save to Pipeline
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#ffffff] dark:bg-[#1f1e1b] border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl text-[#121110] dark:text-[#faf9f5]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#121110] dark:text-[#faf9f5]">Delete Application?</h3>
                <p className="text-xs text-[#57534e] dark:text-[#8e8b82]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/5 text-xs text-[#2d2a26] dark:text-[#dcd7cb] font-mono">
              <p className="font-bold text-[#121110] dark:text-[#faf9f5]">{jobToDelete.company}</p>
              <p className="text-[#57534e] dark:text-[#a09d96]">{jobToDelete.role}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setJobToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDeleteJob}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Role'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
