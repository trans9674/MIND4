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

    // Normalize IDs to string to ensure compatibility with both int8 and uuid DB types
    setCustomers((customersData || []).map(c => ({ ...c, id: String(c.id) })));
    setColumns(columnsData || []);
    setTasks((tasksData || []).map(t => ({ ...t, id: String(t.id), customerId: String(t.customerId) })));
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
        
        // 1. Insert Static Data
        await supabase.from('columns').insert(INITIAL_COLUMNS);
        await supabase.from('app_settings').insert({ id: 1, hiddenColumns: {} });
        await supabase.from('company_info').insert({ id: 1, ...INITIAL_COMPANY_INFO });

        // 2. Insert Employees (Strip IDs to let DB auto-increment if needed)
        const empPayload = INITIAL_EMPLOYEES.map(({ id, ...rest }) => rest);
        await supabase.from('employees').insert(empPayload);

        // 3. Insert Template Tasks (Strip IDs)
        const tmplPayload = INITIAL_TEMPLATE_TASKS.map(({ id, ...rest }) => rest);
        await supabase.from('template_tasks').insert(tmplPayload);

        // 4. Insert Customers (Strip IDs) & Get new IDs
        const custPayload = INITIAL_CUSTOMERS.map(({ id, ...rest }) => rest);
        const { data: newCustomers } = await supabase.from('customers').insert(custPayload).select();

        // 5. Insert Tasks (Distribute among new customers)
        if (newCustomers && newCustomers.length > 0) {
            // Generate tasks dynamically for the newly inserted customers
            const taskPayload = [];
            const { INITIAL_TASKS: originalTasks } = await import('./constants');
            
            // Map the first few original tasks to the first new customer, etc.
            let taskCounter = 0;
             for (const cust of newCustomers) {
                 const sampleTasks = originalTasks.slice(taskCounter, taskCounter + 4).map(({ id, customerId, ...t }) => ({
                     ...t,
                     customerId: cust.id // Link to new Customer ID
                 }));
                 taskPayload.push(...sampleTasks);
                 taskCounter = (taskCounter + 4) % originalTasks.length;
             }
             await supabase.from('tasks').insert(taskPayload);
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
        if (payload.eventType === 'INSERT') setCustomers(c => [...c, normalize(payload.new)]);
        if (payload.eventType === 'UPDATE') setCustomers(c => c.map(item => item.id === String(payload.new.id) ? normalize(payload.new) : item));
        if (payload.eventType === 'DELETE') setCustomers(c => c.filter(item => item.id !== String(payload.old.id)));
    };
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
  
  // --- Supabase Data Handlers (Safe ID Generation) ---
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    // Generate a secure numeric ID based on timestamp to ensure insertion works even if DB auto-increment is off
    const newId = Date.now();
    const { data, error } = await supabase.from('customers').insert([{ ...customerData, id: newId }]).select().single();
    if (error) {
        console.error('Error adding customer:', error);
        alert(`登録に失敗しました。\nエラー: ${error.message}\n\n【重要】Supabaseの「Authentication > Policies (RLS)」設定で、INSERT(追加)が許可されているか確認してください。`);
        return;
    }
  };

  const handleUpdateCustomer = async (customerId: string, updatedFields: Partial<Customer>) => {
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
    await supabase.from('tasks').delete().eq('customerId', customerId);
    await supabase.from('customers').delete().eq('id', customerId);
  };
  
  const handleUpdateCustomerData = async (customerId: string, field: string, value: any) => {
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
    await supabase.from('columns').insert([column]);
  };
  const handleDeleteColumn = async (columnId: string) => {
    await supabase.from('columns').delete().eq('id', columnId);
  };
  const handleUpdateColumns = async (newColumns: Column[]) => {
      await supabase.from('columns').upsert(newColumns);
  };
  const handleUpdateHiddenColumns = async (newHiddenColumns: Record<CustomerStatus, string[]>) => {
      await supabase.from('app_settings').update({ hiddenColumns: newHiddenColumns }).eq('id', 1);
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
      // Generate ID manually to ensure compatibility
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const { error } = await supabase.from('tasks').insert([{ ...task, id: newId }]);
      if (error) {
          console.error('Error adding task:', error);
          alert('タスク登録失敗: ' + error.message);
      }
  }
  const handleDeleteTask = async (taskId: string) => {
      await supabase.from('tasks').delete().eq('id', taskId);
  }
  const handleUpdateTask = async (taskId: string, updatedFields: Partial<Task>) => {
      await supabase.from('tasks').update(updatedFields).eq('id', taskId);
  }
  const handleUpdateEmployees = async (newEmployees: Employee[]) => {
      for (const emp of newEmployees) {
          if (emp.id.startsWith('e_')) {
              // New employee from UI: Generate ID
              const { id, ...rest } = emp;
              const newId = Date.now() + Math.floor(Math.random() * 1000);
              await supabase.from('employees').insert([{...rest, id: newId}]);
          } else {
               await supabase.from('employees').update({ name: emp.name, role: emp.role, avatar: emp.avatar }).eq('id', emp.id);
          }
      }
      fetchAllData();
  }
  const handleUpdateTemplateTasks = async (newTemplateTasks: TemplateTask[]) => {
       for (const task of newTemplateTasks) {
          if (task.id.startsWith('tt_')) {
              const { id, ...rest } = task;
              const newId = Date.now() + Math.floor(Math.random() * 1000);
              await supabase.from('template_tasks').insert([{...rest, id: newId}]);
          } else {
              await supabase.from('template_tasks').update(task).eq('id', task.id);
          }
      }
      fetchAllData();
  }
  const handleUpdateCompanyInfo = async (newInfo: Partial<Omit<CompanyInfo, 'id'>>) => {
      if (!companyInfo) return;
      await supabase.from('company_info').update(newInfo).eq('id', 1);
  };

  const menuItems = [
    { label: '会社情報・社員登録', icon: Building2, action: () => setSettingsMode('company'), hasSubmenu: true },
    { type: 'divider' },
    { label: 'タスクひな形', icon: FileSpreadsheet, action: () => setSettingsMode('task_template') },
    { label: '工程ひな形', icon: Settings, action: () => setSettingsMode('schedule_template') },
    { type: 'divider' },
    { label: 'バージョン情報', icon: Info, action: () => alert('iekoto MIND v2.0.2 (Force ID Fix)') },
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