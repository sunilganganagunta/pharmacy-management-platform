import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Package,
  Truck,
  Building2,
  Users,
  BarChart3,
  Bell,
  X,
  HeartPulse
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { name: 'POS & Billing', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { name: 'Medicines', path: '/medicines', icon: Pill, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['ADMIN', 'PHARMACIST'] },
    { name: 'Purchase Orders', path: '/purchases', icon: Truck, roles: ['ADMIN', 'PHARMACIST'] },
    { name: 'Suppliers', path: '/suppliers', icon: Building2, roles: ['ADMIN', 'PHARMACIST'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'PHARMACIST'] },
    { name: 'Alert Center', path: '/notifications', icon: Bell, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  ];

  const userRole = user?.role || 'PHARMACIST';
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Medi<span className="text-brand-600 dark:text-brand-400">Core</span>
              </span>
              <p className="text-[10px] font-medium text-slate-400">Smart Pharmacy SaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Core Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 dark:bg-brand-600'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Logged in as
            </div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
              {user?.fullName || user?.username}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                {user?.role}
              </span>
              <span className="text-[10px] text-slate-400">ALGiONS MediCore</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

