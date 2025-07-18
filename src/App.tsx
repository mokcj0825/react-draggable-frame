import './App.css'
import DraggableFrame from './DraggableFrame';

function App() {
  return (
    <div>
      <DraggableFrame>
        <div style={{ backgroundColor: 'green', width: '400px', height: '200px' }}>
          <h1>Hello World</h1>
        </div>
      </DraggableFrame>
    </div>
  );
}

export default App
