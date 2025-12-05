import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Customer, Column, Task, AppState, Employee, TemplateTask, CustomerStatus, CompanyInfo } from './types';
import { INITIAL_CUSTOMERS, INITIAL_COLUMNS, INITIAL_TASKS, INITIAL_EMPLOYEES, INITIAL_TEMPLATE_TASKS, INITIAL_COMPANY_INFO } from './constants';
import { supabase } from './supabaseClient';
import CustomerSheet from './components/CustomerSheet';
import GanttMap from './components/GanttMap';
import Progress3D from './components/Progress3D';
import TaskModal from './components/TaskModal';
import SettingsModal, { SettingsMode } from './components/SettingsModal';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './components/AdminPanel';
import ConstructionSchedule from './components/ConstructionSchedule';
import { AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Table, Map as MapIcon, Box, 
  Building2, 
  FileSpreadsheet, Info, 
  Settings, ChevronRight,
  Shield, HardHat
} from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<CustomerStatus, string[]>>({} as Record<CustomerStatus, string[]>);
  
  const [viewMode, setViewMode] = useState<AppState['viewMode']>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<SettingsMode>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ref to track pending optimistic adds to prevent overwrite by background fetches
  // We keep items here until they are confirmed to exist in a fetch response
  const pendingAddsRef = useRef<Set<string>>(new Set());
  const pendingTaskAddsRef = useRef<Set<string>>(new Set());
  
  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);

    const [
      { data: customersData },
      { data: columnsData },
      { data: tasksData },
      { data: employeesData },
      { data: templateTasksData },
      { data: settingsData },
      { data: companyInfoData }
    ] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('columns').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('template_tasks').select('*'),
      supabase.from('app_settings').select('hiddenColumns').eq('id', 1).single(),
      supabase.from('company_info').select('*').eq('id', 1).single()
    ]);

    // Normalize IDs to string to ensure compatibility
    // Use functional update to preserve pending optimistic additions
    setCustomers(prev => {
        const fetched = (customersData || []).map(c => ({ ...c, id: String(c.id) }));
        
        // Remove pending IDs ONLY if they have arrived in the fetch
        fetched.forEach(f => {
            if (pendingAddsRef.current.has(f.id)) {
                pendingAddsRef.current.delete(f.id);
            }
        });

        // Keep pending items that are still not in the fetched list (stale fetch protection)
        const pendingItems = prev.filter(c => 
            pendingAddsRef.current.has(c.id) && 
            !fetched.some(f => f.id === c.id)
        );
        return [...fetched, ...pendingItems];
    });

    setColumns(columnsData || []);
    
    setTasks(prev => {
        const fetched = (tasksData || []).map(t => ({ ...t, id: String(t.id), customerId: String(t.customerId) }));
        
        fetched.forEach(f => {
            if (pendingTaskAddsRef.current.has(f.id)) {
                pendingTaskAddsRef.current.delete(f.id);
            }
        });

        const pendingItems = prev.filter(t => 
             pendingTaskAddsRef.current.has(t.id) && 
             !fetched.some(f => f.id === t.id)
        );
        return [...fetched, ...pendingItems];
    });

    setEmployees((employeesData || []).map(e => ({ ...e, id: String(e.id) })));
    setTemplateTasks((templateTasksData || []).map(t => ({ ...t, id: String(t.id) })));
    setHiddenColumns(settingsData?.hiddenColumns || {});
    setCompanyInfo(companyInfoData || null);
    
    if (isInitialLoad) setIsLoading(false);
    console.log("Data refreshed at", new Date().toLocaleTimeString());
  }, []);

  // Data Loading and Seeding
  useEffect(() => {
    const setupData = async () => {
      const { count, error } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      if (error) console.error("Error checking customers count:", error);

      if (count === 0) {
        console.log("No data found. Seeding initial data...");
        try {
            await supabase.from('columns').upsert(INITIAL_COLUMNS);
            await supabase.from('app_settings').upsert({ id: 1, hiddenColumns: {} });
            await supabase.from('company_info').upsert({ id: 1, ...INITIAL_COMPANY_INFO });
            await supabase.from('employees').upsert(INITIAL_EMPLOYEES);
            await supabase.from('template_tasks').upsert(INITIAL_TEMPLATE_TASKS);
            
            // Try seeding customers/tasks. 
            await supabase.from('customers').upsert(INITIAL_CUSTOMERS).catch(e => console.warn("Customer seeding skipped", e));
            await supabase.from('tasks').upsert(INITIAL_TASKS).catch(e => console.warn("Task seeding skipped", e));
            
            console.log("Seeding attempt completed.");
        } catch (e) {
            console.error("Seeding failed:", e);
        }
      }

      await fetchAllData(true);
    };

    setupData();
  }, [fetchAllData]);

  // Self-healing
  useEffect(() => {
    const handleFocus = () => fetchAllData();
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') fetchAllData();
    }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAllData]);

  // Realtime Subscriptions
  useEffect(() => {
    const normalize = (obj: any) => ({ ...obj, id: String(obj.id) });
    const normalizeTask = (obj: any) => ({ ...obj, id: String(obj.id), customerId: String(obj.customerId) });

    const handleCustomerChange = (payload: any) => {
        if (payload.eventType === 'INSERT') {
            setCustomers(c => {
                const newId = String(payload.new.id);
                // If we already have this ID (from our own insertion), don't duplicate
                if (c.some(existing => existing.id === newId)) return c;
                return [...c, normalize(payload.new)];
            });
        }
        if (payload.eventType === 'UPDATE') setCustomers(c => c.map(item => item.id === String(payload.new.id) ? normalize(payload.new) : item));
        if (payload.eventType === 'DELETE') setCustomers(c => c.filter(item => item.id !== String(payload.old.id)));
    };
    
    // ... other handlers ...
    const handleColumnChange = (payload: any) => {
        if (payload.eventType === 'INSERT') setColumns(c => [...c, payload.new]);
        if (payload.eventType === 'UPDATE') setColumns(c => c.map(item => item.id === payload.new.id ? payload.new : item));
        if (payload.eventType === 'DELETE') setColumns(c => c.filter(item => item.id !== payload.old.id));
    };
    const handleTaskChange = (payload: any) => {
        if (payload.eventType === 'INSERT') setTasks(t => [...t, normalizeTask(payload.new)]);
        if (payload.eventType === 'UPDATE') setTasks(t => t.map(item => item.id === String(payload.new.id) ? normalizeTask(payload.new) : item));
        if (payload.eventType === 'DELETE') setTasks(t => t.filter(item => item.id !== String(payload.old.id)));
    };
     const handleEmployeeChange = (payload: any) => {
        if (payload.eventType === 'INSERT') setEmployees(e => [...e, normalize(payload.new)]);
        if (payload.eventType === 'UPDATE') setEmployees(e => e.map(item => item.id === String(payload.new.id) ? normalize(payload.new) : item));
        if (payload.eventType === 'DELETE') setEmployees(e => e.filter(item => item.id !== String(payload.old.id)));
    };
     const handleTemplateTaskChange = (payload: any) => {
        if (payload.eventType === 'INSERT') setTemplateTasks(t => [...t, normalize(payload.new)]);
        if (payload.eventType === 'UPDATE') setTemplateTasks(t => t.map(item => item.id === String(payload.new.id) ? normalize(payload.new) : item));
        if (payload.eventType === 'DELETE') setTemplateTasks(t => t.filter(item => item.id !== String(payload.old.id)));
    };
    const handleSettingsChange = (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === 1) {
            setHiddenColumns(payload.new.hiddenColumns);
        }
    };
    const handleCompanyInfoChange = (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === 1) {
            setCompanyInfo(payload.new);
        }
    };

    const dbChangesChannel = supabase.channel('db-changes');
    
    dbChangesChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, handleCustomerChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, handleColumnChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleTaskChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, handleEmployeeChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'template_tasks' }, handleTemplateTaskChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, handleSettingsChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_info' }, handleCompanyInfoChange)
        .subscribe();

    return () => {
      supabase.removeChannel(dbChangesChannel);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // --- Supabase Data Handlers (ID Swapping Logic with Robust Protection) ---
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    // 1. Generate Persistent ID (DB likely has text PK without auto-gen)
    const newId = `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 2. Add to Pending to protect against stale fetches removing it
    pendingAddsRef.current.add(newId);
    
    const initialData: Record<string, any> = { ...customerData.data };
    columns.forEach(col => {
        if (initialData[col.id] === undefined) initialData[col.id] = '';
    });

    const newCustomer = { 
        ...customerData, 
        id: newId, 
        data: initialData,
        created_at: new Date().toISOString()
    };
    
    // 3. Optimistic Update
    setCustomers(prev => [...prev, newCustomer]); 

    try {
        // 4. Send Payload: Exclude ID so DB generates it (handles auto-increment columns)
        // We will swap the ID later if DB returns a different one.
        const { id: _, ...dbPayload } = newCustomer;

        const { data, error } = await supabase
            .from('customers')
            .insert([dbPayload])
            .select()
            .single();
        
        if (error) throw error;

        if (data) {
            // 5. Success: Check ID
            const returnedId = String(data.id);
            
            // If DB modified ID (unlikely if we sent it), update state
            if (returnedId !== newId) {
                pendingAddsRef.current.add(returnedId);
                setCustomers(prev => prev.map(c => c.id === newId ? { ...data, id: returnedId } : c));
                pendingAddsRef.current.delete(newId);
            }
            
            // Delay removing ID to ensure any in-flight fetches dealing with stale state
            // don't accidentally remove the item.
            setTimeout(() => {
                pendingAddsRef.current.delete(newId);
                if (returnedId !== newId) pendingAddsRef.current.delete(returnedId);
            }, 5000);
        }
    } catch (e: any) {
        console.error('Error adding customer:', e);
        alert(`登録に失敗しました。\nエラー: ${e.message}`);
        // Revert Optimistic Update
        setCustomers(prev => prev.filter(c => c.id !== newId));
        pendingAddsRef.current.delete(newId);
    }
  };

  const handleUpdateCustomer = async (customerId: string, updatedFields: Partial<Customer>) => {
    // Optimistic Update
    setCustomers(prev => prev.map(c => 
        c.id === customerId 
            ? { 
                ...c, 
                ...updatedFields, 
                data: updatedFields.data ? { ...c.data, ...updatedFields.data } : c.data 
              } 
            : c
    ));

    if (updatedFields.data && typeof updatedFields.data === 'object') {
      const { data: currentCustomer, error } = await supabase
        .from('customers')
        .select('data')
        .eq('id', customerId)
        .single();

      if (error || !currentCustomer) return;

      const newData = { ...currentCustomer.data, ...updatedFields.data };
      const finalUpdate = { ...updatedFields, data: newData };
      await supabase.from('customers').update(finalUpdate).eq('id', customerId);
    } else {
      await supabase.from('customers').update(updatedFields).eq('id', customerId);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    await supabase.from('tasks').delete().eq('customerId', customerId);
    await supabase.from('customers').delete().eq('id', customerId);
  };
  
  const handleUpdateCustomerData = async (customerId: string, field: string, value: any) => {
    // Optimistic UI Update
    setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
            return { ...c, data: { ...c.data, [field]: value } };
        }
        return c;
    }));

    // Background DB Update
    const { data: currentCustomer, error } = await supabase
      .from('customers')
      .select('data')
      .eq('id', customerId)
      .single();

    if (error || !currentCustomer) return;
    
    const newData = { ...currentCustomer.data, [field]: value };
    await supabase.from('customers').update({ data: newData }).eq('id', customerId);
  };

  const handleAddColumn = async (column: Column) => {
    setColumns(prev => [...prev, column]);
    await supabase.from('columns').insert([column]);
  };
  const handleDeleteColumn = async (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId));
    await supabase.from('columns').delete().eq('id', columnId);
  };
  const handleUpdateColumns = async (newColumns: Column[]) => {
      setColumns(newColumns);
      await supabase.from('columns').upsert(newColumns);
  };
  const handleUpdateHiddenColumns = async (newHiddenColumns: Record<CustomerStatus, string[]>) => {
      setHiddenColumns(newHiddenColumns);
      await supabase.from('app_settings').update({ hiddenColumns: newHiddenColumns }).eq('id', 1);
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
      // 1. Generate Persistent ID
      const newId = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      pendingTaskAddsRef.current.add(newId);
      
      const newTask = { 
          ...task, 
          id: newId,
          created_at: new Date().toISOString()
      };
      
      // 2. Optimistic Update
      setTasks(prev => [...prev, newTask]); 

      try {
        // 3. Send Payload: Exclude ID so DB generates it
        const { id: _, ...dbPayload } = newTask;

        const { data, error } = await supabase.from('tasks').insert([dbPayload]).select().single(); 
        if (error) throw error;

        // 4. Success check
        if (data) {
            const returnedId = String(data.id);
            if (returnedId !== newId) {
                pendingTaskAddsRef.current.add(returnedId);
                setTasks(prev => prev.map(t => t.id === newId ? { ...t, ...data, id: returnedId, customerId: String(data.customerId) } : t));
                pendingTaskAddsRef.current.delete(newId);
            }
            
            setTimeout(() => {
                pendingTaskAddsRef.current.delete(newId);
                if (returnedId !== newId) pendingTaskAddsRef.current.delete(returnedId);
            }, 5000);
        }
      } catch (error: any) {
          console.error('Error adding task:', error);
          alert('タスク登録失敗: ' + error.message);
          pendingTaskAddsRef.current.delete(newId);
          setTasks(prev => prev.filter(t => t.id !== newId));
      }
  }
  const handleDeleteTask = async (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await supabase.from('tasks').delete().eq('id', taskId);
  }
  const handleUpdateTask = async (taskId: string, updatedFields: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      await supabase.from('tasks').update(updatedFields).eq('id', taskId);
  }
  const handleUpdateEmployees = async (newEmployees: Employee[]) => {
      setEmployees(newEmployees); 
      for (const emp of newEmployees) {
          // Check if employee exists logic could be simpler with upsert for all
          await supabase.from('employees').upsert([emp]); 
      }
      fetchAllData();
  }
  const handleUpdateTemplateTasks = async (newTemplateTasks: TemplateTask[]) => {
       setTemplateTasks(newTemplateTasks);
       for (const task of newTemplateTasks) {
          await supabase.from('template_tasks').upsert([task]);
      }
  }
  const handleUpdateCompanyInfo = async (newInfo: Partial<Omit<CompanyInfo, 'id'>>) => {
      if (!companyInfo) return;
      const updated = { ...companyInfo, ...newInfo };
      setCompanyInfo(updated);
      await supabase.from('company_info').update(newInfo).eq('id', 1);
  };

  const menuItems = [
    { label: '会社情報・社員登録', icon: Building2, action: () => setSettingsMode('company'), hasSubmenu: true },
    { type: 'divider' },
    { label: 'タスクひな形', icon: FileSpreadsheet, action: () => setSettingsMode('task_template') },
    { label: '工程ひな形', icon: Settings, action: () => setSettingsMode('schedule_template') },
    { type: 'divider' },
    { label: 'バージョン情報', icon: Info, action: () => alert('iekoto MIND v2.0.9 (Fix)') },
  ];

  if (isLoading || showSplash) {
      return <SplashScreen />;
  }

  return (
    <>
      <div className="h-screen w-screen bg-slate-100 grid grid-rows-[auto_1fr] text-slate-800 font-sans overflow-hidden">
        <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-4 md:px-6 shadow-md z-50 relative print:hidden">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 hover:bg-slate-800 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/50">
                <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-white">
                  <path d="M5 22.5V8.5L16 2L27 8.5V22.5" />
                  <circle cx="31" cy="22.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden lg:block" translate="no">ie-koto MIND</h1>
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {menuItems.map((item, idx) => {
                  if (item.type === 'divider') return <div key={idx} className="h-px bg-gray-100 my-1" />;
                  const Icon = item.icon as React.ElementType;
                  return (
                    <button key={idx} onClick={() => { item.action?.(); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors group">
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" />
                        <span>{item.label}</span>
                      </div>
                      {item.hasSubmenu && <ChevronRight className="w-3 h-3 text-gray-300" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <nav className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <Table className="w-4 h-4" />
              <span className="hidden md:inline">顧客台帳</span>
            </button>
            <button onClick={() => setViewMode('gantt_map')} className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-md text-sm transition-all ${viewMode === 'gantt_map' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <MapIcon className="w-4 h-4" />
              <span className="hidden md:inline">工程＆マップ</span>
            </button>
            <button onClick={() => setViewMode('3d_progress')} className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-md text-sm transition-all ${viewMode === '3d_progress' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <Box className="w-4 h-4" />
              <span className="hidden md:inline">3D進捗</span>
            </button>
            <button onClick={() => setViewMode('construction_schedule')} className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-md text-sm transition-all ${viewMode === 'construction_schedule' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <HardHat className="w-4 h-4" />
              <span className="hidden md:inline">着工スケジュール</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button onClick={() => setIsAdminPanelOpen(true)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" title="管理者パネル">
              <Shield className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors">
              User
            </div>
          </div>
        </header>

        <main className="overflow-hidden p-4 overscroll-contain" onClick={() => setIsMenuOpen(false)}>
          {viewMode === 'list' && (
              <CustomerSheet 
                customers={customers} 
                columns={columns} 
                hiddenColumns={hiddenColumns}
                employees={employees}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onUpdateCustomerData={handleUpdateCustomerData}
                onDeleteCustomer={handleDeleteCustomer}
                onAddColumn={handleAddColumn}
                onDeleteColumn={handleDeleteColumn}
                onUpdateColumns={handleUpdateColumns}
                onUpdateHiddenColumns={handleUpdateHiddenColumns}
              />
          )}
          
          {viewMode === 'gantt_map' && (<GanttMap customers={customers} />)}
          {viewMode === '3d_progress' && (<Progress3D customers={customers} tasks={tasks} onCustomerClick={setSelectedCustomer} />)}
          {viewMode === 'construction_schedule' && (<ConstructionSchedule customers={customers} onUpdateCustomer={handleUpdateCustomer} onCustomerClick={setSelectedCustomer} /> )}
        </main>

        <TaskModal 
          customer={selectedCustomer} 
          tasks={tasks} 
          templateTasks={templateTasks}
          onClose={() => setSelectedCustomer(null)}
          onUpdateTask={handleUpdateTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />
        <SettingsModal 
          mode={settingsMode}
          onClose={() => setSettingsMode(null)}
          companyInfo={companyInfo}
          onUpdateCompanyInfo={handleUpdateCompanyInfo}
          employees={employees}
          onUpdateEmployees={handleUpdateEmployees}
          templateTasks={templateTasks}
          onUpdateTemplateTasks={handleUpdateTemplateTasks}
        />
        <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} customers={customers} employees={employees} />
      </div>
    </>
  );
};

export default App;