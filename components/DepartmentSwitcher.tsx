
import React from 'react';
import { DEPARTMENTS } from '../lib/mockData';
import { DepartmentConfig, DepartmentCategory } from '../types';

interface Props {
  currentDept: DepartmentConfig;
  onSelect: (dept: DepartmentConfig) => void;
}

const DepartmentSwitcher: React.FC<Props> = ({ currentDept, onSelect }) => {
  const categories = Object.values(DepartmentCategory);

  return (
    <div className="flex flex-col w-full md:w-72">
      <div className="relative inline-block text-left">
        <select
          value={currentDept.id}
          onChange={(e) => {
            const selected = DEPARTMENTS.find(d => d.id === e.target.value);
            if (selected) onSelect(selected);
          }}
          className="block w-full px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white shadow-sm outline-none transition-all cursor-pointer"
        >
          {categories.map(cat => (
            <optgroup label={cat} key={cat} className="bg-slate-900 font-bold text-slate-500 uppercase text-[10px] tracking-widest">
              {DEPARTMENTS.filter(d => d.category === cat).map(dept => (
                <option key={dept.id} value={dept.id} className="bg-slate-800 text-white text-sm font-normal normal-case tracking-normal">
                  {dept.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed font-medium px-1">
        {currentDept.description}
      </p>
    </div>
  );
};

export default DepartmentSwitcher;
