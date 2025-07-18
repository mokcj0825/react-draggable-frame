# React Draggable Frame

A lightweight, responsive React component that creates draggable frames with smart anchoring and touch support.

## Features

- 🖱️ **Draggable**: Click and drag anywhere on the frame
- 📱 **Touch Support**: Works on mobile devices
- 🎯 **Smart Anchoring**: Automatically anchors to left or right based on drop position
- 📐 **Responsive**: Maintains anchor position when screen resizes
- 💾 **Persistent**: Remembers position and anchor across sessions
- 🎨 **Customizable**: Accepts custom styles and CSS classes
- 📦 **Child-Driven**: Automatically sizes to fit content

## Installation

```bash
npm install react-draggable-frame
```

## Usage

```tsx
import { DraggableFrame } from 'react-draggable-frame';

function App() {
  return (
    <DraggableFrame defaultPosition={{ x: 20, y: 20 }}>
      <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #ccc' }}>
        <h2>Draggable Content</h2>
        <p>This frame can be dragged anywhere!</p>
        <button>Click me</button>
      </div>
    </DraggableFrame>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to display inside the frame |
| `defaultPosition` | `{ x: number, y: number }` | `{ x: 20, y: 20 }` | Initial position of the frame |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `React.CSSProperties` | `{}` | Custom inline styles |

## How It Works

1. **Drag**: Click and drag the frame anywhere on screen
2. **Anchor**: When you release, the frame anchors to the nearest side (left/right)
3. **Responsive**: Frame maintains its anchor position when screen resizes
4. **Persistent**: Position and anchor are saved to localStorage

## Examples

### Basic Usage
```tsx
<DraggableFrame>
  <div>Simple content</div>
</DraggableFrame>
```

### Custom Styling
```tsx
<DraggableFrame 
  defaultPosition={{ x: 100, y: 100 }}
  className="my-custom-frame"
  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
>
  <div style={{ padding: '20px' }}>
    <h3>Custom Styled Frame</h3>
  </div>
</DraggableFrame>
```

### Large Content
```tsx
<DraggableFrame>
  <div style={{ width: '400px', height: '300px', padding: '20px' }}>
    <h1>Large Content</h1>
    <p>This frame will automatically size to fit this content.</p>
  </div>
</DraggableFrame>
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
