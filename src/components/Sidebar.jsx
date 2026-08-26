import React, { useState, useEffect } from 'react';
import { 
  Boxes, LayoutDashboard, 
  ShoppingCart, FileText, Users, PackageCheck, 
  Receipt, Wallet, Award, PieChart, AlertTriangle, 
  GitCompare, FileBarChart, TrendingUp, UserCheck, 
  Settings, GitBranch, ChevronDown, ChevronLeft, ChevronRight,
  Search, HelpCircle, MessageSquare, Rocket, Sparkles, ChevronUp
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle, activeTab, onChangeTab, userRole = 'Procurement Head' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredItemPos, setHoveredItemPos] = useState(null);

  // Categorized Menu Sections Structure matching exact design layout
  const procurementSections = [
    {
      category: 'MAIN MENU',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Purchase Orders', icon: ShoppingCart, badge: '12' },
        { label: 'Items Directory', icon: Boxes },
        { label: 'Proforma Invoice', icon: FileText }
      ]
    },
    {
      category: 'TOOLS & OPERATIONS',
      items: [
        { label: 'Vendor Management', icon: Users },
        { label: 'Vendor Performance', icon: Award },
        { label: 'Material Calculation Engine', icon: GitCompare },
        { label: 'Material Reorder', icon: AlertTriangle, badge: '3' },
        { label: 'Price Comparison', icon: GitCompare },
        { label: 'Payments', icon: Wallet }
      ]
    },
    {
      category: 'WORKSPACE & REPORTS',
      items: [
        { label: 'Spend Analytics', icon: PieChart },
        { label: 'Procurement Reports', icon: FileBarChart },
        { label: 'Spend Reports', icon: TrendingUp },
        { label: 'Supplier Reports', icon: UserCheck }
      ]
    }
  ];

  const productionSections = [
    {
      category: 'MAIN MENU',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Work Orders', icon: Boxes, badge: '8' },
        { label: 'BOM Orders', icon: GitBranch, badge: '5' },
        { label: 'Inventory (Raw Material)', icon: Boxes }
      ]
    },
    {
      category: 'TOOLS & OPERATIONS',
      items: [
        { label: 'Planning & Scheduling', icon: FileText },
        { label: 'Production Monitoring', icon: TrendingUp },
        { label: 'Quality Control', icon: UserCheck },
        { label: 'Machine Maintenance', icon: Settings }
      ]
    },
    {
      category: 'WORKSPACE & REPORTS',
      items: [
        { label: 'Production Reports', icon: FileBarChart },
        { label: 'Efficiency Reports', icon: TrendingUp },
        { label: 'Downtime Analytics', icon: PieChart }
      ]
    }
  ];

  // Specific filtered sections for each role
  const getSectionsForRole = (role) => {
    let sections = [];

    if (role === 'Production Head' || role === 'Production Admin') {
      sections = [...productionSections];
    } else if (role === 'Dispatch Head') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dispatch Dashboard', icon: LayoutDashboard },
            { label: 'Dispatch Orders', icon: Boxes, badge: '4' },
            { label: 'Stock Status', icon: Boxes }
          ]
        },
        {
          category: 'WORKSPACE & REPORTS',
          items: [
            { label: 'Production Reports', icon: FileBarChart }
          ]
        }
      ];
    } else if (role === 'Floor Supervisor') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Work Orders', icon: Boxes, badge: '6' },
            { label: 'Planning & Scheduling', icon: FileText },
            { label: 'Production Monitoring', icon: TrendingUp }
          ]
        },
        {
          category: 'TOOLS & OPERATIONS',
          items: [
            { label: 'Downtime Analytics', icon: PieChart },
            { label: 'Machine Maintenance', icon: Settings }
          ]
        }
      ];
    } else if (role === 'Floor Employee') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Production Monitoring', icon: TrendingUp },
            { label: 'Work Orders', icon: Boxes }
          ]
        }
      ];
    } else if (role === 'Accounts Head' || role === 'Accounts Executive') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Accounts Verification', icon: CheckCircle },
            { label: 'Proforma Invoice', icon: FileText },
            { label: 'Payments', icon: Wallet }
          ]
        },
        {
          category: 'WORKSPACE & REPORTS',
          items: [
            { label: 'Spend Analytics', icon: PieChart },
            { label: 'Spend Reports', icon: TrendingUp }
          ]
        }
      ];
    } else if (role === 'Sales Head' || role === 'Sales Executive') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Proforma Invoice', icon: FileText },
            { label: 'BOM Orders', icon: GitBranch },
            { label: 'Customer Management', icon: UserCheck },
            { label: 'Stock Status', icon: Boxes }
          ]
        }
      ];
    } else if (role === 'Design Engineer' || role === 'Design Executive') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'BOM Orders', icon: GitBranch },
            { label: 'Material Calculation Engine', icon: GitCompare }
          ]
        }
      ];
    } else if (role === 'Invoice Executive') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Invoice Management', icon: Receipt },
            { label: 'Proforma Invoice', icon: FileText },
            { label: 'Payments', icon: Wallet }
          ]
        },
        {
          category: 'WORKSPACE & REPORTS',
          items: [
            { label: 'Spend Analytics', icon: PieChart },
            { label: 'Spend Reports', icon: TrendingUp }
          ]
        }
      ];
    } else if (role === 'BOM Executive') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'BOM Orders', icon: GitBranch },
            { label: 'Customer Management', icon: UserCheck },
            { label: 'Material Calculation Engine', icon: GitCompare }
          ]
        }
      ];
    } else if (role === 'CEO') {
      sections = [
        {
          category: 'MAIN MENU',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Work Orders', icon: Boxes, badge: '8' },
            { label: 'Purchase Orders', icon: ShoppingCart, badge: '12' },
            { label: 'Proforma Invoice', icon: FileText }
          ]
        },
        {
          category: 'WORKSPACE & REPORTS',
          items: [
            { label: 'Spend Analytics', icon: PieChart },
            { label: 'Production Reports', icon: FileBarChart },
            { label: 'Spend Reports', icon: TrendingUp }
          ]
        }
      ];
    } else {
      sections = [...procurementSections];
    }

    // Always ensure Zoho Integration is listed under SYSTEM & CONFIG
    const hasZoho = sections.some(s => s.items && s.items.some(i => i.label === 'Zoho Integration'));
    if (!hasZoho) {
      sections.push({
        category: 'SYSTEM & CONFIG',
        items: [
          { label: 'Zoho Integration', icon: GitBranch }
        ]
      });
    }

    return sections;
  };

  const sections = getSectionsForRole(userRole);

  const normalizeTab = (tab) => {
    return tab === 'Performa Invoice' ? 'Proforma Invoice' : tab;
  };

  const getBadgeStyle = (label) => {
    if (label === 'Purchase Orders') {
      return {
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
        border: '1px solid #C7D2FE'
      };
    }
    if (label === 'Work Orders') {
      return {
        backgroundColor: '#ECFDF5',
        color: '#059669',
        border: '1px solid #A7F3D0'
      };
    }
    if (label === 'BOM Orders') {
      return {
        backgroundColor: '#F3E8FF',
        color: '#7C3AED',
        border: '1px solid #DDD6FE'
      };
    }
    if (label === 'Material Reorder') {
      return {
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        border: '1px solid #FDE68A'
      };
    }
    if (label === 'Dispatch Orders') {
      return {
        backgroundColor: '#E0F2FE',
        color: '#0284C7',
        border: '1px solid #BAE6FD'
      };
    }
    return {
      backgroundColor: '#F1F5F9',
      color: '#475569',
      border: '1px solid #E2E8F0'
    };
  };

  // Filter sections by search query
  const filteredSections = sections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => 
      !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(sec => sec.items.length > 0);

  return (
    <aside 
      className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        width: collapsed ? '78px' : '260px',
        background: 'linear-gradient(180deg, #E4F1F6 0%, #EEF7FA 45%, #E3F0F5 100%)',
        borderRight: '1px solid #D2E4EC',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        padding: collapsed ? '16px 8px' : '16px 14px',
        boxSizing: 'border-box',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif"
      }}
    >

      {/* 1. TOP HEADER BRAND CARD */}
      <div 
        onClick={collapsed ? onToggle : undefined}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          padding: collapsed ? '8px' : '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          marginBottom: '14px',
          position: 'relative',
          cursor: collapsed ? 'pointer' : 'default'
        }}
        title={collapsed ? "Click to expand sidebar" : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Dark Hexagon Logo Box matching image */}
          <div style={{
            width: '38px',
            height: '38px',
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: '17px',
            letterSpacing: '-0.5px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
          }}>
            w.
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2', letterSpacing: '-0.3px' }}>
                ControlRoom Inc.
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                Enterprise Edition
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle button « */}
        {!collapsed && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.8)',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: '13px',
              fontWeight: '900',
              lineHeight: 1,
              transition: 'all 0.15s ease',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)'; }}
            title="Collapse Sidebar"
          >
            «
          </button>
        )}
      </div>

      {/* 2. SEARCH BAR INPUT WITH ⌘K BADGE */}
      {!collapsed ? (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '14px',
          height: '38px',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Search style={{ width: '15px', height: '15px', color: '#64748B', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              fontWeight: '600',
              color: '#0F172A',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '1px 5px' }}>⌘</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '1px 5px' }}>K</span>
          </div>
        </div>
      ) : (
        <div 
          onClick={onToggle}
          style={{
            height: '38px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: '14px'
          }}
          title="Search"
        >
          <Search style={{ width: '15px', height: '15px', color: '#64748B' }} />
        </div>
      )}

      {/* 3. SCROLLABLE NAVIGATION LIST */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '2px'
        }}
      >
        {filteredSections.map((sec, sIdx) => (
          <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {/* Category Header */}
            {!collapsed && (
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#64748B',
                letterSpacing: '0.04em',
                padding: '4px 8px 2px 8px',
                textTransform: 'none'
              }}>
                {sec.category}
              </span>
            )}

            {/* Nav Items */}
            {sec.items.map((item, iIdx) => {
              const ItemIcon = item.icon;
              const isActive = normalizeTab(item.label) === normalizeTab(activeTab);

              return (
                <div 
                  key={iIdx}
                  title={collapsed ? item.label : undefined}
                  onClick={() => {
                    const targetTab = item.label === 'Proforma Invoice' ? 'Performa Invoice' : item.label;
                    onChangeTab(targetTab);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredItem(item.label);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredItemPos({ label: item.label, top: rect.top + (rect.height / 2) });
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                    setHoveredItemPos(null);
                  }}
                  style={{
                    height: '40px',
                    borderRadius: '20px',
                    padding: collapsed ? '0' : '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#FFFFFF' : hoveredItem === item.label ? 'rgba(255, 255, 255, 0.55)' : 'transparent',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(15, 23, 42, 0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '10px', minWidth: 0 }}>
                    <ItemIcon style={{ 
                      width: '16px', 
                      height: '16px', 
                      color: isActive ? '#0F172A' : '#475569', 
                      flexShrink: 0 
                    }} />
                    {!collapsed && (
                      <span style={{
                        fontSize: '13.5px',
                        fontWeight: isActive ? '800' : '600',
                        color: isActive ? '#0F172A' : '#334155',
                        letterSpacing: '-0.015em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Badge pill in Expanded & Collapsed mode (Dark Slate Circle Badge matching reference image) */}
                  {item.badge && (
                    <span style={{
                      fontSize: collapsed ? '9.5px' : '11px',
                      fontWeight: '800',
                      borderRadius: collapsed ? '6px' : '10px',
                      padding: collapsed ? '1px 4.5px' : '2px 8px',
                      lineHeight: '1.2',
                      minWidth: collapsed ? '16px' : '20px',
                      textAlign: 'center',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                      position: collapsed ? 'absolute' : 'static',
                      top: collapsed ? '4px' : 'auto',
                      right: collapsed ? '6px' : 'auto',
                      zIndex: collapsed ? 2 : 1
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Section Divider Line */}
            {sIdx < filteredSections.length - 1 && (
              <div style={{ height: '1px', backgroundColor: 'rgba(203, 213, 225, 0.4)', margin: '6px 0' }} />
            )}
          </div>
        ))}


      </div>



      {/* FLOATING FIXED TOOLTIP PORTAL IN COLLAPSED MODE */}
      {collapsed && hoveredItemPos && (
        <div style={{
          position: 'fixed',
          left: '86px',
          top: `${hoveredItemPos.top}px`,
          transform: 'translateY(-50%)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12.5px',
          fontWeight: '700',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
          zIndex: 999999,
          pointerEvents: 'none',
          letterSpacing: '-0.1px'
        }}>
          {hoveredItemPos.label}
          {/* Arrow Indicator */}
          <div style={{
            position: 'absolute',
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            backgroundColor: '#0F172A'
          }} />
        </div>
      )}

    </aside>
  );
}
