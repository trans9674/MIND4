import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string | null) => void;
  initialDate?: string | null;
}

const CalendarModal: React.FC<Props> = ({ isOpen, onClose, onSelectDate, initialDate }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    let date;
    if (initialDate && !isNaN(new Date(initialDate).getTime())) {
      date = new Date(initialDate);
    } else {
      date = new Date();
    }
    
    setViewDate(date);
    setSelectedDate(initialDate && !isNaN(new Date(initialDate).getTime()) ? date : null);
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const calendarDays = [];
  // Add blank days for the start of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`blank-start-${i}`} className="w-10 h-10"></div>);
  }
  // Add the actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => setSelectedDate(currentDate)}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors
          ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
          ${!isSelected && isToday ? 'bg-blue-100 text-blue-700' : ''}
          ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
        `}
      >
        {day}
      </button>
    );
  }
  // Pad with empty divs to ensure 6 rows (42 cells)
  while (calendarDays.length < 42) {
      calendarDays.push(<div key={`blank-end-${calendarDays.length}`} className="w-10 h-10"></div>);
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  
  const handleSetToday = () => {
      const today = new Date();
      setViewDate(today);
      setSelectedDate(today);
  }

  const handleClear = () => {
      onSelectDate(null);
      onClose();
  }

  const handleSet = () => {
      if (selectedDate) {
        // toISOString gives UTC, which can be off by a day.
        // We need to construct YYYY-MM-DD from the local date parts.
        const y = selectedDate.getFullYear();
        const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const d = selectedDate.getDate().toString().padStart(2, '0');
        onSelectDate(`${y}-${m}-${d}`);
      } else {
        onSelectDate(null);
      }
      onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">日付を選択</h3>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700">{`${year}年 ${month + 1}月`}</span>
              <button onClick={handlePrevMonth} className="p-1 ml-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2 font-medium">
            <div className="text-red-500">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-500">土</div>
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {calendarDays}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between">
          <button onClick={handleSetToday} className="px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg">今日</button>
          <div className="flex space-x-2">
            <button onClick={handleClear} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg">クリア</button>
            <button onClick={onClose} className="px-4 py-2 text-gray-600 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-100 rounded-lg">キャンセル</button>
            <button onClick={handleSet} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">設定</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;