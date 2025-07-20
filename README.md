# React Draggable Frame

A lightweight, responsive React component that creates multiple draggable frames with smart anchoring and touch support.

## Features

- **Draggable**: Click and drag anywhere on the frame
- **Touch Support**: Enhanced touch handling with event exhaustion control
- **Smart Anchoring**: Automatically anchors to left or right based on drop position with smooth transitions
- **Responsive**: Maintains relative position using percentage-based storage
- **Persistent**: Remembers position and anchor across sessions and window resizes
- **Customizable**: Accepts custom styles and CSS classes
- **Child-Driven**: Automatically sizes to fit content
- **Drag Threshold**: Smart drag detection to prevent accidental movements

## Installation

```bash
npm install react-draggable-frame
```

## Usage

```tsx
import { DraggableFrame } from 'react-draggable-frame';

function App() {
  return (
    <DraggableFrame 
      id="my-frame"
      defaultPosition={{ x: 20, y: 20 }}
      eventExhausted={true}
      anchored={true}
    >
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
| `id` | `string` | - | Unique identifier for the frame (required) |
| `children` | `ReactNode` | - | Content to display inside the frame |
| `defaultPosition` | `{ x: number, y: number }` | `{ x: 20, y: 20 }` | Initial position of the frame |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `React.CSSProperties` | `{}` | Custom inline styles |
| `eventExhausted` | `boolean` | `false` | When true, prevents touch events from propagating during drag |
| `anchored` | `boolean` | `false` | When true, frame snaps to left/right edge with smooth transition and maintains position on window resize |

## How It Works

1. **Drag**: Click and drag the frame with a smart threshold to prevent accidental movements
2. **Anchor**: When anchored mode is enabled, the frame smoothly transitions to the nearest side (left/right) on release
3. **Responsive**: Frame maintains its relative position using percentage-based storage
4. **Persistent**: Position is saved as a percentage of window dimensions for consistent positioning across different screen sizes
5. **Touch Handling**: Enhanced touch support with configurable event exhaustion for better mobile experience

## Examples

### Basic Usage
```tsx
<DraggableFrame id="basic-frame">
  <div>Simple content</div>
</DraggableFrame>
```

### Multiple Frames
```tsx
function App() {
  return (
    <div>
      {/* Left-side notification frame */}
      <DraggableFrame 
        id="notifications"
        defaultPosition={{ x: 20, y: 20 }}
        anchored={true}
        eventExhausted={true}
      >
        <div className="notifications-panel">
          <h3>Notifications</h3>
          <div>New messages: 3</div>
        </div>
      </DraggableFrame>

      {/* Right-side chat frame */}
      <DraggableFrame 
        id="chat"
        defaultPosition={{ x: window.innerWidth - 320, y: 20 }}
        anchored={true}
        eventExhausted={true}
      >
        <div className="chat-panel">
          <h3>Chat</h3>
          <div>Online users: 5</div>
        </div>
      </DraggableFrame>

      {/* Floating tools frame */}
      <DraggableFrame 
        id="tools"
        defaultPosition={{ x: 100, y: 100 }}
        eventExhausted={true}
      >
        <div className="tools-panel">
          <h3>Tools</h3>
          <button>Select</button>
          <button>Draw</button>
        </div>
      </DraggableFrame>
    </div>
  );
}
```

#### Managing Multiple Frames

When using multiple frames, keep in mind:

- Each frame must have a unique `id` prop
- Frames operate independently and maintain their own state
- Position storage is handled separately for each frame using their unique IDs
- You can mix anchored and non-anchored frames
- Event exhaustion can be configured per frame

### Anchored Frame with Event Control
```tsx
<DraggableFrame 
  id="anchored-frame"
  defaultPosition={{ x: 100, y: 100 }}
  anchored={true}
  eventExhausted={true}
  className="my-custom-frame"
  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
>
  <div style={{ padding: '20px' }}>
    <h3>Anchored Frame</h3>
    <p>This frame will snap to the nearest edge!</p>
  </div>
</DraggableFrame>
```

### Large Content
```tsx
<DraggableFrame id="large-frame">
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
