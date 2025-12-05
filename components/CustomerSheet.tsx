import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Customer, Column, CustomerStatus, ColumnType, Employee, AvatarConfig } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Plus, Trash2, Filter, UserPlus, X, Type, List, DollarSign, Calendar, Phone, UserCircle, ChevronDown, EyeOff, Eye } from 'lucide-react';
import CalendarModal from './CalendarModal';
import { motion, AnimatePresence } from 'framer-motion';


interface Props {
  customers: Customer[];
  columns: Column[];
  hiddenColumns: Record<CustomerStatus, string[]>;
  employees: Employee[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'created_at'>) => void;
  onUpdateCustomer: (customerId: string, updatedFields: Partial<Customer>) => void;
  onUpdateCustomerData: (customerId: string, field: string, value: any) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumns: (newColumns: Column[]) => void;
  onUpdateHiddenColumns: (newHiddenColumns: Record<CustomerStatus, string[]>) => void;
}

// Helper component for currency input, now fully controlled by parent for editing state
const CurrencyInput = ({ 
    value, 
    onChange, 
    onFocus, 
    onBlur 
}: { 
    value: any, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onFocus: () => void,
    onBlur: () => void,
}) => {
  const [isDomFocused, setIsDomFocused] = useState(false);

  const displayValue = isDomFocused 
    ? value 
    : value 
      ? Number(value).toLocaleString() 
      : '';

  return (
    <input
      type={isDomFocused ? "number" : "text"}
      className="w-full bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-right text-sm transition-colors shadow-sm"
      value={displayValue}
      onChange={onChange}
      onFocus={() => {
          onFocus();
          setIsDomFocused(true);
      }}
      onBlur={() => {
          onBlur();
          setIsDomFocused(false);
      }}
      placeholder="¥0"
    />
  );
};


// Simplified avatar for sheet view
const MiniAvatar = ({ config }: { config?: AvatarConfig }) => {
  if (!config) {
    return (
      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
        <UserCircle className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <rect x="0" y="85" width="100" height="35" fill={config.clothingColor} />
        <circle cx="50" cy="50" r="35" fill={config.skinColor} />
        <circle cx="50" cy="20" r="25" fill={config.hairColor} />
      </svg>
    </div>
  );
};


const CustomerSheet: React.FC<Props> = ({ customers, columns, hiddenColumns, employees, onAddCustomer, onUpdateCustomer, onUpdateCustomerData, onDeleteCustomer, onAddColumn, onDeleteColumn, onUpdateColumns, onUpdateHiddenColumns }) => {
  const [activeTab, setActiveTab] = useState<CustomerStatus | 'All'>('All');
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [isAddColExpanded, setIsAddColExpanded] = useState(false);
  
  // New Customer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerRep, setNewCustomerRep] = useState('');
  const [newCustomerStatus, setNewCustomerStatus] = useState<CustomerStatus>(CustomerStatus.NEGOTIATION);
  
  // Manage Option Modal State
  const [manageOptionsModal, setManageOptionsModal] = useState<{ customerId: string, columnId: string, columnTitle: string } | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');

  // Custom Scrollbar State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Cell Editing and Confirmation State
  const [editingCell, setEditingCell] = useState<{ customerId: string, field: string, value: any } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{ 
      onConfirm: () => void, 
      onCancel: () => void, 
      content: React.ReactNode,
      title?: string,
      confirmButtonText?: string,
      confirmButtonClass?: string,
  } | null>(null);
  const [calendarState, setCalendarState] = useState<{ customerId: string; field: string; initialDate: string | null; } | null>(null);
  
  // Accordion State
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Column Drag & Drop State
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  // Column Hiding State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; column: Column; } | null>(null);
  const [isHiddenListOpen, setIsHiddenListOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);

  const visibleColumns = useMemo(() => {
    if (activeTab === 'All' || !hiddenColumns || !hiddenColumns[activeTab]) {
      return sortedColumns;
    }
    const hiddenIds = new Set(hiddenColumns[activeTab]);
    return sortedColumns.filter(col => !hiddenIds.has(col.id));
  }, [sortedColumns, activeTab, hiddenColumns]);

  // Determine status order for sorting
  const statusOrder = useMemo(() => Object.values(CustomerStatus), []);

  const filteredCustomers = useMemo(() => {
    let result = activeTab === 'All'
      ? [...customers]
      : customers.filter(c => c.status === activeTab);

    if (activeTab === 'All') {
        result.sort((a, b) => {
            const indexA = statusOrder.indexOf(a.status);
            const indexB = statusOrder.indexOf(b.status);
            if (indexA !== indexB) return indexA - indexB;
            return a.id.localeCompare(b.id);
        });
    }
    return result;
  }, [customers, activeTab, statusOrder]);

  const handleAddColumn = () => {
    if (!newColName) return;
    const newCol: Column = {
      id: `col_${Date.now()}`,
      title: newColName,
      type: newColType,
      options: [],
      order: columns.length,
      removable: true,
    };
    onAddColumn(newCol);
    setNewColName('');
    setNewColType('text');
    setIsAddColExpanded(false);
  };
  
  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, column: Column) => {
    e.preventDefault();
    if (activeTab === 'All') return; // Cannot hide columns in 'All' view
    setContextMenu({ x: e.pageX, y: e.pageY, column });
  };

  const handleHideColumn = (columnId: string) => {
    if (activeTab === 'All') return;
    onUpdateHiddenColumns({
      ...hiddenColumns,
      [activeTab]: [...(hiddenColumns[activeTab] || []), columnId],
    });
    setContextMenu(null);
  };

  const handleShowColumn = (columnId: string) => {
    if (activeTab === 'All') return;
    onUpdateHiddenColumns({
      ...hiddenColumns,
      [activeTab]: (hiddenColumns[activeTab] || []).filter(id => id !== columnId),
    });
  };

  const hiddenForCurrentTab = useMemo(() => {
    if (activeTab === 'All' || !hiddenColumns || !hiddenColumns[activeTab]) return [];
    const hiddenIds = new Set(hiddenColumns[activeTab]);
    return columns.filter(c => hiddenIds.has(c.id));
  }, [activeTab, hiddenColumns, columns]);


  const handleDeleteColumnConfirmation = (columnId: string, columnTitle: string) => {
    setConfirmationModal({
      title: '列の削除の確認',
      content: (
        <>
          <p className="mt-2 text-sm text-gray-600">
            列「<span className="font-bold">{columnTitle}</span>」を本当に削除しますか？
          </p>
          <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800">
            <strong>警告:</strong> この操作を行うと、全ての顧客からこの列に関連するデータが完全に削除されます。
            <br />
            (この操作はヘッダーの「元に戻す」ボタンで取り消し可能です)
          </div>
        </>
      ),
      onConfirm: () => {
        onDeleteColumn(columnId);
        setConfirmationModal(null);
      },
      onCancel: () => {
        setConfirmationModal(null);
      },
      confirmButtonText: '削除する',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
    });
  };

  const handleAddCustomer = () => {
    if (!newCustomerName) return;
    
    // Create initial data object matching current columns
    const initialData: Record<string, any> = {};
    columns.forEach(col => {
      initialData[col.id] = '';
    });
    // Overwrite with form data
    initialData.sales_rep = newCustomerRep;
    
    const newCustomer: Omit<Customer, 'id' | 'created_at'> = {
      name: newCustomerName,
      status: newCustomerStatus,
      location: { 
        x: Math.random() * 80 + 10, 
        y: Math.random() * 80 + 10,
        lat: 34.3853 + (Math.random() - 0.5) * 0.1, 
        lng: 132.4553 + (Math.random() - 0.5) * 0.1
      },
      data: initialData,
    };
    
    onAddCustomer(newCustomer);
    setIsModalOpen(false);
    setNewCustomerName('');
    setNewCustomerRep('');
    setNewCustomerStatus(CustomerStatus.NEGOTIATION);
  };

  // --- Cell Editing Logic ---
  const handleCellFocus = (customerId: string, field: string) => {
    // If clicking a different cell, blur the previous one
    if (editingCell && (editingCell.customerId !== customerId || editingCell.field !== field)) {
      // NOTE: handleCellBlur will be called automatically by the blur event of the previous input
    }
    const customer = customers.find(c => c.id === customerId);
    setEditingCell({ customerId, field, value: customer?.data[field] ?? '' });
  };

  const handleCellValueChange = (newValue: any) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: newValue });
    }
  };
  
  const triggerConfirmation = (customerId: string, field: string, newValue: any) => {
    if (confirmationModal) return;

    const customer = customers.find(c => c.id === customerId);
    const oldValue = customer?.data[field] ?? '';
    
    const col = columns.find(c => c.id === field);
    let isChanged = false;

    if (col?.type === 'currency') {
      const oldNum = Number(oldValue) || 0;
      const newNum = Number(String(newValue).replace(/,/g, '')) || 0;
      isChanged = oldNum !== newNum;
    } else {
      isChanged = String(newValue) !== String(oldValue);
    }
    
    if (!isChanged) {
        setEditingCell(null);
        return;
    }

    // Direct update without confirmation for smoother experience in this version
    // Can enable confirmation for specific critical fields if needed
    let finalValue = newValue;
    if (col?.type === 'currency') {
      finalValue = Number(String(newValue).replace(/,/g, '')) || 0;
    }
    onUpdateCustomerData(customerId, field, finalValue);
    setEditingCell(null);
  };

  const handleCellBlur = () => {
    if (!editingCell) return;
    const { customerId, field, value } = editingCell;
    triggerConfirmation(customerId, field, value);
  };
  
  const handleDiscreteChange = (customerId: string, field: string, newValue: any) => {
    // Immediate update for discrete values (select, date picker)
    onUpdateCustomerData(customerId, field, newValue);
    setEditingCell(null);
  };
  
  const handleAddOptionSubmit = () => {
    if (!manageOptionsModal || !newOptionValue.trim()) return;
    
    const trimmed = newOptionValue.trim();
    const { customerId, columnId } = manageOptionsModal;
    
    const newColumns = columns.map(c => 
        c.id === columnId 
            ? { ...c, options: [...(c.options || []), trimmed] } 
            : c
    );
    onUpdateColumns(newColumns);
    
    handleDiscreteChange(customerId, columnId, trimmed);
    
    // Close modal after adding and selecting
    setManageOptionsModal(null);
    setNewOptionValue('');
  };

  const handleDeleteOption = (columnId: string, optionToDelete: string) => {
    setConfirmationModal(null); // Close confirmation modal if open
  
    // Update columns by removing the option
    const newColumns = columns.map(c => {
      if (c.id === columnId) {
        const newOptions = (c.options || []).filter(opt => opt !== optionToDelete);
        return { ...c, options: newOptions };
      }
      return c;
    });
    onUpdateColumns(newColumns);
  
    // Update customers who were using the deleted option
    customers.forEach(customer => {
      if (customer.data[columnId] === optionToDelete) {
        onUpdateCustomerData(customer.id, columnId, ''); // Reset the value
      }
    });
  };
  
  const handleDeleteOptionRequest = (columnId: string, optionToDelete: string) => {
    const customersUsingOption = customers.filter(c => c.data[columnId] === optionToDelete);
  
    if (customersUsingOption.length > 0) {
      setConfirmationModal({
        title: '選択肢の削除の確認',
        content: (
          <>
            <p className="mt-2 text-sm text-gray-600">
              選択肢「<span className="font-bold">{optionToDelete}</span>」を削除しますか？
            </p>
            <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800">
              <strong>警告:</strong> {customersUsingOption.length}件の顧客がこの選択肢を使用しています。
              <br />
              削除すると、これらの顧客の該当データはクリア（未選択の状態に）されます。
            </div>
          </>
        ),
        onConfirm: () => handleDeleteOption(columnId, optionToDelete),
        onCancel: () => setConfirmationModal(null),
        confirmButtonText: '削除する',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700'
      });
    } else {
      // No confirmation needed if not in use
      handleDeleteOption(columnId, optionToDelete);
    }
  };


  const handleStatusChangeRequest = (customer: Customer, newStatus: CustomerStatus) => {
    if (customer.status === newStatus) {
        setExpandedRowId(null);
        return;
    }

    setConfirmationModal({
        title: 'ステータス変更の確認',
        content: (
            <>
                <p className="mt-2 text-sm text-gray-600">
                    <span className="font-bold">{customer.name}様</span>のステータスを変更しますか？
                </p>
                <div className="mt-4 bg-gray-50 p-3 rounded-lg border text-sm space-y-1">
                    <p>
                        <span className="font-medium text-gray-500">変更前:</span>{' '}
                        <span className={`font-semibold ${STATUS_CONFIG[customer.status].text}`}>{customer.status}</span>
                    </p>
                    <p>
                        <span className="font-medium text-gray-500">変更後:</span>{' '}
                        <span className={`font-semibold ${STATUS_CONFIG[newStatus].text}`}>{newStatus}</span>
                    </p>
                </div>
            </>
        ),
        onConfirm: () => {
            onUpdateCustomer(customer.id, { status: newStatus });
            setConfirmationModal(null);
            setExpandedRowId(null);
        },
        onCancel: () => {
            setConfirmationModal(null);
        },
        confirmButtonText: '変更する',
        confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
    });
  };

  const handleDeleteCustomerRequest = (customer: Customer) => {
    setConfirmationModal({
        title: '顧客の削除',
        content: (
            <p className="mt-2 text-sm text-gray-600">
                <span className="font-bold">{customer.name}様</span>のデータを削除しますか？
            </p>
        ),
        onConfirm: () => showFinalDeleteConfirmation(customer),
        onCancel: () => setConfirmationModal(null),
        confirmButtonText: '削除する',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700',
    });
  };

  const showFinalDeleteConfirmation = (customer: Customer) => {
    setConfirmationModal({
        title: '最終確認',
        content: (
            <>
                <p className="mt-2 text-sm text-gray-600">
                    この操作は元に戻せません。
                </p>
                <p className="font-bold text-red-700 mt-1">
                    本当に{customer.name}様のデータを完全に削除しますか？
                </p>
            </>
        ),
        onConfirm: () => {
            onDeleteCustomer(customer.id);
            setConfirmationModal(null);
            setExpandedRowId(null);
        },
        onCancel: () => setConfirmationModal(null),
        confirmButtonText: '完全に削除する',
        confirmButtonClass: 'bg-red-800 hover:bg-red-900',
    });
  };

  const getEmployeeOptions = (columnId: string) => {
      let role = '';
      if (columnId === 'sales_rep') role = '営業';
      if (columnId === 'architect') role = '設計';
      if (columnId === 'ic') role = 'IC';
      if (columnId === 'drawing_rep') role = '設計';
      if (columnId === 'application_rep') role = 'その他';
      if (columnId === 'construction_rep') role = '工務';
      
      return employees.filter(e => role ? e.role === role : true);
  };

  // --- Column Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggingColumnId(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnIndex: number) => {
    e.preventDefault();
    if (!draggingColumnId) return;
    
    setDropTargetIndex(columnIndex);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingColumnId(null);
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggingColumnId || dropIndex === null) {
      handleDragEnd();
      return;
    }

    const startIndex = sortedColumns.findIndex(c => c.id === draggingColumnId);

    const newColumnsOrder = Array.from(sortedColumns);
    const [removed] = newColumnsOrder.splice(startIndex, 1);
    newColumnsOrder.splice(dropIndex, 0, removed);

    const finalColumns = columns.map(col => ({
      ...col,
      order: newColumnsOrder.findIndex((c: Column) => c.id === col.id),
    }));

    onUpdateColumns(finalColumns);
    handleDragEnd();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b bg-gray-50 p-2 space-x-2 overscroll-x-contain">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'All' ? 'bg-white shadow border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          全ての顧客
        </button>
        {Object.values(CustomerStatus).map(status => {
          const style = STATUS_CONFIG[status];
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? `bg-white shadow border-b-2 ${style.border} ${style.text}`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-500">
             <Filter className="w-4 h-4" />
             <span className="text-sm">{filteredCustomers.length} 件</span>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>新規顧客登録</span>
          </button>
        </div>

        <div className="flex items-center">
           {!isAddColExpanded ? (
               <button 
                 onClick={() => setIsAddColExpanded(true)}
                 className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-colors text-sm"
               >
                 <Plus className="w-4 h-4" />
                 <span>項目追加</span>
               </button>
           ) : (
                <div className="flex items-center flex-wrap gap-2 bg-gray-50 p-1.5 rounded-md border animate-in fade-in slide-in-from-right-2 duration-200">
                    <select
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value as ColumnType)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="text">テキスト</option>
                        <option value="select">リスト</option>
                        <option value="currency">金額</option>
                        <option value="date">日付</option>
                        <option value="phone">電話番号</option>
                    </select>
                    <input
                        type="text"
                        placeholder="項目名"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 bg-white"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                    />
                    <div className="flex items-center self-stretch ml-auto">
                        <div className="h-full w-px bg-gray-300 mx-2"></div>
                        <button 
                            onClick={handleAddColumn} 
                            disabled={!newColName}
                            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="追加"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setIsAddColExpanded(false); setNewColName(''); setNewColType('text'); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                            title="キャンセル"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
           )}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto overscroll-contain bg-white" ref={scrollContainerRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-30 will-change-transform">
            <tr>
              <th className="px-2 py-2 lg:px-4 lg:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-40 border-r border-gray-200 will-change-transform h-10 shadow-sm">
                顧客名
              </th>
              {visibleColumns.map((col, colIndex) => (
                <th 
                  key={col.id} 
                  className={`px-2 py-2 lg:px-4 lg:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap group min-w-[150px] h-10 relative transition-opacity ${
                    draggingColumnId === col.id ? 'opacity-40' : ''
                  }`}
                  draggable={activeTab === 'All'}
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onDragOver={(e) => handleDragOver(e, colIndex)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, colIndex)}
                  onContextMenu={(e) => handleContextMenu(e, col)}
                >
                  {dropTargetIndex === colIndex && (
                    <div className="absolute top-0 bottom-0 -left-0.5 w-1 bg-blue-500 rounded-full z-50" />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        {col.type === 'currency' && <DollarSign className="w-3 h-3 text-gray-400" />}
                        {col.type === 'date' && <Calendar className="w-3 h-3 text-gray-400" />}
                        {col.type === 'phone' && <Phone className="w-3 h-3 text-gray-400" />}
                        {col.type === 'select' && <List className="w-3 h-3 text-gray-400" />}
                        {col.type === 'text' && <Type className="w-3 h-3 text-gray-400" />}
                        <span>{col.title}</span>
                    </div>
                    {col.removable && (
                      <button
                        onClick={() => handleDeleteColumnConfirmation(col.id, col.title)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
               <React.Fragment key={customer.id}>
                  <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, type: "spring", bounce: 0.2 }}
                      className={`${STATUS_CONFIG[customer.status].row} transition-colors relative`}
                      style={{ zIndex: expandedRowId === customer.id ? 20 : 1 }}
                  >
                  <td className={`px-2 py-2 lg:px-4 lg:py-2 whitespace-nowrap sticky left-0 z-20 border-r border-black/5 will-change-transform ${STATUS_CONFIG[customer.status].bg}`}>
                      <div className="flex flex-row items-center space-x-2">
                          <button
                              onClick={() => setExpandedRowId(expandedRowId === customer.id ? null : customer.id)}
                              className={`w-28 text-center text-[10px] p-1 rounded-full border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-between ${STATUS_CONFIG[customer.status].badge}`}
                          >
                              <span>{customer.status}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedRowId === customer.id ? 'rotate-180' : ''}`} />
                          </button>
                      <span className="text-sm font-bold text-gray-900 truncate">{customer.name}</span>
                      </div>
                  </td>
                  {visibleColumns.map(col => {
                      const isEditing = editingCell?.customerId === customer.id && editingCell?.field === col.id;
                      // Fallback to empty string to ensure controlled input
                      const valueToShow = isEditing ? editingCell.value : (customer.data[col.id] ?? '');
                      const isLocationEmpty = col.id === 'location' && !valueToShow;

                      return (
                      <td key={col.id} className="px-2 py-2 lg:px-4 lg:py-2 whitespace-nowrap text-sm text-gray-600">
                          {col.type === 'currency' ? (
                          <CurrencyInput
                              value={valueToShow}
                              onChange={(e) => handleCellValueChange(e.target.value)}
                              onFocus={() => handleCellFocus(customer.id, col.id)}
                              onBlur={handleCellBlur}
                          />
                          ) : col.type === 'date' ? (
                          <button
                              onClick={() => setCalendarState({ 
                                  customerId: customer.id, 
                                  field: col.id, 
                                  initialDate: customer.data[col.id] ?? null 
                              })}
                              className="w-full text-left bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-sm shadow-sm"
                          >
                              {(customer.data[col.id] ?? '') || <span className="text-gray-400">日付未設定</span>}
                          </button>
                          ) : col.type === 'person' ? (
                              <div className="flex items-center space-x-2">
                              <MiniAvatar config={employees.find(e => e.name === valueToShow)?.avatar} />
                              <select
                                  value={valueToShow}
                                  onFocus={() => handleCellFocus(customer.id, col.id)}
                                  onChange={(e) => handleDiscreteChange(customer.id, col.id, e.target.value)}
                                  className="w-full bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-sm shadow-sm"
                              >
                                  <option value="">-</option>
                                  {getEmployeeOptions(col.id).map(emp => (
                                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                                  ))}
                              </select>
                              </div>
                          ) : col.type === 'select' ? (
                              <select
                              value={valueToShow}
                              onFocus={() => handleCellFocus(customer.id, col.id)}
                              onChange={(e) => {
                                  if (e.target.value === '__ADD_NEW__') {
                                      setManageOptionsModal({ 
                                          customerId: customer.id, 
                                          columnId: col.id,
                                          columnTitle: col.title
                                      });
                                      setNewOptionValue('');
                                      e.target.blur();
                                  } else {
                                      handleDiscreteChange(customer.id, col.id, e.target.value);
                                  }
                              }}
                              className="w-full bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-sm shadow-sm"
                              >
                                  <option value="">-</option>
                                  {col.options?.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="__ADD_NEW__" className="text-blue-600 font-bold bg-blue-50">+ 選択肢を管理...</option>
                              </select>
                          ) : col.type === 'phone' ? (
                              <input
                              type="tel"
                              className="w-full bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-sm shadow-sm"
                              value={valueToShow}
                              onFocus={() => handleCellFocus(customer.id, col.id)}
                              onChange={(e) => handleCellValueChange(e.target.value)}
                              onBlur={handleCellBlur}
                              placeholder="090-0000-0000"
                          />
                          ) : (
                          <input
                              type="text"
                              className={`w-full bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 border border-gray-300 hover:border-blue-400 text-sm shadow-sm ${isLocationEmpty ? 'blink-warning-bg border-red-300' : ''}`}
                              value={valueToShow}
                              onFocus={() => handleCellFocus(customer.id, col.id)}
                              onChange={(e) => handleCellValueChange(e.target.value)}
                              onBlur={handleCellBlur}
                          />
                          )}
                      </td>
                      )
                  })}
                  </motion.tr>
                  <AnimatePresence>
                      {expandedRowId === customer.id && (
                      <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-white"
                      >
                          <td colSpan={visibleColumns.length + 1} className="p-0">
                              <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                              >
                                  <div className="p-3 bg-slate-50 border-x border-b border-slate-200">
                                      <h4 className="text-xs font-bold text-slate-600 mb-2">ステータスを変更</h4>
                                      <div className="flex flex-wrap gap-2">
                                          {Object.values(CustomerStatus).map(status => (
                                              <button
                                                  key={status}
                                                  onClick={() => handleStatusChangeRequest(customer, status)}
                                                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                                      customer.status === status
                                                      ? `${STATUS_CONFIG[status].badge} font-bold ring-2 ring-offset-1 ${STATUS_CONFIG[status].border}`
                                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                                                  }`}
                                              >
                                                  {status}
                                              </button>
                                          ))}
                                      </div>
                                      <div className="border-t my-3 border-slate-200"></div>
                                      <button 
                                          onClick={() => handleDeleteCustomerRequest(customer)}
                                          className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 font-medium rounded-md flex items-center space-x-2 transition-colors"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                          <span>この顧客を削除する</span>
                                      </button>
                                  </div>
                              </motion.div>
                          </td>
                      </motion.tr>
                      )}
                  </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-800">{confirmationModal.title || '確認'}</h3>
                      {confirmationModal.content}
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                      <button
                          onClick={confirmationModal.onCancel}
                          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                      >
                          キャンセル
                      </button>
                      <button
                          onClick={confirmationModal.onConfirm}
                          className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${confirmationModal.confirmButtonClass || 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                          {confirmationModal.confirmButtonText || 'OK'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Context Menu for Hiding Columns */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-60 text-sm animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="p-3">
            <p className="text-gray-600">「<span className="font-bold">{contextMenu.column.title}</span>」を非表示にしますか？</p>
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t flex justify-end space-x-2">
            <button onClick={() => setContextMenu(null)} className="px-3 py-1 hover:bg-gray-200 rounded">いいえ</button>
            <button onClick={() => handleHideColumn(contextMenu.column.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">はい</button>
          </div>
          <div className="border-t p-1">
            <button
                onClick={() => {
                    setIsHiddenListOpen(true);
                    setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 text-blue-700 flex items-center space-x-2"
            >
                <EyeOff className="w-4 h-4" />
                <span>非表示リストの管理</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden Columns Management Modal */}
      {isHiddenListOpen && activeTab !== 'All' && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">非表示の項目 ({activeTab})</h3>
                    <button onClick={() => setIsHiddenListOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 max-h-80 overflow-y-auto">
                    {hiddenForCurrentTab.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">非表示の項目はありません。</p>
                    ) : (
                        <ul className="space-y-2">
                            {hiddenForCurrentTab.map(col => (
                                <li key={col.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-gray-800">{col.title}</span>
                                    <button 
                                        onClick={() => handleShowColumn(col.id)}
                                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>元に戻す</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button 
                        onClick={() => setIsHiddenListOpen(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Manage Options Modal */}
      {manageOptionsModal && (() => {
          const column = columns.find(c => c.id === manageOptionsModal.columnId);
          const currentOptions = column?.options || [];
          return (
            <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">「{manageOptionsModal.columnTitle}」の選択肢を管理</h3>
                        <button onClick={() => setManageOptionsModal(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-gray-600 mb-2">既存の選択肢</h4>
                            <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-1">
                                {currentOptions.length > 0 ? currentOptions.map(opt => (
                                    <div key={opt} className="flex items-center justify-between p-2 bg-white rounded-md">
                                        <span className="text-sm text-gray-800">{opt}</span>
                                        <button 
                                            onClick={() => handleDeleteOptionRequest(manageOptionsModal.columnId, opt)}
                                            className="text-red-400 hover:text-red-600"
                                            title="削除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : <p className="text-sm text-gray-500 text-center py-2">選択肢はありません。</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-600 mb-2">新しい選択肢を追加</h4>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    value={newOptionValue}
                                    onChange={e => setNewOptionValue(e.target.value)}
                                    className="flex-grow border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    placeholder="新しい選択肢を入力"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddOptionSubmit()}
                                />
                                <button
                                  onClick={handleAddOptionSubmit}
                                  disabled={!newOptionValue.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                  追加
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">追加すると、この顧客の項目が自動で選択されます。</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                        <button 
                            onClick={() => setManageOptionsModal(null)}
                            className="px-4 py-2 bg-white text-gray-700 border rounded-lg text-sm font-medium hover:bg-gray-100"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
          );
      })()}


      {/* Add Customer Modal */}
      {isModalOpen && (
        <div 
          className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">新規顧客登録</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">顧客名 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  placeholder="例: 山田 太郎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">営業担当</label>
                <select
                  value={newCustomerRep}
                  onChange={e => setNewCustomerRep(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">担当者を選択</option>
                  {employees.filter(e => e.role === '営業').map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステイタス</label>
                <select 
                  value={newCustomerStatus}
                  onChange={e => setNewCustomerStatus(e.target.value as CustomerStatus)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  {Object.values(CustomerStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleAddCustomer}
                disabled={!newCustomerName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                登録する
              </button>
            </div>
          </div>
        </div>
      )}
      <CalendarModal
        isOpen={!!calendarState}
        onClose={() => setCalendarState(null)}
        initialDate={calendarState?.initialDate}
        onSelectDate={(date) => {
          if (calendarState) {
            handleDiscreteChange(calendarState.customerId, calendarState.field, date || '');
          }
          setCalendarState(null);
        }}
      />
    </div>
  );
};

export default CustomerSheet;