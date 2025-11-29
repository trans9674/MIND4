import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Customer, CustomerStatus, ConstructionPhase } from '../types';
import { CENTER_LAT, CENTER_LNG, CONSTRUCTION_PHASE_CONFIG } from '../constants';
import { Calendar, Map as MapIcon, ZoomIn, ZoomOut, PanelRightClose, PanelRightOpen, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Since Leaflet is loaded from a script tag, we declare it globally
declare global {
  const L: any;
}

interface Props {
  customers: Customer[];
}

const ROW_HEIGHT = 25; // px
const HEADER_HEIGHT = 48; // px
const NAME_WIDTH = 160; // px
const MIN_DAY_WIDTH = 0.5; // Minimum px per day
const MAX_DAY_WIDTH = 100; // Maximum px per day

const GanttMap: React.FC<Props> = ({ customers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});
  const [flashingCustomerId, setFlashingCustomerId] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(true);

  const ganttContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag to Scroll State
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [scrollTopPos, setScrollTopPos] = useState(0);

  // Zoom / Scale State
  const [dayWidth, setDayWidth] = useState(8); // px per day (Initial value similar to previous zoomLevel 2)
  const [isResizing, setIsResizing] = useState(false);
  const resizeState = useRef<{ startX: number; startWidth: number; daysFromStart: number } | null>(null);

  const handleZoomIn = () => {
    setDayWidth(prev => Math.min(prev * 1.5, MAX_DAY_WIDTH));
  };

  const handleZoomOut = () => {
    setDayWidth(prev => Math.max(prev / 1.5, MIN_DAY_WIDTH));
  };

  // --- Resize Handlers ---
  const handleResizeMouseDown = (e: React.MouseEvent, cumulativeDays: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent scroll drag
    setIsResizing(true);
    resizeState.current = {
        startX: e.clientX,
        startWidth: dayWidth,
        daysFromStart: cumulativeDays
    };
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing || !resizeState.current) return;
        
        const { startX, startWidth, daysFromStart } = resizeState.current;
        const deltaX = e.clientX - startX;
        
        // Calculate new total width for this segment
        const currentPixelWidth = daysFromStart * startWidth;
        const newPixelWidth = currentPixelWidth + deltaX;
        
        // Reverse calculate the new dayWidth
        // Prevent division by zero or negative width
        if (daysFromStart > 0) {
            let newDayWidth = newPixelWidth / daysFromStart;
            newDayWidth = Math.max(MIN_DAY_WIDTH, Math.min(newDayWidth, MAX_DAY_WIDTH));
            setDayWidth(newDayWidth);
        }
    };

    const handleResizeUp = () => {
        if (isResizing) {
            setIsResizing(false);
            resizeState.current = null;
            document.body.style.cursor = '';
        }
    };

    if (isResizing) {
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizing]);


  const { timelineStart, timelineEnd, totalDays, months, todayOffset } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear() + 2, today.getMonth(), 0);

    const dayCount = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const monthArr: { label: string, offset: number, days: number, cumulativeDays: number }[] = [];
    let current = new Date(start);
    let cumulativeDays = 0;

    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const offset = (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      
      cumulativeDays += daysInMonth;

      monthArr.push({
        label: `${year} / ${month + 1}`,
        offset: offset,
        days: daysInMonth,
        cumulativeDays: offset + daysInMonth // End of this month relative to start
      });
      current.setMonth(month + 1);
    }
    
    const todayOff = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: dayCount,
      months: monthArr,
      todayOffset: todayOff,
    };
  }, []);

  const GridLines = useMemo(() => {
    const lines: { offset: number; isStrong: boolean }[] = [];
    const start = timelineStart;
    
    const getDateInfo = (dayOffset: number): { dayOfWeek: number, dayOfMonth: number } => {
        const date = new Date(start);
        date.setDate(start.getDate() + dayOffset);
        return { dayOfWeek: date.getDay(), dayOfMonth: date.getDate() };
    };

    // Dynamic grid density based on dayWidth
    if (dayWidth >= 15) {
        // Daily lines
        for (let i = 0; i < totalDays; i++) {
            lines.push({ offset: i, isStrong: getDateInfo(i).dayOfWeek === 0 });
        }
    } else if (dayWidth >= 4) {
        // Weekly lines
        for (let i = 0; i < totalDays; i++) {
            if (getDateInfo(i).dayOfWeek === 0) { // Sundays
                lines.push({ offset: i, isStrong: false });
            }
        }
    } else if (dayWidth >= 1) {
        // Half-monthly (approx)
        for (let i = 0; i < totalDays; i++) {
            const { dayOfMonth } = getDateInfo(i);
            if (dayOfMonth === 1 || dayOfMonth === 15) {
                lines.push({ offset: i, isStrong: dayOfMonth === 1 });
            }
        }
    } else {
        // Monthly lines only
         months.forEach(month => {
            lines.push({ offset: month.offset, isStrong: true });
        });
    }

    return lines;
  }, [dayWidth, timelineStart, totalDays, months]);


  const projects = useMemo(() => {
    return customers
      .filter(c => c.data.contract_date)
      .map(customer => {
        const contractDate = new Date(customer.data.contract_date);
        const designDuration = 90; // days
        
        const designStartOffset = (contractDate.getTime() - timelineStart.getTime()) / (1000 * 3600 * 24);
        
        const constructionStartDate = new Date(contractDate);
        constructionStartDate.setDate(constructionStartDate.getDate() + designDuration);
        
        let cumulativeDays = 0;
        const phases = Object.values(ConstructionPhase)
            .filter(p => p !== ConstructionPhase.PRE_CONSTRUCTION)
            .map(phaseKey => {
                const config = CONSTRUCTION_PHASE_CONFIG[phaseKey];
                const phaseStart = cumulativeDays;
                cumulativeDays += config.defaultDuration;
                
                const phaseStartDate = new Date(constructionStartDate);
                phaseStartDate.setDate(phaseStartDate.getDate() + phaseStart);

                return {
                    ...config,
                    key: phaseKey,
                    startOffset: (phaseStartDate.getTime() - timelineStart.getTime()) / (1000 * 3600 * 24),
                    width: config.defaultDuration,
                };
            });
        
        return {
            customer,
            design: { startOffset: designStartOffset, width: designDuration },
            constructionPhases: phases
        };
      })
      .sort((a, b) => new Date(a.customer.data.contract_date).getTime() - new Date(b.customer.data.contract_date).getTime());
  }, [customers, timelineStart]);
  
  const activeProjects = projects.map(p => p.customer);

  useEffect(() => {
    if (typeof L === 'undefined' || !mapRef.current || !isMapVisible) return;
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([CENTER_LAT, CENTER_LNG], 12);
      L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
      }).addTo(mapInstance.current);
    }
    const map = mapInstance.current;
    const markerLayer = L.featureGroup().addTo(map);
    markerRefs.current = {};
    activeProjects.forEach(project => {
        const marker = L.marker([project.location.lat, project.location.lng]);
        markerRefs.current[project.id] = marker;
        marker.bindPopup(`<div class="p-2 font-sans"><h3 class="font-bold">${project.name} 様邸</h3><a href="https://www.google.com/maps/dir/?api=1&destination=${project.location.lat},${project.location.lng}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600">ルート案内</a></div>`);
        markerLayer.addLayer(marker);
    });
    if (activeProjects.length > 0) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(markerLayer.getBounds().pad(0.1));
      }, 100);
    }
    return () => { markerLayer.clearLayers(); };
  }, [activeProjects, isMapVisible]);

  useEffect(() => {
    const doFlash = async () => {
      if (!flashingCustomerId || !mapInstance.current) return;
      const marker = markerRefs.current[flashingCustomerId];
      if (!marker?._icon) return;
      const icon = marker._icon;
      
      // Use panTo instead of flyTo to prevent zooming (enlarging effect)
      mapInstance.current.panTo(marker.getLatLng());
      
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      await delay(300);
      for (let i = 0; i < 5; i++) {
        icon.classList.add('marker-flash');
        await delay(300);
        icon.classList.remove('marker-flash');
        await delay(300);
      }
      setFlashingCustomerId(null);
    };
    doFlash();
  }, [flashingCustomerId]);

  // Drag to Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ganttContainerRef.current) return;
    // Do not initiate drag scroll if resizing or clicking interactive elements
    if (isResizing) return;
    
    setIsDraggingScroll(true);
    setStartX(e.pageX - ganttContainerRef.current.offsetLeft);
    setStartY(e.pageY - ganttContainerRef.current.offsetTop);
    setScrollLeftPos(ganttContainerRef.current.scrollLeft);
    setScrollTopPos(ganttContainerRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || !ganttContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - ganttContainerRef.current.offsetLeft;
    const y = e.pageY - ganttContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1; // Speed multiplier
    const walkY = (y - startY) * 1;
    ganttContainerRef.current.scrollLeft = scrollLeftPos - walkX;
    ganttContainerRef.current.scrollTop = scrollTopPos - walkY;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full p-1">
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-700 ease-in-out ${isMapVisible ? 'lg:col-span-7' : 'lg:col-span-10'}`}>
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              工程全体スケジュール
            </h3>
            <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-md ml-4">
              <button
                onClick={handleZoomOut}
                disabled={dayWidth <= MIN_DAY_WIDTH}
                className="p-1 rounded text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="縮小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {/* Scale Indicator */}
              <div className="px-2 text-xs text-gray-600 font-mono text-center flex items-center space-x-1" title="現在の縮尺 (1日あたりの幅)">
                 <span className="w-12 text-right">{dayWidth.toFixed(1)}</span>
                 <span className="text-[10px] text-gray-400">px/day</span>
              </div>
              <button
                onClick={handleZoomIn}
                disabled={dayWidth >= MAX_DAY_WIDTH}
                className="p-1 rounded text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="拡大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center">
             <button
                onClick={() => setIsMapVisible(prev => !prev)}
                className="flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-100 transition-colors"
             >
                {isMapVisible ? (
                    <>
                        <PanelRightClose className="w-4 h-4 text-gray-600" />
                        <span>全画面表示</span>
                    </>
                ) : (
                    <>
                        <PanelRightOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">マップを表示</span>
                    </>
                )}
            </button>
          </div>
        </div>

        <div 
            className={`flex-1 overflow-auto cursor-grab active:cursor-grabbing ${isDraggingScroll ? 'select-none' : ''}`} 
            ref={ganttContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
          <div className="relative" style={{ width: totalDays * dayWidth + NAME_WIDTH }}>
            {/* Background Grid Layer */}
            <div className="absolute inset-0 pointer-events-none" style={{ paddingTop: HEADER_HEIGHT, paddingLeft: NAME_WIDTH }}>
                {GridLines.map((line, i) => (
                    <div 
                        key={`grid-${i}`}
                        className={`absolute top-0 bottom-0 border-l ${line.isStrong ? 'border-slate-200' : 'border-slate-100'}`}
                        style={{ left: line.offset * dayWidth }}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 flex items-center bg-gray-50 border-b shadow-sm" style={{ height: HEADER_HEIGHT }}>
                {/* Top-left corner */}
                <div className="sticky left-0 z-50 bg-gray-50 border-r font-semibold text-sm flex items-center justify-center text-slate-600 flex-shrink-0" style={{ width: NAME_WIDTH, height: '100%' }}>
                    顧客名
                </div>
                {/* Timeline header */}
                <div className="relative flex-1 h-full">
                    {months.map(({ label, offset, days, cumulativeDays }) => (
                        <div 
                            key={label} 
                            className="absolute h-full flex items-center justify-center border-l text-xs text-slate-500 group select-none" 
                            style={{ left: offset * dayWidth, width: days * dayWidth }}
                        >
                            <span className="truncate px-1">{label}</span>
                            {/* Resize Handle */}
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 group-hover:bg-gray-300/50 z-50 transition-colors"
                                onMouseDown={(e) => handleResizeMouseDown(e, cumulativeDays)}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-[1px] bg-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body Rows */}
            <div className="relative">
                {projects.map(({ customer, design, constructionPhases }) => (
                    <div key={customer.id} className="flex relative" style={{ height: ROW_HEIGHT }}>
                        {/* Name cell */}
                        <div
                            onClick={(e) => {
                                // Prevent click if we were dragging
                                if (isDraggingScroll) return;
                                if (!isMapVisible) setIsMapVisible(true);
                                setFlashingCustomerId(customer.id);
                            }}
                            className="sticky left-0 z-30 bg-white border-r border-b p-2 flex items-center cursor-pointer hover:bg-slate-50 flex-shrink-0 shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]"
                            style={{ width: NAME_WIDTH }}
                        >
                            <p className="text-sm font-medium truncate text-slate-700">{customer.name}</p>
                        </div>
                        {/* Bar container */}
                        <div className="relative flex-1 pointer-events-none">
                          {[CustomerStatus.APPLIED, CustomerStatus.BASIC_DESIGN, CustomerStatus.SPEC_MEETING].includes(customer.status) && (
                            <div 
                              title={`設計・申請期間: ${design.width}日間`}
                              className="absolute h-4 top-1/2 -translate-y-1/2 rounded bg-blue-500 opacity-80 z-10 pointer-events-auto"
                              style={{ left: design.startOffset * dayWidth, width: design.width * dayWidth }}
                            />
                          )}
                          
                          {customer.status === CustomerStatus.CONSTRUCTION && constructionPhases.map(phase => (
                            <div
                              key={phase.key}
                              title={`${phase.name}: ${phase.width}日間`}
                              className="absolute h-4 top-1/2 -translate-y-1/2 rounded opacity-90 z-10 pointer-events-auto"
                              style={{
                                  left: phase.startOffset * dayWidth,
                                  width: phase.width * dayWidth,
                                  backgroundColor: phase.color
                              }}
                            />
                          ))}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Today Line Overlay */}
            <div className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10 pointer-events-none" style={{ left: todayOffset * dayWidth + NAME_WIDTH }}>
              <div className="sticky top-0 -translate-x-1/2 text-[10px] bg-red-400 text-white px-1 rounded z-20" style={{top: HEADER_HEIGHT / 2}}>今日</div>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMapVisible && (
            <motion.div
                className="bg-slate-100 rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative min-h-[400px] h-full lg:col-span-3"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
                exit={{ opacity: 0, x: 100, transition: { duration: 0.7, ease: 'easeInOut' } }}
            >
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-2 rounded-lg shadow border border-gray-200 flex items-center">
                  <MapIcon className="w-4 h-4 mr-2 text-green-600" />
                  <h3 className="font-bold text-gray-800 text-sm">現場マップ</h3>
                </div>
                <div ref={mapRef} className="w-full h-full bg-slate-200 monochrome-map" />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GanttMap;