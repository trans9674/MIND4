import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer, Employee, AvatarConfig } from '../types';
import { X, Shield, TrendingUp, PenTool, Crown, Medal, Award, Calendar, ArrowUp, ArrowDown, Minus, Palette, HardHat, Star, FileText, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarModal from './CalendarModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  employees: Employee[];
}

// A smaller avatar for the list
const MiniAvatar = ({ config }: { config?: AvatarConfig }) => {
  if (!config) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <rect x="0" y="85" width="100" height="35" fill={config.clothingColor} />
        <circle cx="50" cy="50" r="35" fill={config.skinColor} />
        <circle cx="50" cy="20" r="25" fill={config.hairColor} />
      </svg>
    </div>
  );
};

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-orange-400" />;
    return <span className="text-sm text-gray-500 font-medium w-5 text-center">{rank + 1}</span>;
}

const ComparisonIndicator = ({ diff }: { diff: number }) => {
    if (diff > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (diff < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
}

const PerformanceTable = ({ 
    dataA, 
    dataB, 
    dataC,
    title 
}: { 
    dataA: (Employee & { count: number; totalAmount: number })[];
    dataB: (Employee & { count: number; totalAmount: number })[];
    dataC: (Employee & { count: number; totalAmount: number })[];
    title: string;
}) => {
    const maxCount = Math.max(1, ...dataA.map(d => d.count));
    
    const dataBMap = useMemo(() => new Map(dataB.map(item => [item.id, item.count])), [dataB]);
    const dataCMap = useMemo(() => new Map(dataC.map(item => [item.id, item.count])), [dataC]);

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">順位</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">契約件数</th>
                            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">請負金額(万)</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">期間②</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">期間③</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">①vs②</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">実績 (件数)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {dataA.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-500">
                                    対象期間に該当するデータがありません。
                                </td>
                            </tr>
                        ) : dataA.map((item, index) => {
                            const countB = dataBMap.get(item.id) ?? 0;
                            const countC = dataCMap.get(item.id) ?? 0;
                            const diff = item.count - countB;
                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center justify-center">
                                           <RankIcon rank={index} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <MiniAvatar config={item.avatar} />
                                            <span className="font-medium text-sm text-gray-900">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-gray-800 text-base">{item.count}</td>
                                    <td className="px-2 py-2 whitespace-nowrap text-right font-medium text-gray-800 text-sm pr-4">
                                        {(item.totalAmount / 10000).toLocaleString()}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600">{countB}</td>
                                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600">{countC}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="flex items-center justify-center space-x-1">
                                            <ComparisonIndicator diff={diff}/>
                                            <span className={`text-sm ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>{diff !== 0 ? diff : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full" 
                                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DateRangeFilter: React.FC<{
    label: string;
    range: { start: string | null; end: string | null };
    onDateClick: (part: 'start' | 'end') => void;
    onClear: () => void;
}> = ({ label, range, onDateClick, onClear }) => (
    <div className="flex items-center space-x-2">
        <span className="font-medium text-sm text-gray-600 w-20">{label}:</span>
        <button onClick={() => onDateClick('start')} className="flex items-center space-x-2 text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50 w-28 justify-center">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{range.start || '開始日'}</span>
        </button>
        <span>〜</span>
        <button onClick={() => onDateClick('end')} className="flex items-center space-x-2 text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50 w-28 justify-center">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{range.end || '終了日'}</span>
        </button>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-red-600 underline">クリア</button>
    </div>
);

const AdminPanel: React.FC<Props> = ({ isOpen, onClose, customers, employees }) => {
  const [activeTab, setActiveTab] = useState('monthly_sales');
  
  const [dateRanges, setDateRanges] = useState<{
    rangeA: { start: string | null; end: string | null };
    rangeB: { start: string | null; end: string | null };
    rangeC: { start: string | null; end: string | null };
  }>({
    rangeA: { start: null, end: null },
    rangeB: { start: null, end: null },
    rangeC: { start: null, end: null },
  });
  
  const [monthlyChartRange, setMonthlyChartRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  const [editingDateConfig, setEditingDateConfig] = useState<{
    rangeKey: 'rangeA' | 'rangeB' | 'rangeC' | 'monthlyChartRange';
    part: 'start' | 'end';
  } | null>(null);

  const [pointDistribution, setPointDistribution] = useState({
    sales: 10,
    design: 5,
    ic: 3,
    application: 2,
    construction: 7,
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (!isOpen || activeTab !== 'monthly_sales') return;
    const container = chartContainerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            window.requestAnimationFrame(() => {
              if (entries[0].contentRect.width > 0) {
                setChartWidth(entries[0].contentRect.width);
              }
            });
        }
    });
    
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, [isOpen, activeTab]);
  
    const monthlySalesData = useMemo(() => {
    const range = monthlyChartRange;
    const filteredCustomers = customers.filter(c => {
      const contractDateStr = c.data.contract_date;
      if (!contractDateStr) return false;
      if (!range.start && !range.end) return true;

      const contractDate = new Date(contractDateStr);
      const startDate = range.start ? new Date(range.start) : null;
      const endDate = range.end ? new Date(range.end) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && endDate) return contractDate >= startDate && contractDate <= endDate;
      if (startDate) return contractDate >= startDate;
      if (endDate) return contractDate <= endDate;
      return true;
    });

    const dataByMonth: Record<string, { month: string, planned: number, confirmed: number }> = {};

    filteredCustomers.forEach(c => {
      const contractDate = new Date(c.data.contract_date);
      const monthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { month: monthKey, planned: 0, confirmed: 0 };
      }

      const amount = c.data.amount || 0;
      dataByMonth[monthKey].planned += amount;
      if (c.status !== '商談中') {
        dataByMonth[monthKey].confirmed += amount;
      }
    });
    
    return Object.values(dataByMonth).sort((a, b) => a.month.localeCompare(b.month));

  }, [customers, monthlyChartRange]);


  const performanceData = useMemo(() => {
    const getFilteredDataByRole = (role: Employee['role'], field: string, range: { start: string | null; end: string | null }) => {
        const filteredCustomers = customers.filter(c => {
            const contractDateStr = c.data.contract_date;
            if (!contractDateStr || c.status === '商談中') return false;
            if (!range.start && !range.end) return true;

            const contractDate = new Date(contractDateStr);
            const startDate = range.start ? new Date(range.start) : null;
            const endDate = range.end ? new Date(range.end) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            if (startDate && endDate) return contractDate >= startDate && contractDate <= endDate;
            if (startDate) return contractDate >= startDate;
            if (endDate) return contractDate <= endDate;
            return true;
        });

        return employees
          .filter(e => e.role === role)
          .map(employee => {
            const assignedCustomers = filteredCustomers.filter(c => c.data[field] === employee.name);
            const totalAmount = assignedCustomers.reduce((acc, customer) => acc + (customer.data.amount || 0), 0);
            return {
                ...employee,
                count: assignedCustomers.length,
                totalAmount: totalAmount
            };
          })
          .sort((a, b) => b.count - a.count);
    };

    const rolesConfig = {
      sales: { role: '営業' as const, field: 'sales_rep' },
      architects: { role: '設計' as const, field: 'architect' },
      ics: { role: 'IC' as const, field: 'ic' },
      application: { role: 'その他' as const, field: 'application_rep' },
      construction: { role: '工務' as const, field: 'constructor' },
    };

    const result: any = {};
    for (const key in rolesConfig) {
      const { role, field } = rolesConfig[key as keyof typeof rolesConfig];
      result[`${key}A`] = getFilteredDataByRole(role, field, dateRanges.rangeA);
      result[`${key}B`] = getFilteredDataByRole(role, field, dateRanges.rangeB);
      result[`${key}C`] = getFilteredDataByRole(role, field, dateRanges.rangeC);
    }
    
    const pointValues: Record<Employee['role'], number> = {
      '営業': pointDistribution.sales,
      '設計': pointDistribution.design,
      'IC': pointDistribution.ic,
      '工務': pointDistribution.construction,
      'その他': pointDistribution.application
    };

    const evaluationData = employees.map(emp => {
        let count = 0;
        const roleKey = (Object.keys(rolesConfig) as Array<keyof typeof rolesConfig>).find(k => rolesConfig[k].role === emp.role);
        if(roleKey){
            const empData = result[`${roleKey}A`].find((e: Employee) => e.id === emp.id);
            if(empData) count = empData.count;
        }
        
        const points = count * (pointValues[emp.role] || 0);

        return { ...emp, count, points };
    }).sort((a, b) => b.points - a.points);
    
    result.evaluationData = evaluationData;
    
    return result;
  }, [customers, employees, dateRanges, pointDistribution]);

  if (!isOpen) return null;

  const performanceTabs = [
      { id: 'monthly_sales', label: '月別売上', icon: BarChart },
      { id: 'sales', label: '営業実績', icon: TrendingUp },
      { id: 'design', label: '設計実績', icon: PenTool },
      { id: 'ic', label: 'IC実績', icon: Palette },
      { id: 'application', label: '申請実績', icon: FileText },
      { id: 'construction', label: '工務実績', icon: HardHat },
      { id: 'evaluation', label: '評価実績配分', icon: Star },
  ];
  
  const pointRolesConfig = [
    { id: 'sales', label: '営業' },
    { id: 'design', label: '設計' },
    { id: 'ic', label: 'IC' },
    { id: 'application', label: '申請' },
    { id: 'construction', label: '工務' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
      <>
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-5xl h-[85vh] bg-gray-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white p-4 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                管理者パネル - 実績データ
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
               <div className="w-48 bg-gray-50 border-r flex flex-col p-2 space-y-1">
                  {performanceTabs.map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                          <tab.icon className="w-5 h-5" />
                          <span>{tab.label}</span>
                      </button>
                  ))}
               </div>

               <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {activeTab !== 'monthly_sales' && (
                            <div className="bg-white p-4 rounded-lg border space-y-3">
                                <DateRangeFilter 
                                    label="集計期間①"
                                    range={dateRanges.rangeA}
                                    onDateClick={(part) => setEditingDateConfig({ rangeKey: 'rangeA', part })}
                                    onClear={() => setDateRanges(p => ({...p, rangeA: {start: null, end: null}}))}
                                />
                                <DateRangeFilter 
                                    label="集計期間②"
                                    range={dateRanges.rangeB}
                                    onDateClick={(part) => setEditingDateConfig({ rangeKey: 'rangeB', part })}
                                    onClear={() => setDateRanges(p => ({...p, rangeB: {start: null, end: null}}))}
                                />
                                <DateRangeFilter 
                                    label="集計期間③"
                                    range={dateRanges.rangeC}
                                    onDateClick={(part) => setEditingDateConfig({ rangeKey: 'rangeC', part })}
                                    onClear={() => setDateRanges(p => ({...p, rangeC: {start: null, end: null}}))}
                                />
                            </div>
                        )}
                        
                        {activeTab === 'monthly_sales' && (
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg border">
                                    <DateRangeFilter 
                                        label="集計期間"
                                        range={monthlyChartRange}
                                        onDateClick={(part) => setEditingDateConfig({ rangeKey: 'monthlyChartRange', part })}
                                        onClear={() => setMonthlyChartRange({start: null, end: null})}
                                    />
                                </div>
                                <div className="bg-white p-6 rounded-lg border">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">月別 設計料実績</h3>
                                    <div className="flex items-center space-x-4 mb-4 text-sm">
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></div>予定設計料</div>
                                        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-green-500 mr-2"></div>確定設計料</div>
                                    </div>
                                    {monthlySalesData.length === 0 ? (
                                        <div className="text-center py-16 text-gray-500">対象期間にデータがありません。</div>
                                    ) : (() => {
                                        const maxValue = Math.max(1, ...monthlySalesData.map(d => d.planned));
                                        const yAxisLabels = Array.from({length: 5}, (_, i) => Math.round(maxValue / 4 * (4 - i) / 1000000) * 1000000);
                                        const chartHeight = 300;

                                        const yAxisWidth = 50;
                                        const chartAreaWidth = chartWidth > 0 ? chartWidth - yAxisWidth : 0;
                                        const groupWidth = chartAreaWidth / monthlySalesData.length;
                                        const barWidth = groupWidth / 3;
                                        
                                        return (
                                            <div className="w-full" style={{ height: chartHeight + 40 }} ref={chartContainerRef}>
                                                {chartWidth > 0 && (
                                                <svg width="100%" height="100%" className="overflow-visible">
                                                    {/* Y-Axis */}
                                                    <g className="text-gray-400 text-xs">
                                                        {yAxisLabels.map((label, i) => (
                                                            <g key={i} transform={`translate(0, ${i * (chartHeight / 4)})`}>
                                                                <text x="0" y="4" dx="-5" textAnchor="end">{label / 1000000}M</text>
                                                                <line x1="0" x2="100%" stroke="#e5e7eb" strokeDasharray="2,3" />
                                                            </g>
                                                        ))}
                                                    </g>
                                                    {/* Bars and X-Axis Labels */}
                                                    <g transform={`translate(${yAxisWidth}, 0)`}>
                                                      {monthlySalesData.map((d, i) => {
                                                        const plannedHeight = (d.planned / (yAxisLabels[0] || 1)) * chartHeight;
                                                        const confirmedHeight = (d.confirmed / (yAxisLabels[0] || 1)) * chartHeight;

                                                        return (
                                                            <g key={d.month} transform={`translate(${i * groupWidth})`}>
                                                                <rect x="0" y={chartHeight - plannedHeight} width={barWidth} height={plannedHeight} className="fill-blue-500 hover:opacity-80 transition-opacity">
                                                                  <title>予定: {d.planned.toLocaleString()}円</title>
                                                                </rect>
                                                                <rect x={barWidth} y={chartHeight - confirmedHeight} width={barWidth} height={confirmedHeight} className="fill-green-500 hover:opacity-80 transition-opacity">
                                                                  <title>確定: {d.confirmed.toLocaleString()}円</title>
                                                                </rect>
                                                                <text x={groupWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-600">
                                                                    {d.month.replace('-', '/')}
                                                                </text>
                                                            </g>
                                                        )
                                                      })}
                                                    </g>
                                                </svg>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'sales' && <PerformanceTable dataA={performanceData.salesA} dataB={performanceData.salesB} dataC={performanceData.salesC} title="営業担当 契約件数ランキング" />}
                        {activeTab === 'design' && <PerformanceTable dataA={performanceData.architectsA} dataB={performanceData.architectsB} dataC={performanceData.architectsC} title="設計担当 担当件数ランキング" />}
                        {activeTab === 'ic' && <PerformanceTable dataA={performanceData.icsA} dataB={performanceData.icsB} dataC={performanceData.icsC} title="IC担当 担当件数ランキング" />}
                        {activeTab === 'application' && <PerformanceTable dataA={performanceData.applicationA} dataB={performanceData.applicationB} dataC={performanceData.applicationC} title="申請担当 担当件数ランキング" />}
                        {activeTab === 'construction' && <PerformanceTable dataA={performanceData.constructionA} dataB={performanceData.constructionB} dataC={performanceData.constructionC} title="工務担当 担当件数ランキング" />}
                        {activeTab === 'evaluation' && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-lg border">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">ポイント設定 (契約1件あたり)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {pointRolesConfig.map(role => (
                                            <div key={role.id}>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">{role.label}</label>
                                                <input 
                                                    type="number"
                                                    value={pointDistribution[role.id as keyof typeof pointDistribution]}
                                                    onChange={(e) => setPointDistribution({ ...pointDistribution, [role.id]: Number(e.target.value) || 0 })}
                                                    className="w-full border rounded-md p-2 text-center text-lg font-semibold bg-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">総合評価ランキング (期間①)</h3>
                                    <div className="bg-white border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">順位</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役職</th>
                                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">担当件数</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計ポイント</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {performanceData.evaluationData.map((emp: any, index: number) => (
                                                    <tr key={emp.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 whitespace-nowrap"><div className="flex items-center justify-center"><RankIcon rank={index} /></div></td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="flex items-center space-x-3">
                                                                <MiniAvatar config={emp.avatar} />
                                                                <span className="font-medium text-sm text-gray-900">{emp.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{emp.role}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-800 font-medium">{emp.count}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-blue-600 font-bold">{emp.points.toLocaleString()} pt</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
               </div>
            </div>
          </motion.div>
        </div>
        <CalendarModal
            isOpen={!!editingDateConfig}
            onClose={() => setEditingDateConfig(null)}
            initialDate={editingDateConfig ? (editingDateConfig.rangeKey === 'monthlyChartRange' ? monthlyChartRange[editingDateConfig.part] : dateRanges[editingDateConfig.rangeKey][editingDateConfig.part]) : null}
            onSelectDate={(date) => {
                if (editingDateConfig) {
                    if (editingDateConfig.rangeKey === 'monthlyChartRange') {
                        setMonthlyChartRange(prev => ({ ...prev, [editingDateConfig.part]: date }));
                    } else {
                        setDateRanges(prev => ({
                            ...prev,
                            [editingDateConfig.rangeKey]: {
                                ...prev[editingDateConfig.rangeKey],
                                [editingDateConfig.part]: date,
                            },
                        }));
                    }
                }
                setEditingDateConfig(null);
            }}
        />
      </>
      )}
    </AnimatePresence>
  );
};

export default AdminPanel;