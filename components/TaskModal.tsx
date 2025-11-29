import React, { useState, useEffect, useRef } from 'react';
import { Customer, Task, TemplateTask } from '../types';
import { X, Check, Sparkles, CopyPlus, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Celebration from './Celebration';

interface Props {
  customer: Customer | null;
  tasks: Task[];
  templateTasks: TemplateTask[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  onDeleteTask: (taskId: string) => void;
}

// A wrapper for task items to handle touch sensitivity on mobile.
interface TouchableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const TouchableTaskItem: React.FC<TouchableTaskItemProps> = ({ task, onToggle, onContextMenu, children }) => {
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const threshold = 20;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      touchStartPos.current = null; 
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartPos.current) {
       // Logic handled by onClick
    }
    touchStartPos.current = null;
  };

  return (
    <div
      onClick={onToggle}
      onContextMenu={onContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`
        flex items-center justify-between p-4 rounded-lg cursor-pointer border transition-all h-full select-none relative group
        ${task.isCompleted
            ? 'bg-blue-50 border-blue-200 opacity-70'
            : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300'
        }
      `}
    >
      {children}
    </div>
  );
};


const TaskModal: React.FC<Props> = ({ customer, tasks, templateTasks, onClose, onUpdateTask, onAddTask, onDeleteTask }) => {
  const [celebrationTaskTitle, setCelebrationTaskTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('営業');
  
  // State for deletion confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ task: Task } | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!customer) return null;

  const customerTasks = tasks.filter(t => t.customerId === customer.id);
  const progress = customerTasks.length > 0 
    ? Math.round((customerTasks.filter(t => t.isCompleted).length / customerTasks.length) * 100) 
    : 0;

  const toggleTask = (taskId: string, isMilestone: boolean, title: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    onUpdateTask(taskId, { isCompleted: !task.isCompleted });

    if (!task.isCompleted && isMilestone) {
      setCelebrationTaskTitle(title);
      setTimeout(() => setCelebrationTaskTitle(null), 3500);
    }
  };
  
  const handleInsertTemplates = () => {
      let addedCount = 0;
      
      templateTasks.forEach((tmpl) => {
          const exists = customerTasks.some(t => t.title === tmpl.title && t.category === tmpl.category);
          if (!exists) {
              const newTask: Omit<Task, 'id' | 'created_at'> = {
                  customerId: customer.id,
                  category: tmpl.category,
                  title: tmpl.title,
                  isCompleted: false,
                  isMilestone: tmpl.isMilestone,
              };
              onAddTask(newTask);
              addedCount++;
          }
      });
      
      if (addedCount > 0) {
          setToast({ message: `${addedCount}件のひな形タスクを追加しました`, type: 'success' });
      } else {
          setToast({ message: '追加できる新しいタスクはありませんでした', type: 'info' });
      }
  };
  
  const handleRightClickTask = (e: React.MouseEvent, task: Task) => {
      e.preventDefault();
      setDeleteConfirmation({ task });
  };
  
  const confirmDelete = () => {
      if (deleteConfirmation) {
          onDeleteTask(deleteConfirmation.task.id);
          setDeleteConfirmation(null);
          setToast({ message: 'タスクを削除しました', type: 'info' });
      }
  };

  const categories = ['営業', '設計', '申請', '工務'];
  
  const currentTabTasks = customerTasks.filter(t => t.category === activeTab);

  return (
    <AnimatePresence>
      {customer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full max-w-7xl h-full bg-white shadow-2xl overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {celebrationTaskTitle && <Celebration taskTitle={celebrationTaskTitle} />}

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full shadow-lg text-white text-sm font-medium flex items-center space-x-2 ${
                            toast.type === 'success' ? 'bg-green-600' : 'bg-slate-700'
                        }`}
                    >
                        {toast.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative flex-shrink-0">
               <div className="absolute top-0 right-0 p-4">
                   <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                       <X className="w-6 h-6" />
                   </button>
               </div>
               <h2 className="text-2xl font-bold">{customer.name} 様</h2>
               <p className="text-slate-400 text-sm mt-1">{customer.data.location}</p>
               
               <div className="mt-6">
                   <div className="flex justify-between text-xs mb-2">
                       <span>進捗率</span>
                       <span>{progress}%</span>
                   </div>
                   <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                       <div 
                          className="bg-blue-500 h-full transition-all duration-500" 
                          style={{ width: `${progress}%` }} 
                       />
                   </div>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 border-b border-gray-200 flex-shrink-0">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`flex-1 py-4 text-sm font-bold text-center border-b-4 transition-colors ${
                            activeTab === cat 
                            ? 'border-blue-500 text-blue-600 bg-white' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'
                        }`}
                    >
                        {cat}
                        <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {customerTasks.filter(t => t.category === cat).length}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* Toolbar */}
             <div className="bg-white border-b px-6 py-2 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                      ※タスクを右クリックで削除できます
                  </div>
                  <button 
                      onClick={handleInsertTemplates}
                      className="flex items-center space-x-2 text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors shadow-sm"
                  >
                      <CopyPlus className="w-4 h-4" />
                      <span>ひな形を挿入</span>
                  </button>
             </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 overscroll-y-contain">
              
              {customerTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                      <p className="text-gray-500 mb-4">タスクがまだ登録されていません。</p>
                      <div className="flex justify-center">
                          <button 
                              onClick={handleInsertTemplates}
                              className="flex items-center space-x-2 bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                              <CopyPlus className="w-4 h-4" />
                              <span>ひな形を挿入</span>
                          </button>
                      </div>
                  </div>
              )}

              {customerTasks.length > 0 && currentTabTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <p>このカテゴリーのタスクはありません</p>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                  {currentTabTasks.map(task => (
                      <TouchableTaskItem 
                          key={task.id}
                          task={task}
                          onToggle={() => toggleTask(task.id, task.isMilestone, task.title)}
                          onContextMenu={(e) => handleRightClickTask(e, task)}
                      >
                          <div className="flex items-center space-x-3 w-full overflow-hidden">
                              <div className={`
                                  w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                                  ${task.isCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                              `}>
                                  {task.isCompleted && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <span className={`text-sm truncate flex-grow ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {task.title}
                              </span>
                          </div>
                          {task.isMilestone && (
                              <Sparkles className={`w-5 h-5 flex-shrink-0 ml-2 ${task.isCompleted ? 'text-yellow-400' : 'text-gray-300'}`} />
                          )}
                      </TouchableTaskItem>
                  ))}
              </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="absolute inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div 
                        className="bg-white rounded-lg shadow-xl border p-6 w-full max-w-sm animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                            <Trash2 className="w-5 h-5 mr-2 text-red-500" />
                            タスクの削除
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                            「{deleteConfirmation.task.title}」を削除してもよろしいですか？
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                            >
                                キャンセル
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;