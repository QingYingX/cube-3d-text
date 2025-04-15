# Cube 3D Text

[中文README](./README_CN.md)

[如何贡献纹理？](./CONTRIBUTING.md)

This is an online tool for creating **Minecraft**-style 3D text, built with **React** + **Three.js**.  
It offers multiple features that help quickly generate various 3D text effects.

**Live Demo: [Cube 3D Text](https://3dtext.easecation.net/)**

![Cube 3D Text](./preview.png)

## Features

- **Various Font Support**: Including Chinese fonts (any language), convenient for creating localized titles or logos (please mind font licensing)
- **Flexible Text Adjustment**: Real-time control of vertical positioning, size, spacing, and rotation
- **Outline Effect Based on Inverted Normals**: Uses expansion and modeling algorithms to achieve an outline look, which can also be realistically rendered and used in Minecraft
- **Real-time Preview & Camera Control**: Drag and zoom the 3D scene with the mouse to view the results in real time
- **One-click Screenshot**: Easily generate PNG images with transparent or other backgrounds at the click of a button
- **Multiple Material Presets**: Includes a variety of color, gradient, and texture presets that can be switched in one click
- **Texture Mapping Support**: Custom textures can be applied to the text surfaces
- **Face-level Customization**: Set solid colors, gradients, or textures separately for each face of the text for greater flexibility

## Development Plan

- [x] Allow flexible addition and removal of text lines
- [x] Local creation and saving of material templates
- [x] Export to standard 3D model files
- [ ] Export to Minecraft Bedrock Edition mesh format
- [x] Enable front outline (inner shadow) effects

## Project Structure

- **React Components**: Built with React, using UI libraries such as antd for interaction  
- **Three.js Rendering**: Responsible for 3D modeling, materials, lighting, shadows, and camera logic  
- **CSS/Style**: Standard CSS / Less / SASS or other preprocessors for styling  
- **Scripts**:  
  - `dev`: Starts the local development environment (Vite)  
  - `build`: First compiles TypeScript with tsc, then bundles with Vite  
  - `lint`: Runs ESLint for code style checks  
  - `preview`: Launches a preview server for the bundled files

## Quick Start

### 1. Clone the repo and install dependencies (using yarn)
```bash
git clone https://github.com/EaseCation/cube-3d-text.git
cd cube-3d-text
yarn
```

### 2. Start the development environment
```bash
yarn dev
```
This will start the Vite development server on port 3000 by default.  
Open http://localhost:3000 in a browser for real-time development and debugging.

### 3. Build
```bash
yarn build
```
When the build completes, the generated files are located in the dist/ folder, which can be directly deployed to static servers or other platforms.

### 4. Preview the build
```bash
npm run preview
```
Vite will launch a local preview server. Follow the preview link to see the bundled output.

# Tech Stack
- React: Front-end UI framework
- Three.js: 3D rendering, modeling, lighting, camera control, etc.
- @react-three/fiber and @react-three/drei: Common tools for integrating Three.js with React
- Ant Design (antd): Some UI components
- TypeScript

If any issues arise during use or development, feel free to open an Issue. Thank you for your support!

# License

MIT License
