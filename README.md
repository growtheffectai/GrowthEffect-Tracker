# GrowthEffect Tracker SDK

A lightweight JavaScript SDK for tracking landing page visits, form submissions, and UTM parameters.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Build the SDK:

```bash
npm run build
```

This will generate the compiled SDK at `dist/ge-tracker.min.js`.

### Development

To run the build process in watch mode (automatically rebuilds on file changes):

```bash
npm run dev
```

## Build Output

After building, the following files will be generated in the `dist/` folder:

- `ge-tracker.min.js` - Minified SDK bundle
- `index.d.ts` - TypeScript type definitions

## Usage

Include the built SDK in your HTML:

```html
<script src="dist/ge-tracker.min.js"></script>
```
