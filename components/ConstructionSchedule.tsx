import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Customer } from '../types';
import { HardHat } from 'lucide-react';

interface Props {
  customers: Customer[];
  onUpdateCustomer: (customerId: string, updatedFields: Partial<Customer>) => void;
  onCustomerClick: (customer: Customer) => void;
}

const OFFICES = [
  { name: '三篠', rows: 4 },
  { name: '廿日市', rows: 4 },
  { name: '下松', rows: 2 },
  { name: '東広島', rows: 2 },
];
const TOTAL_ROWS = OFFICES.reduce((sum, office) => sum + office.rows, 0);
const OFFICE_COL_WIDTH_CLASS = 'w-16';

const SALES_REP_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-600', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const ConstructionSchedule: React.FC<Props> = ({ customers, onUpdateCustomer, onCustomerClick }) => {
  const [grid, setGrid] = useState<(Customer | null)[][]>([]);
  const [draggedItem, setDraggedItem] = useState<{ customer: Customer; from: { row: number; col: number } } | null>(null);
  const [dropTarget, setDropTarget] = useState<{row: number, col: number} | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: React.ReactNode; onConfirm: () => void; } | null>(null);
  const wasDragged = useRef(false);

  const { months, surnameCounts } = useMemo(() => {
    // 1. Generate timeline of 24 months
    const startDate = new Date();
    startDate.setDate(1);
    const months = Array.from({ length: 24 }).map((_, i) => {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      return monthDate;
    });
    
    // 2. Count surname occurrences
    const surnameCounts = new Map<string, number>();
    customers.forEach(c => {
        const surname = c.name.split(' ')[0];
        surnameCounts.set(surname, (surnameCounts.get(surname) || 0) + 1);
    });
    
    return { months, surnameCounts };
  }, [customers]);

  const monthsByYear = useMemo(() => {
    // FIX: Refactored from .reduce to a for...of loop to avoid potential type inference issues in some TypeScript environments, which was causing `yearMonths` to be of type `unknown`.
    const acc: Record<number, Date[]> = {};
    for (const month of months) {
      const year = month.getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(month);
    }
    return acc;
  }, [months]);
  
  // FIX: Replaced generic type argument on reduce with a typed accumulator parameter for better environment compatibility.
  const salesRepColorMap = useMemo(() => {
    // FIX: Refactored to use map and filter for improved type safety and readability. 
    // This resolves a potential issue where `reduce` could lead to `unknown` type inference in some TypeScript environments.
    // FIX: Explicitly cast the result of filter to string[] to resolve incorrect type inference of 'unknown[]'.
    const uniqueSalesReps = [...new Set(
      customers
        .map(c => c.data.sales_rep)
        .filter((rep): rep is string => typeof rep === 'string' && !!rep) as string[]
    )].sort();
    
    const colorMap = new Map<string, string>();
    uniqueSalesReps.forEach((rep, index) => {
      colorMap.set(rep, SALES_REP_COLORS[index % SALES_REP_COLORS.length]);
    });
    return colorMap;
  }, [customers]);

  useEffect(() => {
    const newGrid: (Customer | null)[][] = Array.from({ length: TOTAL_ROWS }, () => Array(24).fill(null));
    const designDuration = 90;

    const projects = customers
      .filter(c => c.data.contract_date)
      .map(customer => {
        const contractDate = new Date(customer.data.contract_date + 'T00:00:00');
        const constructionStartDate = new Date(contractDate);
        constructionStartDate.setDate(constructionStartDate.getDate() + designDuration);
        
        const startMonth = constructionStartDate.getMonth();
        const startYear = constructionStartDate.getFullYear();
        const monthDiff = (startYear - months[0].getFullYear()) * 12 + (startMonth - months[0].getMonth());
        
        return { ...customer, startMonthIndex: monthDiff };
      })
      .filter(p => p.startMonthIndex >= 0 && p.startMonthIndex < 24)
      .sort((a, b) => new Date(a.data.contract_date).getTime() - new Date(b.data.contract_date).getTime());

    for (const project of projects) {
        for (let i = 0; i < TOTAL_ROWS; i++) {
            if (newGrid[i][project.startMonthIndex] === null) {
                newGrid[i][project.startMonthIndex] = project;
                break;
            }
        }
    }
    setGrid(newGrid);
  }, [customers, months]);

  const handleDragStart = (e: React.DragEvent, customer: Customer, fromRow: number, fromCol: number) => {
    wasDragged.current = true;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', customer.id);
    setDraggedItem({ customer, from: { row: fromRow, col: fromCol } });
    e.currentTarget.classList.add('opacity-50', 'scale-95', 'shadow-2xl');
  };

  const handleDragOver = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();
    if (draggedItem && (!grid[toRow] || !grid[toRow][toCol])) {
        setDropTarget({row: toRow, col: toCol});
        e.dataTransfer.dropEffect = 'move';
    } else {
        e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  }

  const handleDrop = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedItem) return;
    if (grid[toRow] && grid[toRow][toCol]) return;

    const { customer, from } = draggedItem;
    const newMonth = months[toCol];
    const oldMonth = months[from.col];

    const onConfirm = () => {
      const designDuration = 90;
      const newConstructionStartDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
      const newContractDate = new Date(newConstructionStartDate);
      newContractDate.setDate(newContractDate.getDate() - designDuration);

      const y = newContractDate.getFullYear();
      const m = String(newContractDate.getMonth() + 1).padStart(2, '0');
      const d = String(newContractDate.getDate()).padStart(2, '0');
      const newContractDateString = `${y}-${m}-${d}`;

      onUpdateCustomer(customer.id, {
          data: { contract_date: newContractDateString }
      });
      setConfirmation(null);
    };
    
    setConfirmation({
      message: (
        <>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-bold">{customer.name}様</span> の着工スケジュールを変更しますか？
          </p>
          <div className="mt-4 bg-gray-50 p-3 rounded-lg border text-sm space-y-1">
            <p><span className="font-medium text-gray-500">変更前:</span> <span className="font-semibold text-red-600">{oldMonth.getFullYear()}年 {oldMonth.getMonth() + 1}月</span></p>
            <p><span className="font-medium text-gray-500">変更後:</span> <span className="font-semibold text-green-600">{newMonth.getFullYear()}年 {newMonth.getMonth() + 1}月</span></p>
          </div>
        </>
      ),
      onConfirm: onConfirm
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-95', 'shadow-2xl');
    setDraggedItem(null);
    setDropTarget(null);
    setTimeout(() => {
      wasDragged.current = false;
    }, 0);
  };
  
  const handleClick = (customer: Customer) => {
    if (wasDragged.current) {
      return;
    }
    onCustomerClick(customer);
  };

  const today = new Date();

  const officeBoundaries = useMemo(() => {
    let cumulativeRows = 0;
    return OFFICES.map(office => {
        const start = cumulativeRows;
        cumulativeRows += office.rows;
        return { ...office, start };
    });
  }, []);
  
  const renderName = (customer: Customer) => {
    const [surname, givenName] = customer.name.split(' ');
    const COMMON_SURNAMES = ['佐藤', '鈴木', '田中'];
    const isCommon = COMMON_SURNAMES.includes(surname);
    const isDuplicate = (surnameCounts.get(surname) || 0) > 1;

    if ((isCommon || isDuplicate) && givenName) {
        return (
            <div className="flex flex-col items-center justify-center leading-tight text-center">
                <div className="flex items-baseline">
                    <span className="text-sm font-bold">{surname}</span>
                    <span className="text-[10px] ml-0.5 font-normal">様</span>
                </div>
                <span className="text-[9px] opacity-80">{givenName}</span>
            </div>
        );
    } else {
        return (
            <div className="flex items-baseline">
                <span className="text-base font-bold">{surname}</span>
                <span className="text-xs ml-1 font-normal">様</span>
            </div>
        );
    }
  };

  const getColorForCustomer = (customer: Customer) => {
    const rep = customer.data.sales_rep;
    if (!rep) return 'bg-slate-400';
    return salesRepColorMap.get(rep as string) || 'bg-slate-400';
  }
  
  return (
    <div className="h-full bg-white rounded-lg shadow-sm flex flex-col relative">
        <div className="p-4 border-b bg-gray-50 flex-shrink-0 flex items-center justify-between flex-wrap">
            <div className="flex items-center">
              <HardHat className="w-6 h-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">着工スケジュール</h2>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              {[...salesRepColorMap.entries()].map(([rep, colorClass]) => (
                <div key={rep} className="flex items-center space-x-1.5">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                  <span className="text-xs text-gray-600">{rep.split(' ')[0]}</span>
                </div>
              ))}
            </div>
        </div>
        <div className="flex-1 overflow-x-auto p-4">
            <table className="h-full border-collapse table-fixed" style={{ width: '180%' }}>
              <thead>
                {/* Year Row */}
                <tr className="bg-gray-50">
                  <th className={`sticky left-0 bg-gray-50 z-30 ${OFFICE_COL_WIDTH_CLASS} border-r border-b border-gray-200`}></th>
                  {Object.entries(monthsByYear).map(([year, yearMonths]) => (
                    <th 
                      key={year}
                      colSpan={(yearMonths as Date[]).length}
                      className="p-1 border-b border-r border-gray-200 text-center font-bold text-sm text-gray-700"
                    >
                      {year}年
                    </th>
                  ))}
                </tr>
                {/* Month Row */}
                <tr className="bg-gray-50">
                  <th className={`sticky left-0 bg-gray-50 z-30 ${OFFICE_COL_WIDTH_CLASS} border-r border-gray-200`}></th>
                  {months.map((month, i) => {
                    const isJanuary = month.getMonth() === 0;
                    return (
                        <th 
                        key={i} 
                        className={`p-1 border-r border-b border-gray-200 text-center font-semibold text-xs text-gray-600 ${
                            month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth() 
                            ? 'bg-blue-100 text-blue-700' 
                            : ''
                        } ${isJanuary && i > 0 ? 'border-l-2 border-l-red-400' : ''}`}
                        >
                          {month.getMonth() + 1}月
                        </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white">
                {grid.map((row, rowIndex) => {
                  const officeInfo = officeBoundaries.find(o => o.start === rowIndex);
                  const isLastRowOfOffice = officeBoundaries.some(o => rowIndex === o.start + o.rows - 1 && rowIndex !== TOTAL_ROWS - 1);
                  return (
                    <tr key={rowIndex} className={`h-12 ${isLastRowOfOffice ? 'border-b-2 border-b-slate-400' : 'border-b border-gray-100'}`}>
                       {officeInfo && (
                        <td
                          rowSpan={officeInfo.rows}
                          className={`border border-gray-200 p-2 align-middle text-center font-bold text-gray-700 bg-gray-100 sticky left-0 z-20 ${OFFICE_COL_WIDTH_CLASS}`}
                        >
                          <div className="flex flex-col items-center justify-center h-full space-y-1 tracking-wider">
                            {/* FIX: Added a type guard to ensure officeInfo.name is a string before calling split on it, which fixes the error where its type was inferred as 'unknown'. */}
                            {typeof officeInfo.name === 'string' && officeInfo.name.split('').map((char, i) => (
                              <span key={i}>{char}</span>
                            ))}
                          </div>
                        </td>
                      )}
                      {row.map((customer, colIndex) => {
                        const isJanuary = months[colIndex].getMonth() === 0;
                        const isDropTarget = dropTarget?.row === rowIndex && dropTarget?.col === colIndex;
                        return (
                          <td 
                            key={colIndex} 
                            className={`border border-gray-200 p-0.5 align-top transition-colors ${
                                isJanuary && colIndex > 0 ? 'border-l-2 border-l-red-400' : ''
                            } ${isDropTarget ? 'bg-blue-100 ring-2 ring-blue-400 z-10' : ''}`}
                            onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                          >
                            {customer && (
                              <div
                                draggable
                                onClick={() => handleClick(customer)}
                                onDragStart={(e) => handleDragStart(e, customer, rowIndex, colIndex)}
                                onDragEnd={handleDragEnd}
                                className={`h-full flex flex-col items-center justify-center p-1 rounded text-white font-medium shadow-sm truncate z-10 cursor-move transition-all ${getColorForCustomer(customer)}`}
                                title={`${customer.name} 様 (担当: ${customer.data.sales_rep as string})`}
                              >
                                {renderName(customer)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
        {confirmation && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-800">着工スケジュールの変更</h3>
                {confirmation.message}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmation(null)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmation.onConfirm}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm bg-blue-600 hover:bg-blue-700"
                >
                  変更する
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ConstructionSchedule;