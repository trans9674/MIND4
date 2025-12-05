import React, { useState, useEffect } from 'react';
import { Customer, Column, Task, AppState, Employee, TemplateTask, CustomerStatus, CompanyInfo } from './types';
import { INITIAL_CUSTOMERS, INITIAL_COLUMNS, INITIAL_TASKS, INITIAL_EMPLOYEES, INITIAL_TEMPLATE_TASKS, INITIAL_COMPANY_INFO } from './constants';
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
  LayoutGrid, Table, Map as MapIcon, 
  Building2, 
  Settings,
  Shield, HardHat
} from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  // State Initialization
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>(INITIAL_TEMPLATE_TASKS);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>({ ...INITIAL_COMPANY_INFO, id: 1 });
  const [hiddenColumns, setHiddenColumns] = useState<Record<CustomerStatus, string[]>>({} as Record<CustomerStatus, string[]>);
  
  const [viewMode, setViewMode] = useState<AppState['viewMode']>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [settingsMode, setSettingsMode] = useState<SettingsMode>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- Customer Handlers ---

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `c_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (customerId: string, updatedFields: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updatedFields } : c));
  };

  const handleUpdateCustomerData = (customerId: string, field: string, value: any) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          data: { ...c.data, [field]: value }
        };
      }
      return c;
    }));
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setTasks(prev => prev.filter(t => t.customerId !== customerId));
  };

  // --- Column Handlers ---

  const handleAddColumn = (column: Column) => {
    setColumns(prev => [...prev, column]);
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId));
    // Optionally clean up data in customers, but usually keeping it is safer or handled by UI ignoring it
  };

  const handleUpdateColumns = (newColumns: Column[]) => {
    setColumns(newColumns);
  };

  const handleUpdateHiddenColumns = (newHiddenColumns: Record<CustomerStatus, string[]>) => {
    setHiddenColumns(newHiddenColumns);
  };

  // --- Task Handlers ---

  const handleAddTask = (task: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = {
      ...task,
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (taskId: string, updatedFields: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Settings Handlers ---

  const handleUpdateCompanyInfo = (newInfo: Partial<Omit<CompanyInfo, 'id'>>) => {
    setCompanyInfo(prev => prev ? { ...prev, ...newInfo } : null);
  };

  const handleUpdateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
  };

  const handleUpdateTemplateTasks = (newTemplateTasks: TemplateTask[]) => {
    setTemplateTasks(newTemplateTasks);
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
             <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 hidden md:block">
            {companyInfo?.name || 'ie-koto MIND'}
          </h1>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table className="w-4 h-4" />
            <span className="hidden md:inline">台帳</span>
          </button>
          <button
            onClick={() => setViewMode('gantt_map')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'gantt_map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden md:inline">全体工程・地図</span>
          </button>
          <button
            onClick={() => setViewMode('construction_schedule')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'construction_schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span className="hidden md:inline">着工工程</span>
          </button>
          <button
            onClick={() => setViewMode('3d_progress')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === '3d_progress' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">3D進捗</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
           <button 
             onClick={() => setIsAdminPanelOpen(true)}
             className="p-2 text-gray-500 hover:bg-gray-100 rounded-full hover:text-blue-600 transition-colors"
             title="管理者パネル"
           >
             <Shield className="w-5 h-5" />
           </button>
           <button 
             onClick={() => setSettingsMode('company')}
             className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
             title="設定"
           >
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-2 md:p-4 relative">
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
        {viewMode === 'gantt_map' && (
          <GanttMap customers={customers} />
        )}
        {viewMode === 'construction_schedule' && (
          <ConstructionSchedule 
            customers={customers} 
            onUpdateCustomer={handleUpdateCustomer}
            onCustomerClick={setSelectedCustomer}
          />
        )}
        {viewMode === '3d_progress' && (
          <Progress3D
            customers={customers}
            tasks={tasks}
            onCustomerClick={setSelectedCustomer}
          />
        )}
      </main>

      {/* Task Modal (Customer Detail) */}
      <AnimatePresence>
        {selectedCustomer && (
          <TaskModal
            customer={selectedCustomer}
            tasks={tasks}
            templateTasks={templateTasks}
            onClose={() => setSelectedCustomer(null)}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {settingsMode && (
          <SettingsModal
            mode={settingsMode}
            onClose={() => setSettingsMode(null)}
            companyInfo={companyInfo}
            employees={employees}
            templateTasks={templateTasks}
            onUpdateCompanyInfo={handleUpdateCompanyInfo}
            onUpdateEmployees={handleUpdateEmployees}
            onUpdateTemplateTasks={handleUpdateTemplateTasks}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        customers={customers}
        employees={employees}
      />
    </div>
  );
};

export default App;