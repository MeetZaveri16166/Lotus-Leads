# Enterprise Design System for Sales Prospecting SaaS

## Color Palette

### Primary
- **Brand**: `#E64B8B` (Lotus Pink) - Use sparingly for primary actions and key highlights
- **Brand Light**: `#F5E6ED` - Subtle backgrounds for brand elements

### Neutrals (Professional Gray Scale)
- **Gray 50**: `#F9FAFB` - Page background
- **Gray 100**: `#F3F4F6` - Card background alternate
- **Gray 200**: `#E5E7EB` - Borders
- **Gray 300**: `#D1D5DB` - Disabled states
- **Gray 400**: `#9CA3AF` - Placeholders
- **Gray 500**: `#6B7280` - Secondary text
- **Gray 600**: `#4B5563` - Body text
- **Gray 700**: `#374151` - Headings
- **Gray 800**: `#1F2937` - Dark headings
- **Gray 900**: `#111827` - Primary text

### Semantic Colors (Data-Driven)
- **Success**: `#10B981` (Green) - Opportunities, positive metrics
- **Success Light**: `#D1FAE5` - Success backgrounds
- **Warning**: `#F59E0B` (Amber) - Cautions, moderate priority
- **Warning Light**: `#FEF3C7` - Warning backgrounds
- **Danger**: `#EF4444` (Red) - Risks, critical items
- **Danger Light**: `#FEE2E2` - Danger backgrounds
- **Info**: `#3B82F6` (Blue) - Informational, neutral data
- **Info Light**: `#DBEAFE` - Info backgrounds

### Avoid
- ❌ Bright gradients
- ❌ Multiple competing colors in one section
- ❌ Excessive use of brand color

## Typography

### Headings
- **Page Title**: `text-2xl font-bold text-gray-900`
- **Section Title**: `text-lg font-semibold text-gray-800`
- **Subsection**: `text-base font-semibold text-gray-700`
- **Card Title**: `text-sm font-semibold text-gray-700`

### Body Text
- **Primary**: `text-sm text-gray-600`
- **Secondary**: `text-xs text-gray-500`
- **Label**: `text-xs font-medium text-gray-500 uppercase tracking-wide`

### Data/Metrics
- **Large Metric**: `text-3xl font-bold text-gray-900`
- **Medium Metric**: `text-xl font-semibold text-gray-800`
- **Small Metric**: `text-base font-medium text-gray-700`

## Component Patterns

### Data Cards
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
    Label
  </div>
  <div className="text-2xl font-bold text-gray-900">
    Value
  </div>
  <div className="text-xs text-gray-500 mt-1">
    Supporting info
  </div>
</div>
```

### Section Headers
```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <div className="w-1 h-6 bg-[#E64B8B] rounded-full"></div>
    <h2 className="text-lg font-semibold text-gray-800">Section Title</h2>
  </div>
  <button className="text-sm text-gray-500 hover:text-gray-700">Action</button>
</div>
```

### Status Badges
```tsx
// Success
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>

// Warning
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
  Pending
</span>

// Danger
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Critical
</span>
```

### Insight Cards (Professional)
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-5">
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Title</h4>
      <p className="text-sm text-gray-600 leading-relaxed">Description</p>
    </div>
  </div>
</div>
```

## Layout Principles

### Spacing
- **Section Gap**: `space-y-8`
- **Card Gap**: `gap-4` or `gap-6`
- **Tight**: `gap-2` or `space-y-2`

### Grid Layouts
- **Metrics**: `grid-cols-2 md:grid-cols-4 gap-4`
- **Cards**: `grid-cols-1 lg:grid-cols-2 gap-6`
- **Dense Data**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### Whitespace
- Use generous padding: `p-6` for cards, `p-8` for sections
- Clear visual breathing room
- Don't pack too much into small spaces

## Information Hierarchy

### Priority Levels
1. **Critical**: Large, bold, top of page
2. **High**: Clear headings, prominent placement
3. **Medium**: Standard cards, grouped logically
4. **Low**: Collapsed details, secondary info

### Scanning Patterns
- Users scan F-pattern (top-left to right, then down)
- Put critical info top-left
- Use left border accent for importance
- Group related data

## Do's and Don'ts

### ✅ DO
- Use consistent spacing
- Align elements properly
- Use semantic colors (green = good, red = bad)
- Show data in scannable format
- Use subtle shadows for depth
- Keep backgrounds neutral (white/gray-50)
- Use brand color for CTAs and key highlights only

### ❌ DON'T
- Mix too many colors
- Use emojis in data displays (save for very specific cases)
- Create busy gradients
- Use inconsistent spacing
- Make everything bright
- Hide important data in collapsed sections

## Enterprise SaaS References
- **Salesforce**: Clean grids, strong data hierarchy
- **HubSpot**: Professional orange accent, clear CTAs
- **Tableau**: Data-first design, minimal decoration
- **Asana**: Clear sections, purposeful color use
- **Linear**: Minimalist, high contrast, excellent typography
