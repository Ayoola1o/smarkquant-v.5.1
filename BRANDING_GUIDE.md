# SmarkQuant Logo & Branding Guide

## Logo Files Created

### 1. **Main Logo** - `/frontend/logos/sm-logo.svg`
- **Purpose**: Main application logo with full design
- **Features**: Circular design with "S" and "M" letters, gradient colors (blue to amber)
- **SVG Format**: Scalable for any size

### 2. **Favicon SVG** - `/frontend/public/favicon.svg`
- **Purpose**: Browser favicon in SVG format
- **Size**: Scalable for any resolution
- **Used in**: Browser tabs, bookmarks

### 3. **Favicon PNG (32x32)** - `/frontend/public/favicon-32x32.png`
- **Purpose**: Favicon as PNG
- **Size**: 32x32 pixels
- **Used in**: Browser tabs, favicons

### 4. **Favicon PNG (180x180)** - `/frontend/public/favicon-180x180.png`
- **Purpose**: Apple touch icon (iPhone home screen)
- **Size**: 180x180 pixels
- **Used in**: iOS devices, Apple devices

### 5. **Logo SVG** - `/frontend/public/logo.svg`
- **Purpose**: Full logo for landing pages and headers
- **Format**: SVG with gradient styling
- **Used in**: Landing page, login page, signup page, sidebar

## Color Scheme
- **Primary Background**: `#1e3a8a` (Dark Blue)
- **Primary Border**: `#3b82f6` (Blue)
- **Gradient Start**: `#60a5fa` (Light Blue)
- **Gradient End**: `#fbbf24` (Amber)

## Usage Across the App

### 1. **Sidebar** (`/frontend/src/components/Sidebar.tsx`)
- Logo appears next to "SmarkQuant" text
- Image: `favicon.svg` (10x10 size)
- Interactive: Links to dashboard when clicked

### 2. **Landing Page** (`/frontend/src/app/page.tsx`)
- Large centered logo (24x24)
- Introduces the main application
- Uses `logo.svg`

### 3. **Login Page** (`/frontend/src/app/login/page.tsx`)
- Logo on left side (20x20)
- Branding element above welcome message
- Uses `logo.svg`

### 4. **Signup Page** (`/frontend/src/app/signup/page.tsx`)
- Logo on left side (20x20)
- Branding element above sign-up message
- Uses `logo.svg`

### 5. **Browser Favicon** (`/frontend/src/app/layout.tsx`)
- SVG favicon: Primary favicon format
- PNG favicon (32x32): Fallback
- Apple touch icon (180x180): iOS home screen
- Configured in meta tags and manifest

### 6. **Web App Manifest** (`/frontend/public/manifest.json`)
- Defines PWA settings
- Includes all logo sizes
- Allows app installation on mobile devices
- Start URL: `/dashboard`
- Theme colors: Blue (#1e3a8a)

## Design Specifications

### SM Logo
```
- Font: Arial Bold
- Letters: "S" and "M"
- Style: Modern, professional
- Gradient: Blue (#60a5fa) to Amber (#fbbf24)
- Background: Dark Blue circle (#1e3a8a)
- Border: Blue stroke (#3b82f6)
- Accents: Decorative line and corner circles
```

## Integration Summary

✅ **Browser Tabs**: Favicon displayed  
✅ **iOS Home Screen**: Apple touch icon configured  
✅ **Sidebar Navigation**: Logo with text branding  
✅ **Landing Page**: Full logo presentation  
✅ **Auth Pages**: Logo on login/signup  
✅ **Web App**: PWA manifest with all assets  
✅ **Meta Tags**: Theme colors and branding metadata  

## Files Modified

1. `/frontend/src/app/layout.tsx` - Added favicon links and manifest
2. `/frontend/src/components/Sidebar.tsx` - Replaced icon with logo
3. `/frontend/src/app/page.tsx` - Replaced Bot icon with logo
4. `/frontend/src/app/login/page.tsx` - Replaced Bot icon with logo
5. `/frontend/src/app/signup/page.tsx` - Replaced Bot icon with logo

## How to Use These Assets

### For Developers:
- All SVG logos maintain the same color scheme and design language
- PNG versions are provided for compatibility
- Manifest file enables PWA features

### For Branding:
- Use `sm-logo.svg` from `/logos/` folder for any branding materials
- Maintain the blue (#1e3a8a) and amber (#fbbf24) color scheme
- Logo is 200x200px in base design but scales infinitely with SVG

### For Future Updates:
- All logo files are in `/frontend/public/` and `/frontend/logos/`
- Colors are consistent across all versions
- Update manifest.json if adding new icon sizes
