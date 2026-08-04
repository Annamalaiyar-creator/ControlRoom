import React from 'react';
import { Package, Sun, Zap, Settings } from 'lucide-react';

export default function TopSpendingCategories() {
  const categories = [
    {
      name: 'Raw Materials',
      amount: '₹1,12,45,000',
      percentage: '45.2%',
      color: 'var(--color-primary-blue)',
      icon: Package
    },
    {
      name: 'Solar Components',
      amount: '₹68,30,000',
      percentage: '27.5%',
      color: 'var(--color-solar-orange)',
      icon: Sun
    },
    {
      name: 'Electrical Items',
      amount: '₹35,20,000',
      percentage: '14.2%',
      color: 'var(--color-info)',
      icon: Zap
    },
    {
      name: 'Mechanical Items',
      amount: '₹18,40,000',
      percentage: '7.4%',
      color: '#10b981',
      icon: Settings
    }
  ];

  return (
    <div className="section-card">
      <div 
        className="section-card-title" 
        style={{ justifyContent: 'space-between', borderBottom: 'none', marginBottom: 'var(--spacing-8)' }}
      >
        <span>Top Spending Categories</span>
        <a href="#" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary-blue)' }}>
          View Report
        </a>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)', flex: 1 }}>
        {categories.map((cat, idx) => {
          const IconComponent = cat.icon;
          return (
            <div key={idx} className="category-item" style={{ marginBottom: idx === categories.length - 1 ? 0 : '' }}>
              <div className="category-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconComponent style={{ width: '14px', height: '14px', color: 'var(--color-text-secondary)' }} />
                  <span>{cat.name}</span>
                </div>
                <div className="category-details">
                  <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{cat.amount}</span>
                  <span>{cat.percentage} of Spend</span>
                </div>
              </div>
              <div className="category-progress-bg">
                <div 
                  className="category-progress-fill" 
                  style={{ width: cat.percentage, backgroundColor: cat.color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
