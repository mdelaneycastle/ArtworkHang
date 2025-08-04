# ArtHang - Artwork Visualization Tool

A modern web app that helps you visualize how artwork will look on your wall at real size before purchasing.

## Features

### ✨ Modern Improvements Over Original
- **React-based architecture** with hooks and modern state management
- **Mobile-first responsive design** with touch support
- **Enhanced camera integration** with environment capture
- **Improved scaling calculations** with visual calibration
- **Better drag & drop interface** with smooth interactions
- **Professional UI/UX** with modern design system
- **Real-time preview** with perspective rotation
- **High-quality image export** at 2x resolution

### 🎯 Core Functionality
1. **Wall Photo Capture**: Take or upload photos of your wall
2. **Scale Calibration**: Click two points on a known distance (like a light switch)
3. **Artwork Selection**: Browse curated artwork by artist
4. **Real-Size Visualization**: See artwork at actual size on your wall
5. **Interactive Positioning**: Drag, rotate, and resize artwork
6. **Export Preview**: Download high-quality composite images

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How It Works

### 1. Calibration System
The app uses a two-point calibration system:
- Click two points on a known distance in your photo
- Enter the real-world distance (e.g., 8.5cm for a light switch)
- The app calculates pixels-per-centimeter ratio

### 2. Artwork Scaling
- Each artwork has a real-world size stored in `images.json`
- The app scales artwork based on calibration ratio
- Maintains proper aspect ratios and proportions

### 3. Perspective & Positioning
- Drag artwork to any position on the wall
- Rotate with perspective transformation (-45° to +45°)
- Real-time visual feedback

## Technical Stack

- **React 18** with modern hooks
- **Vite** for fast development and building
- **HTML2Canvas** for high-quality image export
- **Lucide React** for consistent icons
- **CSS Grid & Flexbox** for responsive layouts

## Browser Support

- Modern browsers with ES2018+ support
- Mobile browsers with camera access
- iOS Safari, Chrome, Firefox, Edge

## Data Structure

Artwork data is stored in `images.json`:

```json
[
  {
    "artist": "Artist Name",
    "images": [
      {
        "name": "artwork.jpg",
        "title": "Artwork Title", 
        "initialSize": 87.4
      }
    ]
  }
]
```

## Deployment

The app is a static site that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

```bash
npm run build
# Deploy the 'dist' folder
```

## Original Concept Credit

This modernizes the original concept while maintaining the core innovation of using two-point pixel measurement for real-world scale calibration.