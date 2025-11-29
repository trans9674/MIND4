import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, Building2, Users, CheckCircle, AlertCircle, GripVertical, Calendar, UserCircle, Sparkles } from 'lucide-react';
import { Employee, AvatarConfig, TemplateTask, CompanyInfo } from '../types';
import AvatarCreator from './AvatarCreator';
import CalendarModal from './CalendarModal';

export type SettingsMode = 'company' | 'task_template' | 'schedule_template' | null;

interface Props {
  mode: SettingsMode;
  onClose: () => void;
  companyInfo: CompanyInfo | null;
  employees: Employee[];
  templateTasks: TemplateTask[];
  onUpdateCompanyInfo: (newInfo: Partial<Omit<CompanyInfo, 'id'>>) => void;
  onUpdateEmployees: (newEmployees: Employee[]) => void;
  onUpdateTemplateTasks: (newTemplateTasks: TemplateTask[]) => void;
}

interface TemplatePhase {
  id: string;
  name: string;
  startDay: number;
  duration: number;
  color: string;
}

interface ScheduleAdjustments {
  yearEnd: number;
  gw: number;
  obon: number;
  weather: number;
  site: number;
  other: number;
}

interface AdjustedPhase extends TemplatePhase {
  displayStart: number;
  displayDuration: number;
  adjustmentReason?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#f97316', // orange
];

const SettingsModal: React.FC<Props> = ({ mode, onClose, companyInfo, employees, templateTasks, onUpdateCompanyInfo, onUpdateEmployees, onUpdateTemplateTasks }) => {
  const [localCompanyInfo, setLocalCompanyInfo] = useState(companyInfo);
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<Employee['role']>('営業');
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  const [currentAvatarConfig, setCurrentAvatarConfig] = useState<AvatarConfig | undefined>(undefined);

  const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);
  const [draggingTask, setDraggingTask] = useState<TemplateTask | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [templatePhases, setTemplatePhases] = useState<TemplatePhase[]>([
    { id: 'tp1', name: '仮設工事', startDay: 0, duration: 7, color: '#94a3b8' },
    { id: 'tp2', name: '基礎工事', startDay: 7, duration: 21, color: '#3b82f6' },
    { id: 'tp3', name: '木工事(上棟)', startDay: 28, duration: 1, color: '#ef4444' },
    { id: 'tp4', name: '木工事(造作)', startDay: 29, duration: 40, color: '#f59e0b' },
    { id: 'tp5', name: '屋根・外壁工事', startDay: 35, duration: 20, color: '#10b981' },
    { id: 'tp6', name: '内装仕上げ工事', startDay: 60, duration: 15, color: '#8b5cf6' },
    { id: 'tp7', name: '設備機器設置', startDay: 70, duration: 10, color: '#6366f1' },
    { id: 'tp8', name: 'クリーニング・検査', startDay: 80, duration: 7, color: '#ec4899' },
  ]);

  const [adjustments, setAdjustments] = useState<ScheduleAdjustments>({
    yearEnd: 10,
    gw: 7,
    obon: 5,
    weather: 2,
    site: 0,
    other: 0,
  });

  const [simulationStartDate, setSimulationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-left' | 'resize-right';
    phaseId: string;
    startX: number;
    initialStart: number;
    initialDuration: number;
  } | null>(null);

  const [draggingRowIndex, setDraggingRowIndex] = useState<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  
  useEffect(() => {
    setLocalCompanyInfo(companyInfo);
  }, [companyInfo]);
  
  useEffect(() => {
    if (editingTask && editingInputRef.current) {
      editingInputRef.current.focus();
    }
  }, [editingTask]);

  const handleSaveChanges = () => {
      if (localCompanyInfo) {
          onUpdateCompanyInfo(localCompanyInfo);
      }
      onClose();
  };

  const handleAddEmployee = () => {
    if (!newEmpName) return;
    const newEmployee: Employee = { 
      id: `e_${Date.now()}`, 
      name: newEmpName, 
      role: newEmpRole,
      avatar: currentAvatarConfig,
      created_at: new Date().toISOString(),
    };
    onUpdateEmployees([...employees, newEmployee]);
    setNewEmpName('');
    setCurrentAvatarConfig(undefined);
  };
  
  const handleDeleteEmployee = (id: string) => {
    onUpdateEmployees(employees.filter(e => e.id !== id));
  };

  const handleStartEditingTask = (task: TemplateTask) => {
    if (editingTask) return; 
    setEditingTask({ id: task.id, title: task.title });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    const newTitle = editingTask.title.trim();

    if (newTitle === '') {
      onUpdateTemplateTasks(templateTasks.filter(t => t.id !== editingTask.id));
    } else {
      onUpdateTemplateTasks(templateTasks.map(t =>
        t.id === editingTask.id ? { ...t, title: newTitle } : t
      ));
    }
    setEditingTask(null);
  };

  const handleAddNewTask = (category: TemplateTask['category']) => {
    if (editingTask) return;
    const newTask: TemplateTask = {
      id: `tt_${Date.now()}`,
      category: category,
      title: '',
      isMilestone: false
    };
    onUpdateTemplateTasks([...templateTasks, newTask]);
    setEditingTask({ id: newTask.id, title: '' });
  };

  const handleDeleteTask = (id: string) => {
    onUpdateTemplateTasks(templateTasks.filter(t => t.id !== id));
  };
  
  const handleToggleMilestone = (id: string) => {
      onUpdateTemplateTasks(templateTasks.map(t => t.id === id ? {...t, isMilestone: !t.isMilestone} : t));
  };

  const handleTaskDragStart = (e: React.DragEvent, task: TemplateTask) => {
    setDraggingTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleTaskDragOver = (e: React.DragEvent, task: TemplateTask) => {
    e.preventDefault();
    if (draggingTask && task.id !== draggingTask.id && task.category === draggingTask.category) {
        const newTasks = [...templateTasks];
        const draggingIndex = newTasks.findIndex(t => t.id === draggingTask.id);
        const overIndex = newTasks.findIndex(t => t.id === task.id);
        if (draggingIndex === -1 || overIndex === -1) return;

        const [removed] = newTasks.splice(draggingIndex, 1);
        newTasks.splice(overIndex, 0, removed);
        onUpdateTemplateTasks(newTasks);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggingTask(null);
  };

  const handleCategoryJump = (category: string) => {
    const element = categoryRefs.current[category];
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
  };


  const handleAddPhase = () => {
    const lastPhase = templatePhases[templatePhases.length - 1];
    const startDay = lastPhase ? lastPhase.startDay + lastPhase.duration : 0;
    const color = DEFAULT_COLORS[templatePhases.length % DEFAULT_COLORS.length];
    setTemplatePhases([...templatePhases, {
      id: `tp_${Date.now()}`,
      name: '新規工程',
      startDay,
      duration: 7,
      color
    }]);
  };

  const handlePhaseChange = (id: string, field: keyof TemplatePhase, value: string | number) => {
    setTemplatePhases(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleDeletePhase = (id: string) => {
    setTemplatePhases(templatePhases.filter(p => p.id !== id));
  };

  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    setDraggingRowIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleRowDragEnd = () => {
    if (draggingRowIndex !== null && dragOverItemIndex.current !== null && draggingRowIndex !== dragOverItemIndex.current) {
        const newPhases = [...templatePhases];
        const draggedItem = newPhases[draggingRowIndex];
        newPhases.splice(draggingRowIndex, 1);
        newPhases.splice(dragOverItemIndex.current, 0, draggedItem);
        setTemplatePhases(newPhases);
    }
    setDraggingRowIndex(null);
    dragOverItemIndex.current = null;
  };

  const dayScale = 8; 

  const handleBarMouseDown = (e: React.MouseEvent, phase: TemplatePhase, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type,
      phaseId: phase.id,
      startX: e.clientX,
      initialStart: phase.startDay,
      initialDuration: phase.duration,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / dayScale);

      setTemplatePhases(prev => prev.map(p => {
        if (p.id !== dragState.phaseId) return p;

        let newStart = dragState.initialStart;
        let newDuration = dragState.initialDuration;

        if (dragState.type === 'move') {
          newStart = Math.max(0, dragState.initialStart + deltaDays);
        } else if (dragState.type === 'resize-right') {
          newDuration = Math.max(1, dragState.initialDuration + deltaDays);
        } else if (dragState.type === 'resize-left') {
          const proposedStart = dragState.initialStart + deltaDays;
          const maxStart = dragState.initialStart + dragState.initialDuration - 1;
          newStart = Math.min(Math.max(0, proposedStart), maxStart);
          newDuration = Math.max(1, dragState.initialDuration + (dragState.initialStart - newStart));
        }

        return {
          ...p,
          startDay: newStart,
          duration: newDuration,
        };
      }));
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.type === 'move' ? 'grabbing' : 'ew-resize';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [dragState]);

  const calculateAdjustedPhases = (): { phases: AdjustedPhase[], totalDuration: number, totalBuffer: number } => {
    let cumulativeShift = 0;
    const simDate = new Date(simulationStartDate);
    const staticBuffer = adjustments.weather + adjustments.site + adjustments.other;

    const adjusted: AdjustedPhase[] = templatePhases.map(phase => {
        const relativeStart = phase.startDay + cumulativeShift;
        const startDate = new Date(simDate);
        startDate.setDate(startDate.getDate() + relativeStart);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + phase.duration);
        
        let shiftForThisPhase = 0;
        let reasons: string[] = [];

        const currentYear = startDate.getFullYear();
        for (let y = currentYear - 1; y <= currentYear + 1; y++) {
             const startYE = new Date(y, 11, 29);
             const endYE = new Date(y + 1, 0, 3);
             if (startDate <= endYE && endDate >= startYE) {
                 shiftForThisPhase += adjustments.yearEnd;
                 reasons.push('年末年始');
                 break;
             }
        }
        for (let y = currentYear - 1; y <= currentYear + 1; y++) {
            const startGW = new Date(y, 3, 28);
            const endGW = new Date(y, 4, 5);
            if (startDate <= endGW && endDate >= startGW) {
                shiftForThisPhase += adjustments.gw;
                reasons.push('GW');
                break;
            }
       }
       for (let y = currentYear - 1; y <= currentYear + 1; y++) {
            const startObon = new Date(y, 7, 14);
            const endObon = new Date(y, 7, 17);
            if (startDate <= endObon && endDate >= startObon) {
                shiftForThisPhase += adjustments.obon;
                reasons.push('お盆');
                break;
            }
       }

       cumulativeShift += shiftForThisPhase;
       
       return {
           ...phase,
           displayStart: relativeStart,
           displayDuration: phase.duration + shiftForThisPhase,
           adjustmentReason: reasons.join(', ')
       };
    });

    const lastPhase = adjusted[adjusted.length - 1];
    const totalDuration = (lastPhase ? lastPhase.displayStart + lastPhase.displayDuration : 0) + staticBuffer;

    return { phases: adjusted, totalDuration, totalBuffer: cumulativeShift + staticBuffer };
  };

  if (!mode) return null;

  const renderContent = () => {
    switch (mode) {
      case 'company':
        return (
          <div className="space-y-8 max-w-3xl mx-auto">
            {isAvatarCreatorOpen && (
                <AvatarCreator 
                    initialConfig={currentAvatarConfig}
                    onSave={(config) => {
                        setCurrentAvatarConfig(config);
                        setIsAvatarCreatorOpen(false);
                    }}
                    onClose={() => setIsAvatarCreatorOpen(false)}
                />
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center border-b pb-2">
                <Building2 className="w-5 h-5 mr-2" /> 会社情報
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">会社名</label>
                  <input 
                    type="text" 
                    value={localCompanyInfo?.name || ''} 
                    onChange={e => setLocalCompanyInfo(info => info ? { ...info, name: e.target.value } : null)}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">営業所・部署名</label>
                  <input 
                    type="text" 
                    value={localCompanyInfo?.branch || ''} 
                    onChange={e => setLocalCompanyInfo(info => info ? { ...info, branch: e.target.value } : null)}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">住所</label>
                  <input 
                    type="text" 
                    value={localCompanyInfo?.address || ''} 
                    onChange={e => setLocalCompanyInfo(info => info ? { ...info, address: e.target.value } : null)}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  />
                </div>
                 <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">電話番号</label>
                  <input 
                    type="text" 
                    value={localCompanyInfo?.phone || ''} 
                    onChange={e => setLocalCompanyInfo(info => info ? { ...info, phone: e.target.value } : null)}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center border-b pb-2">
                <Users className="w-5 h-5 mr-2" /> 社員登録
              </h3>
              
              <div className="flex items-end space-x-2 mb-4 bg-gray-50 p-4 rounded-lg border">
                <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                         <select 
                            value={newEmpRole}
                            onChange={(e) => setNewEmpRole(e.target.value as any)}
                            className="border rounded p-2 bg-white text-sm"
                            >
                            <option value="営業">営業</option>
                            <option value="設計">設計</option>
                            <option value="IC">IC</option>
                            <option value="工務">工務</option>
                            <option value="その他">その他</option>
                        </select>
                         <input
                            type="text"
                            placeholder="氏名"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="border rounded p-2 flex-grow text-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                         <button 
                             onClick={() => setIsAvatarCreatorOpen(true)}
                             className="text-sm bg-white border rounded px-3 py-1 hover:bg-gray-50 flex items-center space-x-1"
                         >
                            <UserCircle className="w-4 h-4 text-gray-500" />
                            <span>アバター編集</span>
                         </button>
                         {currentAvatarConfig && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                </div>
                 <button onClick={handleAddEmployee} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 h-fit">
                    <Plus className="w-5 h-5" />
                 </button>
              </div>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {employees.map(emp => (
                  <li key={emp.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                    <div className="flex items-center space-x-2">
                       <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                       <div>
                         <span className="font-medium text-sm">{emp.name}</span>
                         <span className="text-xs text-gray-500 ml-2">{emp.role}</span>
                       </div>
                    </div>
                    <button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'task_template':
        const categories = ['営業', '設計', '申請', '工務'];
        return (
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border mb-4">
              ここでは、顧客にタスクを割り当てる際のひな形を編集します。<br/>
              タスク名をダブルクリックで編集、ドラッグ＆ドロップで順番を入れ替えできます。
            </p>

            <div className="sticky top-[-24px] bg-slate-50/80 backdrop-blur-sm py-2 z-10 mb-4 -mx-6 px-6">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 mr-2">ジャンプ先:</span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryJump(cat)}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => {
                const tasksForCat = templateTasks.filter(t => t.category === cat);
                return (
                  <div 
                    key={cat} 
                    ref={el => categoryRefs.current[cat] = el}
                    className="bg-white p-4 rounded-lg border shadow-sm"
                    style={{ scrollMarginTop: '80px' }}
                  >
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-3">{cat}</h4>
                    <ul className="space-y-1">
                      {tasksForCat.map(task => (
                        <li 
                           key={task.id} 
                           className={`flex items-center justify-between p-2 rounded-lg group min-h-[40px] transition-all ${draggingTask?.id === task.id ? 'opacity-40 bg-blue-100' : 'hover:bg-gray-50'}`}
                           draggable={!editingTask}
                           onDragStart={(e) => handleTaskDragStart(e, task)}
                           onDragOver={(e) => handleTaskDragOver(e, task)}
                           onDragEnd={handleTaskDragEnd}
                        >
                           {editingTask?.id === task.id ? (
                              <input
                                ref={editingInputRef}
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                onBlur={handleUpdateTask}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateTask();
                                  if (e.key === 'Escape') setEditingTask(null);
                                }}
                                className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-sm outline-none ring-2 ring-blue-200"
                              />
                           ) : (
                             <>
                              <div className="flex items-center space-x-3 flex-grow">
                                <GripVertical className="w-4 h-4 text-gray-300 cursor-move group-hover:text-gray-500 flex-shrink-0" />
                                <button
                                  onClick={() => handleToggleMilestone(task.id)}
                                  className="flex-shrink-0 text-gray-400 hover:text-yellow-500"
                                  title="マイルストーンとして設定"
                                >
                                  <Sparkles className={`w-4 h-4 transition-colors ${task.isMilestone ? 'text-yellow-400 fill-yellow-400/30' : ''}`} />
                                </button>
                                <span className="text-sm text-gray-800 cursor-text flex-grow" onDoubleClick={() => handleStartEditingTask(task)}>
                                    {task.title}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDeleteTask(task.id)} 
                                className="ml-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                             </>
                           )}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleAddNewTask(cat as TemplateTask['category'])}
                      className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 w-full p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>タスクを追加</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'schedule_template':
        const { phases: adjustedPhases, totalDuration, totalBuffer } = calculateAdjustedPhases();
        const totalWorkDays = templatePhases.reduce((sum, p) => sum + p.duration, 0);

        return (
          <div className="flex h-full">
            {/* Left Panel: Inputs */}
            <div className="w-1/3 border-r pr-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">工程リスト</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {templatePhases.map((phase, index) => (
                    <div 
                        key={phase.id} 
                        className={`p-2 border rounded-lg bg-white shadow-sm flex items-start space-x-2 ${draggingRowIndex === index ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleRowDragStart(e, index)}
                        onDragEnter={(e) => handleRowDragEnter(e, index)}
                        onDragEnd={handleRowDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <GripVertical className="w-5 h-5 text-gray-300 mt-1 cursor-move" />
                        <div className="flex-grow space-y-2">
                            <input 
                                type="text"
                                value={phase.name}
                                onChange={e => handlePhaseChange(phase.id, 'name', e.target.value)}
                                className="w-full font-medium text-sm border-b bg-white"
                            />
                            <div className="flex items-center space-x-2 text-xs">
                                <input 
                                    type="number"
                                    value={phase.duration}
                                    onChange={e => handlePhaseChange(phase.id, 'duration', parseInt(e.target.value) || 0)}
                                    className="w-16 border rounded p-1 bg-white"
                                />
                                <span>日間</span>
                                <input 
                                    type="color"
                                    value={phase.color}
                                    onChange={e => handlePhaseChange(phase.id, 'color', e.target.value)}
                                    className="w-6 h-6 border-none"
                                />
                            </div>
                        </div>
                        <button onClick={() => handleDeletePhase(phase.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddPhase} className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"><Plus className="w-4 h-4" /><span>工程を追加</span></button>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-2">休日・予備日設定</h4>
                <div className="space-y-2 text-sm">
                    {Object.entries({yearEnd: '年末年始', gw: 'GW', obon: 'お盆', weather: '悪天候予備', site: '現場都合予備', other: 'その他予備'}).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                            <label>{label}</label>
                            <div className="flex items-center space-x-1">
                                <input 
                                    type="number"
                                    value={adjustments[key as keyof ScheduleAdjustments]}
                                    onChange={e => setAdjustments({...adjustments, [key]: parseInt(e.target.value) || 0})}
                                    className="w-16 border rounded p-1 text-right bg-white"
                                />
                                <span>日</span>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Panel: Simulation */}
            <div className="w-2/3 pl-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                     <h4 className="font-bold text-gray-700">工程シミュレーション</h4>
                     <div className="flex items-center space-x-2">
                         <label className="text-sm">着工日:</label>
                         <button onClick={() => setIsCalendarOpen(true)} className="flex items-center space-x-1 border rounded p-2 bg-white text-sm">
                             <Calendar className="w-4 h-4" />
                             <span>{simulationStartDate}</span>
                         </button>
                     </div>
                </div>

                <div className="flex-grow overflow-x-auto overflow-y-hidden border rounded-lg bg-white relative">
                   <div className="p-4 space-y-1 relative" style={{ width: (totalDuration + 20) * dayScale }}>
                     {adjustedPhases.map(phase => (
                       <div key={phase.id} className="relative h-8 flex items-center" style={{ paddingLeft: phase.displayStart * dayScale }}>
                         <div 
                             className="h-full rounded shadow-inner flex items-center justify-between px-2 group relative cursor-grab active:cursor-grabbing"
                             style={{ width: phase.displayDuration * dayScale, backgroundColor: phase.color + '40', border: `1px solid ${phase.color}` }}
                             onMouseDown={(e) => handleBarMouseDown(e, phase, 'move')}
                         >
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                                onMouseDown={(e) => handleBarMouseDown(e, phase, 'resize-left')}
                            />
                            <span className="text-xs font-medium" style={{ color: phase.color }}>{phase.name}</span>
                            <span className="text-xs" style={{ color: phase.color }}>{phase.duration}日</span>
                             <div 
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                                onMouseDown={(e) => handleBarMouseDown(e, phase, 'resize-right')}
                            />
                            {phase.adjustmentReason && <div className="absolute -top-4 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">{phase.adjustmentReason}</div>}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm flex justify-around">
                     <div>実働日数: <span className="font-bold text-lg">{totalWorkDays}</span> 日</div>
                     <div>予備/休日: <span className="font-bold text-lg">{totalBuffer}</span> 日</div>
                     <div>総工期: <span className="font-bold text-lg text-blue-600">{totalDuration}</span> 日</div>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">
              {mode === 'company' && '会社・社員設定'}
              {mode === 'task_template' && 'タスク・マイルストーン設定'}
              {mode === 'schedule_template' && '工程テンプレート設定'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto overscroll-contain">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white flex justify-end space-x-3 flex-shrink-0">
            <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              キャンセル
            </button>
            <button onClick={handleSaveChanges} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg shadow-blue-500/30">
              <Save className="w-4 h-4 mr-2" />
              保存して閉じる
            </button>
          </div>
        </div>
      </div>
      <CalendarModal 
         isOpen={isCalendarOpen}
         onClose={() => setIsCalendarOpen(false)}
         initialDate={simulationStartDate}
         onSelectDate={(date) => {
            if(date) setSimulationStartDate(date);
            setIsCalendarOpen(false);
         }}
      />
    </>
  );
};

export default SettingsModal;