# ControlRoom — Full-Page Detail Screen Design System

The user has APPROVED and LIKES this specific UI style. Apply it to ALL full-page detail/verification screens (Dispatch, Accounts, Invoice, etc.).

## Design Principles

### 1. Gradient Status Banner Header
- Full-width header card with a **dynamic gradient background** that changes based on record status:
  - **Pending / Default**: `linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)` (Deep Navy Blue)
  - **Partial / Warning**: `linear-gradient(135deg, #78350F 0%, #92400E 100%)` (Warm Amber)
  - **Complete / Success**: `linear-gradient(135deg, #064E3B 0%, #065F46 100%)` (Forest Green)
- Box shadow matches gradient color: `0 8px 24px rgba(...)` with 0.35 opacity
- **Back button**: `rgba(255,255,255,0.15)` bg, `1px solid rgba(255,255,255,0.3)` border, white text, `backdropFilter: blur(4px)`
- **Primary Save button**: White `#FFFFFF` bg, text color adapts to status color
- BOM/Record code: frosted pill badge with `rgba(255,255,255,0.2)` bg
- Status badge: light colored pill (e.g. `#DCFCE7/#166534` for success)
- Title: white `#FFFFFF`, `fontWeight: 900`, `fontSize: 20px`

### 2. Stat Cards Row (4 columns)
- `backgroundColor: '#FFFFFF'`, `borderRadius: '14px'`, `border: '1px solid #E2E8F0'`, `boxShadow: '0 2px 8px rgba(0,0,0,0.04)'`
- Icon badge: `44x44px`, `borderRadius: 12px`, gradient background, colored box-shadow
- Label: `11px`, `700 weight`, `#94A3B8`, uppercase, `letterSpacing: 0.5px`
- Value: `22px`, `900 weight`, `#0F172A`

### 3. Animated Progress Bar Card
- Full-width white card, flex row layout
- Bar: `height: 12px`, `background: #F1F5F9`, gradient fill matching status color
- Transition: `width 0.4s cubic-bezier(0.4, 0, 0.2, 1)`

### 4. Checklist / Data Table Card
- Container: white, `borderRadius: 16px`, `boxShadow: 0 2px 8px rgba(0,0,0,0.04)`, `overflow: hidden`
- Toolbar: `linear-gradient(135deg, #FAFBFC, #F8FAFC)`, `borderBottom: 2px solid #F1F5F9`
- Table header: `#F8FAFC` bg, `11px` uppercase labels, `#64748B`
- Rows: **click entire row** to toggle state, packed rows highlight `#F0FDF4`
- Custom checkboxes: `22x22px`, `borderRadius: 6px`, green fill + white CheckCircle icon when packed
- Status pills: `borderRadius: 20px`, green or orange color scheme
- Table footer: `#FAFBFC`, gradient Save button: `linear-gradient(135deg, #1E40AF, #2563EB)`

## Key Colors
- Primary: `#2563EB` / `#1E40AF`
- Success: `#166534` / `#16A34A`
- Warning: `#B45309` / `#D97706`  
- Border: `#E2E8F0`
- Subtle bg: `#F8FAFC`
- Text: `#0F172A` / `#64748B` / `#94A3B8`
- Font: `'DM Sans', sans-serif`
