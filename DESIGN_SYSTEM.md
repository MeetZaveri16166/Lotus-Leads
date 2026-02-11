# LotusLeads Enterprise Design System

## Typography Scale

### Headings
- **Page Title (H1)**: `text-xl font-semibold text-gray-900` (20px)
- **Section Title (H2)**: `text-base font-semibold text-gray-900` (16px)
- **Subsection Title (H3)**: `text-sm font-semibold text-gray-900` (14px)
- **Card Title**: `text-sm font-semibold text-gray-800` (14px)

### Body Text
- **Primary Body**: `text-sm text-gray-700` (14px)
- **Secondary Body**: `text-sm text-gray-600` (14px)
- **Tertiary Body**: `text-xs text-gray-600` (12px)

### Labels & Meta
- **Form Label**: `text-xs font-semibold text-gray-700` (12px)
- **Meta Label**: `text-xs font-semibold text-gray-500 uppercase tracking-wider` (12px)
- **Meta Text**: `text-xs text-gray-500` (12px)
- **Badge Text**: `text-xs font-medium` (12px)

### Stats & Numbers
- **Large Stat**: `text-2xl font-bold text-gray-900` (24px)
- **Medium Stat**: `text-xl font-bold text-gray-900` (20px)
- **Small Stat**: `text-lg font-semibold text-gray-900` (18px)

## Color System

### Grays (Professional Palette)
- **Gray 50**: Background, subtle fills - `bg-gray-50`
- **Gray 100**: Subtle borders, dividers - `bg-gray-100` / `border-gray-100`
- **Gray 200**: Default borders, cards - `border-gray-200` / `bg-gray-200`
- **Gray 300**: Hover states, disabled - `border-gray-300` / `text-gray-300`
- **Gray 400**: Icons, placeholder - `text-gray-400`
- **Gray 500**: Labels, meta text - `text-gray-500`
- **Gray 600**: Secondary text - `text-gray-600`
- **Gray 700**: Primary body text - `text-gray-700`
- **Gray 800**: Subheadings - `text-gray-800`
- **Gray 900**: Headings, emphasis - `text-gray-900`

### Brand Colors
- **Primary Pink**: `#E64B8B` - CTA buttons, accents, active states
- **Pink Hover**: `#d85f93` - Hover states for pink elements

### Semantic Colors
- **Success Green**: `green-50`, `green-200`, `green-600`, `green-700`
- **Warning Yellow**: `yellow-50`, `yellow-200`, `yellow-600`, `yellow-700`
- **Error Red**: `red-50`, `red-200`, `red-500`, `red-600`
- **Info Blue**: `blue-50`, `blue-200`, `blue-600`, `blue-700`

## Component Patterns

### Section Headers (Primary)
```tsx
<div className="flex items-center gap-3 mb-5">
  <div className="w-1 h-5 bg-[#E64B8B] rounded-full"></div>
  <h2 className="text-base font-semibold text-gray-900">Section Title</h2>
</div>
```

### Section Headers (Secondary)
```tsx
<div className="flex items-center gap-2 mb-4">
  <Icon className="w-4 h-4 text-gray-600" />
  <h3 className="text-sm font-semibold text-gray-800">Subsection Title</h3>
</div>
```

### Cards (Standard)
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  {/* Content */}
</div>
```

### Stat Cards
```tsx
<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
    Label
  </div>
  <div className="text-xl font-bold text-gray-900 mb-1">
    Value
  </div>
  <div className="text-xs text-gray-600">
    Unit
  </div>
</div>
```

### Buttons (Primary)
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#E64B8B] text-white hover:bg-[#d85f93] transition-colors">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

### Buttons (Secondary)
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

### Badges (Status)
```tsx
<span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
  Badge Text
</span>
```

### Input Fields
```tsx
<input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E64B8B]/20 focus:border-[#E64B8B] transition-all" />
```

## Spacing System

### Padding
- **Card Padding**: `p-6` (24px)
- **Compact Card**: `p-4` (16px)
- **Button Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Input Padding**: `px-3 py-2` (12px horizontal, 8px vertical)

### Margins
- **Section Gap**: `space-y-6` (24px)
- **Card Gap**: `gap-4` (16px)
- **Header Margin**: `mb-5` or `mb-6` (20-24px)
- **Subsection Margin**: `mb-4` (16px)

### Border Radius
- **Standard**: `rounded-lg` (8px)
- **Small**: `rounded-md` (6px)
- **Pill**: `rounded-full`

## Layout

### Container
```tsx
<div className="max-w-[1800px] mx-auto px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid Layouts
- **2-col**: `grid grid-cols-1 md:grid-cols-2 gap-4`
- **3-col**: `grid grid-cols-1 md:grid-cols-3 gap-4`
- **4-col**: `grid grid-cols-2 md:grid-cols-4 gap-4`

## Transitions
- **Standard**: `transition-colors` or `transition-all`
- **Duration**: Default 150ms (implicit)
