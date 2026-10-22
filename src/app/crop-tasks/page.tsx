'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  X,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Tractor,
  DollarSign,
  Briefcase,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';

interface CropTask {
  _id: string;
  farmerId: { _id: string; name: string; farmerCode: string };
  farmId: { _id: string; parcelName: string; surveyNumber: string };
  planId?: { _id: string; cropName: string; varietyName: string };
  taskTitle: string;
  taskCategory: string;
  scheduledDate: string;
  assignedLaborCount: number;
  estimatedLaborCostInr: number;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

interface FarmOption {
  _id: string;
  parcelName: string;
  farmerId: { _id: string; name: string };
}

const TASK_PRESETS = [
  {
    title: 'Rotavator Tillage & Basal Compost Incorporation',
    category: 'land_prep',
    labor: 2,
    cost: 1200,
    priority: 'high',
  },
  {
    title: 'Cono-Weeder Intercultural Soil Aeration',
    category: 'weeding',
    labor: 3,
    cost: 1350,
    priority: 'medium',
  },
  {
    title: 'Second Split Urea & Potash Top Dressing',
    category: 'fertilization',
    labor: 2,
    cost: 800,
    priority: 'high',
  },
  {
    title: 'Neem Oil Bio-Pesticide Knapsack Spray',
    category: 'spraying',
    labor: 2,
    cost: 900,
    priority: 'urgent',
  },
  {
    title: 'Pre-Harvest Field Drainage Inspection',
    category: 'irrigation',
    labor: 1,
    cost: 450,
    priority: 'medium',
  },
  {
    title: 'Combine Harvester Field Threshing Run',
    category: 'harvest',
    labor: 4,
    cost: 3800,
    priority: 'urgent',
  },
];

export default function CropTasksPage() {
  const searchParams = useSearchParams();
  const planIdParam = searchParams?.get('planId') || '';

  const [tasks, setTasks] = useState<CropTask[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    farmId: '',
    taskTitle: 'Rotavator Tillage & Basal Compost Incorporation',
    taskCategory: 'land_prep',
    scheduledDate: new Date().toISOString().split('T')[0],
    assignedLaborCount: 2,
    estimatedLaborCostInr: 1200,
    priority: 'high',
    status: 'todo',
    notes: 'Incorporate 5 tonnes FYM compost uniformly.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const url = planIdParam ? `/api/crop-tasks?planId=${planIdParam}` : '/api/crop-tasks';
      const [tasksRes, farmsRes] = await Promise.all([
        fetch(url),
        fetch('/api/farms'),
      ]);

      if (tasksRes.ok) {
        const json = await tasksRes.json();
        setTasks(json.data || []);
      }
      if (farmsRes.ok) {
        const json = await farmsRes.json();
        setFarms(json.data || []);
        if (json.data?.length > 0 && !formData.farmId) {
          setFormData((prev) => ({ ...prev, farmId: json.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [planIdParam]);

  const handleApplyPreset = (preset: (typeof TASK_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      taskTitle: preset.title,
      taskCategory: preset.category,
      assignedLaborCount: preset.labor,
      estimatedLaborCostInr: preset.cost,
      priority: preset.priority,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      alert('Please select a farm parcel');
      return;
    }
    const selectedFarm = farms.find((f) => f._id === formData.farmId);
    if (!selectedFarm) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/crop-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: selectedFarm.farmerId?._id || selectedFarm.farmerId,
          farmId: formData.farmId,
          planId: planIdParam || undefined,
          taskTitle: formData.taskTitle,
          taskCategory: formData.taskCategory,
          scheduledDate: formData.scheduledDate,
          assignedLaborCount: Number(formData.assignedLaborCount),
          estimatedLaborCostInr: Number(formData.estimatedLaborCostInr),
          priority: formData.priority,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create task');
      }
    } catch (err) {
      console.error(err);
      alert('Error scheduling task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/crop-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: newStatus as any } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.taskCategory !== categoryFilter) return false;
    return true;
  });

  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalLaborBudget = tasks.reduce((acc, t) => acc + (t.estimatedLaborCostInr || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <ListTodo className="h-3.5 w-3.5" /> Field Operations & Labor Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Crop Task & Schedule Engine
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Schedule farm operations, allocate labor headcounts, track input wages, and monitor daily intercultural farm chores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/harvest-readiness"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            Harvest Readiness &rarr;
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Schedule New Task
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Total Tasks</span>
            <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{totalTasks}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Operations on schedule</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">In Progress</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Active in field right now</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Completed</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">{completedCount}</div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Operations finished</p>
        </div>

        <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Labor Budget</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{totalLaborBudget.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Estimated operational wages</p>
        </div>
      </div>

      {/* Filter and Category Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-600 dark:text-[#a0b5a3] mr-2">Filter Status:</span>
          {['all', 'todo', 'in_progress', 'done', 'blocked'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#245C3A] text-white'
                  : 'bg-stone-100 dark:bg-[#193D2A]/60 text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-200 dark:hover:bg-[#193D2A]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#121c14] text-stone-800 dark:text-stone-200 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="land_prep">Land Preparation</option>
            <option value="weeding">Intercultural Weeding</option>
            <option value="fertilization">Fertilization / Top Dressing</option>
            <option value="spraying">Crop Protection Spray</option>
            <option value="irrigation">Irrigation / Drainage</option>
            <option value="harvest">Harvesting & Threshing</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Loading scheduled farm tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#CFDEC9] dark:border-[#245C3A]/40 rounded-2xl bg-white/50 dark:bg-[#162218]/50 p-8">
          <ListTodo className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">No Tasks In This View</h3>
          <p className="text-xs text-stone-500 dark:text-[#a0b5a3] max-w-sm mx-auto mt-1">
            Click "Schedule New Task" to assign field chores, irrigation runs, and weeding squads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isDone = item.status === 'done';
            const isInProgress = item.status === 'in_progress';
            const isUrgent = item.priority === 'urgent';
            const isHigh = item.priority === 'high';

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-5 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200'
                          : isHigh
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      }`}
                    >
                      {item.priority} priority &bull; {item.taskCategory.replace('_', ' ')}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : isInProgress
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : 'bg-stone-100 dark:bg-[#193D2A] text-stone-600 dark:text-[#CFDEC9]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-white leading-tight">
                    {item.taskTitle}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-1">
                    Parcel: <span className="font-semibold text-stone-800 dark:text-stone-200">{item.farmId?.parcelName}</span> &bull; 
                    Scheduled: <span className="font-semibold text-stone-800 dark:text-stone-200">{new Date(item.scheduledDate).toLocaleDateString()}</span>
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Assigned Labor</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.assignedLaborCount} Workers</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 dark:text-[#a0b5a3] block">Est. Wages</span>
                      <span className="font-bold text-stone-900 dark:text-white">₹{item.estimatedLaborCostInr}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-stone-600 dark:text-[#a0b5a3] italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {item.status !== 'done' ? (
                      <>
                        {item.status === 'todo' && (
                          <button
                            onClick={() => handleUpdateStatus(item._id, 'in_progress')}
                            disabled={updatingId === item._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Start
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'done')}
                          disabled={updatingId === item._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Finished on Field
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono">
                    ID: {item._id.slice(-5)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#245C3A]/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white">
                  <ListTodo className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Schedule Farm Operation Task</h3>
                  <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                    Labor headcount & operational wage allocation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#193D2A] text-stone-400 hover:text-stone-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Presets */}
            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-[#a0b5a3] block mb-2">
                🚜 Quick Operation Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TASK_PRESETS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-[#193D2A] border border-[#E3E8DF] dark:border-[#245C3A]/40 hover:border-[#245C3A] text-stone-800 dark:text-[#CFDEC9] transition-all"
                  >
                    {p.title.split(' ')[0]} ({p.labor} lab &bull; ₹{p.cost})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Target Farm Parcel *
                </label>
                <select
                  value={formData.farmId}
                  onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                >
                  <option value="">Select parcel</option>
                  {farms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.parcelName} ({f.farmerId?.name || 'Farmer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Category
                  </label>
                  <select
                    value={formData.taskCategory}
                    onChange={(e) => setFormData({ ...formData, taskCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="land_prep">Land Preparation</option>
                    <option value="weeding">Intercultural Weeding</option>
                    <option value="fertilization">Fertilization</option>
                    <option value="spraying">Crop Protection Spray</option>
                    <option value="irrigation">Irrigation / Drainage</option>
                    <option value="harvest">Harvesting</option>
                    <option value="general">General Upkeep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Assigned Labor Headcount
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.assignedLaborCount}
                    onChange={(e) => setFormData({ ...formData, assignedLaborCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Estimated Labor Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedLaborCostInr}
                    onChange={(e) => setFormData({ ...formData, estimatedLaborCostInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Operational Instructions & Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions for laborers or machinery operators..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-[#245C3A]/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#193D2A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] rounded-xl shadow-xs transition-colors"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
