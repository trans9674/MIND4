import React, { useRef } from 'react';
import { Customer, CustomerStatus, Task } from '../types';
import { STATUS_CONFIG } from '../constants';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface Props {
  customers: Customer[];
  tasks: Task[];
  onCustomerClick: (customer: Customer) => void;
}

// This component wraps the card to add touch sensitivity logic for mobile.
// It distinguishes between a scroll and a tap.
const TouchableCard = ({ customer, onClick, ...props }: any) => {
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const threshold = 20; // Pixels to move before it's considered a scroll

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      // It's a scroll, cancel the tap
      touchStartPos.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Prevent the default click event from firing on touch devices
    e.preventDefault();
    if (touchStartPos.current) {
      // If the tap was not cancelled, it's a real tap
      onClick(customer);
    }
    touchStartPos.current = null;
  };

  return (
    <motion.div
      {...props}
      onClick={() => onClick(customer)} // For desktop clicks
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};


const Progress3D: React.FC<Props> = ({ customers, tasks, onCustomerClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter for active projects
  const activeCustomers = customers.filter(c => 
    [CustomerStatus.APPLIED, CustomerStatus.BASIC_DESIGN, CustomerStatus.SPEC_MEETING, CustomerStatus.CONSTRUCTION].includes(c.status)
  );

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col">
      <div className="flex-1 perspective-container overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div className="h-full flex space-x-2 md:space-x-4 preserve-3d p-2 md:p-4 min-w-[960px]">
          
          {/* Render columns based on status */}
          {Object.values(CustomerStatus).filter(s => s !== CustomerStatus.RESIDENT).map((status, colIndex) => {
            const columnCustomers = activeCustomers.filter(c => c.status === status);
            const style = STATUS_CONFIG[status];
            
            return (
              <motion.div 
                key={status}
                initial={{ rotateY: -3, opacity: 0, x: 20 }}
                animate={{ rotateY: 0, opacity: 1, x: 0 }}
                transition={{ delay: colIndex * 0.1, duration: 0.8 }}
                className="w-32 md:w-44 flex-shrink-0 flex flex-col space-y-2 md:space-y-3 preserve-3d"
              >
                {/* Header */}
                <div className={`${style.header} backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl shadow-md`}>
                  <h3 className="font-bold text-white text-sm md:text-base">{status}</h3>
                  <div className="text-xs text-white/80 mt-1">{columnCustomers.length} Projects</div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto pb-10 scrollbar-hide overscroll-y-contain">
                  {columnCustomers.map((customer, cardIndex) => {
                    const customerTasks = tasks.filter(t => t.customerId === customer.id);
                    const progress = customerTasks.length > 0
                        ? Math.round((customerTasks.filter(t => t.isCompleted).length / customerTasks.length) * 100)
                        : 0;
                    const bgColorClass = (style.header.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-500');

                    return (
                      <TouchableCard
                        key={customer.id}
                        customer={customer}
                        onClick={onCustomerClick}
                        layoutId={customer.id}
                        className={`bg-white p-2 rounded-lg shadow-lg border-l-4 ${style.border} cursor-pointer relative group preserve-3d h-11 flex flex-col justify-between`}
                        title={`${customer.name}様 - ${customer.currentPhase || '計画中'}`}
                      >
                        {/* Customer Name */}
                        <p className="text-xs font-medium text-slate-700 truncate">{customer.name} 様</p>
                        
                        {/* Progress Indicator */}
                        <div className="relative h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full ${bgColorClass} transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        
                        {/* 3D Depth Effect Bottom Shadow */}
                        <div className="absolute -bottom-1.5 left-1 right-1 h-1.5 bg-black/10 blur-sm rounded-[50%]" />
                      </TouchableCard>
                    )
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Progress3D;