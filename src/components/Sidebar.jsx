import React, { useState, useEffect } from 'react';
import { 
  Boxes, LayoutDashboard, 
  ShoppingCart, FileText, Users, FileQuestion, PackageCheck, 
  Receipt, Wallet, Award, PieChart, AlertTriangle, 
  GitCompare, FileBarChart, TrendingUp, UserCheck, 
  Settings, GitBranch, ChevronDown, ChevronLeft, ChevronRight, Upload
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle, activeTab, onChangeTab }) {
  // Dropdown groups configuration
  const groups = [
    {
      title: 'Purchasing',
      icon: ShoppingCart,
      items: [
        { label: 'Purchase Orders', icon: ShoppingCart },
        { label: 'Requests for Purchase', icon: FileText },
        { label: 'Quotations', icon: FileQuestion }
      ]
    },
    {
      title: 'Vendors',
      icon: Users,
      items: [
        { label: 'Vendor Management', icon: Users },
        { label: 'Vendor Performance', icon: Award }
      ]
    },
    {
      title: 'Receiving & Inventory',
      icon: Boxes,
      items: [
        { label: 'Goods Receipt Note', icon: PackageCheck },
        { label: 'Material Reorder', icon: AlertTriangle },
        { label: 'Stock Status', icon: Boxes },
        { label: 'Price Comparison', icon: GitCompare },
        { label: 'Items Directory', icon: Boxes }
      ]
    },
    {
      title: 'Invoicing & Payments',
      icon: Receipt,
      items: [
        { label: 'Proforma Invoice', icon: FileText },
        { label: 'Invoice Management', icon: Receipt },
        { label: 'Payments', icon: Wallet }
      ]
    },
    {
      title: 'Analytics & Reports',
      icon: PieChart,
      items: [
        { label: 'Spend Analytics', icon: PieChart },
        { label: 'Procurement Reports', icon: FileBarChart },
        { label: 'Spend Reports', icon: TrendingUp },
        { label: 'Supplier Reports', icon: UserCheck }
      ]
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { label: 'Procurement Settings', icon: Settings },
        { label: 'Approval Workflows', icon: GitBranch },
        { label: 'Zoho Integration', icon: GitBranch }
      ]
    }
  ];

  // Map performa/proforma variant
  const normalizeTab = (tab) => {
    return tab === 'Performa Invoice' ? 'Proforma Invoice' : tab;
  };

  // Find index of the group that contains the active tab
  const getActiveGroupIndex = (tab) => {
    const norm = normalizeTab(tab);
    return groups.findIndex(group => 
      group.items.some(item => item.label === norm)
    );
  };

  // State to track which group is expanded
  const [expandedGroup, setExpandedGroup] = useState(() => {
    const activeIdx = getActiveGroupIndex(activeTab);
    return activeIdx !== -1 ? activeIdx : null;
  });

  // Hover state for collapsed sidebar submenus
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Keep expanded group in sync with active tab changes
  useEffect(() => {
    const activeIdx = getActiveGroupIndex(activeTab);
    if (activeIdx !== -1) {
      setExpandedGroup(activeIdx);
    }
  }, [activeTab]);

  // Reset hover state when active tab or collapsed state changes to clean up tooltips
  useEffect(() => {
    setHoveredGroup(null);
  }, [activeTab, collapsed]);

  const handleGroupClick = (index) => {
    if (collapsed) {
      onToggle();
      setExpandedGroup(index);
    } else {
      setExpandedGroup(prev => prev === index ? null : index);
    }
  };

  return (
    <aside 
      className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        height: 'auto',
        minHeight: '100vh',
        padding: collapsed ? 'var(--spacing-16) var(--spacing-8)' : 'var(--spacing-16)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-16)',
        overflowY: 'visible',
        backgroundColor: '#F8F9FA',
        borderRight: '1px solid var(--color-border)',
        position: 'relative'
      }}
    >
      {/* Floating Toggle Arrow Button on Right Border */}
      <div 
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '32px',
          right: '-12px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 101,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {collapsed ? (
          <ChevronRight style={{ width: '12px', height: '12px', color: '#64748B' }} />
        ) : (
          <ChevronLeft style={{ width: '12px', height: '12px', color: '#64748B' }} />
        )}
      </div>

      {/* Logo Header: Black pill with white dot */}
      <div className="sidebar-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: collapsed ? '0' : '4px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{
          width: '42px',
          height: '42px',
          backgroundColor: '#000000',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '3px solid #ffffff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#ffffff',
              borderRadius: '50%'
            }} />
          </div>
        </div>
        {!collapsed && (
          <span className="logo-text" style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>
            ControlRoom
          </span>
        )}
      </div>

      <br />

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', flex: 1, minHeight: 0 }}>
        
        {/* Dashboard (direct link) */}
        <div 
          className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
          onClick={() => onChangeTab('Dashboard')}
          style={{ 
            height: '44px', 
            padding: collapsed ? '0' : '0 var(--spacing-12)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : 'var(--spacing-12)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: activeTab === 'Dashboard' ? '#FFFFFF' : 'transparent',
            boxShadow: activeTab === 'Dashboard' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            color: activeTab === 'Dashboard' ? '#1E293B' : '#64748B'
          }}
        >
          <LayoutDashboard style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          {!collapsed && <span>Dashboard</span>}
        </div>

        {/* Accordion / Dropdown groups */}
        {groups.map((group, idx) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroup === idx;
          const isChildActive = group.items.some(item => 
            normalizeTab(item.label) === normalizeTab(activeTab)
          );
          const isParentActive = collapsed ? isChildActive : (isChildActive && !isExpanded);

          return (
            <div 
              key={idx} 
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}
              onMouseEnter={() => collapsed && setHoveredGroup(idx)}
              onMouseLeave={() => collapsed && setHoveredGroup(null)}
            >
              {/* Group Parent Item */}
              <div 
                className={`nav-item ${isParentActive ? 'active' : ''}`}
                onClick={() => handleGroupClick(idx)}
                style={{ 
                  height: '44px', 
                  padding: collapsed ? '0' : '0 var(--spacing-12)', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isParentActive ? '#1E293B' : '#64748B',
                  backgroundColor: isParentActive ? '#FFFFFF' : 'transparent',
                  boxShadow: isParentActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: collapsed ? '0' : 'var(--spacing-12)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  width: collapsed ? '100%' : 'auto'
                }}>
                  <GroupIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  {!collapsed && <span>{group.title}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown 
                    style={{ 
                      width: '14px', 
                      height: '14px', 
                      transition: 'transform 0.2s ease', 
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(-90deg)',
                      color: 'var(--color-text-secondary)'
                    }} 
                  />
                )}
              </div>

              {/* Collapsed Tooltip (Only shows when collapsed and hovered) */}
              {collapsed && hoveredGroup === idx && (
                <div 
                  style={{
                    position: 'absolute',
                    left: '64px',
                    top: '8px',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    fontWeight: '600',
                    zIndex: 200,
                    pointerEvents: 'none'
                  }}
                >
                  {group.title}
                </div>
              )}

              {/* Group Child Items (Expanded mode) */}
              <div 
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out',
                  maxHeight: (isExpanded && !collapsed) ? `${group.items.length * 42}px` : '0px',
                  opacity: (isExpanded && !collapsed) ? 1 : 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  paddingLeft: collapsed ? '0' : '28px',
                  marginTop: '2px'
                }}
              >
                {/* Vertical Connector Line */}
                {!collapsed && isExpanded && (
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '0',
                    bottom: '18px',
                    width: '1px',
                    backgroundColor: '#E2E8F0'
                  }} />
                )}

                {group.items.map((subItem, sIdx) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = normalizeTab(subItem.label) === normalizeTab(activeTab);

                  return (
                    <div 
                      key={sIdx}
                      className={`nav-item ${isSubActive ? 'active' : ''}`}
                      onClick={() => {
                        const targetTab = subItem.label === 'Proforma Invoice' ? 'Performa Invoice' : subItem.label;
                        onChangeTab(targetTab);
                      }}
                      style={{ 
                        position: 'relative',
                        height: '38px', 
                        padding: collapsed ? '0' : '0 var(--spacing-12)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? '0' : 'var(--spacing-8)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: isSubActive ? '600' : '500',
                        color: isSubActive ? '#1E293B' : '#64748B',
                        backgroundColor: isSubActive ? '#FFFFFF' : 'transparent',
                        boxShadow: isSubActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      {/* Horizontal Tick Connection */}
                      {!collapsed && (
                        <div style={{
                          position: 'absolute',
                          left: '-12px',
                          top: '50%',
                          width: '8px',
                          height: '1px',
                          backgroundColor: '#E2E8F0'
                        }} />
                      )}
                      <SubIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      {!collapsed && <span>{subItem.label}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
