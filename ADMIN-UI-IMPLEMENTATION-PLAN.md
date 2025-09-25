# Admin UI Design System Implementation Plan

## 📋 Context

We are implementing a comprehensive admin UI design system for the sandwich shop application to create a consistent, professional, and user-friendly admin interface. The goal is to replace the existing ad-hoc admin components with a cohesive design system that provides:

- **Consistent visual design** across all admin pages
- **Responsive behavior** for mobile and desktop
- **Reusable components** following design system principles
- **Better user experience** with improved navigation and layouts

## 🎯 Implementation Method

We defined a systematic approach to ensure thorough and consistent implementation:

### 1. **Component Composition Pattern**

- Wrap existing shadcn/ui components with admin-specific styling
- Maintain full TypeScript support and accessibility features
- Keep all original functionality while adding custom design values
- Use Tailwind CSS classes for styling at the component level

### 2. **Design Review Process**

1. **Create component list** from the migrated products page, we'll review them one by one
2. **Interview-based design specification** - gather exact design requirements for each component state
3. **Implement design changes** values expressed in pixel, use tailwind css classes, if doesn't match take the closest ones
4. **Test and iterate** I will check the rend before validate so we can move on to the next
5. **Commit progress** regularly to maintain clean development history

### 3. **Responsive-First Approach**

- Mobile-first design with desktop enhancements
- Consistent breakpoint behavior (lg: 1024px+)
- Proper touch targets and mobile navigation patterns

## 🎯 Todo list

### **Components**

- [x] Component composition architecture established
- [x] Core layout components (Sidebar, PageTemplate, MenuItem) implemented
- [x] Responsive behavior and mobile navigation working
- [x] Products page successfully migrated to new system
- [x] MenuItem design specifications implemented
- [x] AdminSidebar design specifications implemented
- [x] AdminPageTemplate design specifications implemented
- [x] **AdminCard** - Removed hover shadow effects, static appearance
- [x] **AdminTable** - Overall table styling, borders, spacing
- [x] **AdminTableHeader** - 1px border, 12px horizontal padding, gray-50 background
- [x] **AdminTableHead** - 40px height, 12px/8px padding, 12px font-size, #555 color
- [x] **AdminTableBody** - Row styling, hover effects
- [x] **AdminTableRow** - 60px height for consistent row sizing
- [x] **AdminTableCell** - 60px min-height, 14px font-size, #111 color, vertical alignment
- [ ] **AdminButton** - All variants (default, hover, active, disabled, loading)
- [ ] **AdminBadge** - Color system (success, warning, info, error), sizing
- [ ] **AdminInput** - Border colors, focus states, validation styling
- [ ] **AdminLabel** - Typography, spacing, required indicators
- [ ] **AdminInputGroup** - Error states, helper text styling

## 🎨 Design Specifications Applied

### **Typography**

- Page titles: 24px (text-2xl)
- Menu items: 13px (text-sm, closest available)

### **Spacing System**

- Mobile padding: 24px standard
- Desktop padding: 48px standard
- Component gaps: 4px (menu items), 10px (icon-text)
- Component heights: 32px (menu items)

### **Color Palette**

- Sidebar background: #F5F5F5 (bg-gray-100)
- Main content: White
- Text colors: #555 (secondary), #111 (primary)
- Hover backgrounds: Contextual grays

### **Responsive Breakpoints**

- Mobile: < 1024px (lg breakpoint)
- Desktop: ≥ 1024px
- Sidebar: Hidden on mobile, overlay when opened

## 📁 File Structure

```
src/components/admin/
├── ui/                          # Wrapped shadcn/ui components
│   ├── AdminButton.tsx         ✅ Created
│   ├── AdminTable.tsx          ✅ Created
│   ├── AdminCard.tsx           ✅ Created
│   ├── AdminBadge.tsx          ✅ Created
│   ├── AdminInput.tsx          ✅ Created
│   ├── FilterBar.tsx           ✅ Created
│   ├── MenuItem.tsx            ✅ Created
│   └── index.ts                ✅ Created
├── layout/                      # Layout components
│   ├── AdminSidebar.tsx        ✅ Refined
│   └── AdminPageTemplate.tsx   ✅ Refined
└── index.ts                     ✅ Updated
```

---

_This document will be updated as we progress through the implementation phases._
