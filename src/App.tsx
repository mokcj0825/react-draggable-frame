import './App.css'
import DraggableFrame from './DraggableFrame';

function App() {
  return (
    <div>
      <DraggableFrame id="1" eventExhausted={true}>
        <div style={{ backgroundColor: 'green', width: '400px', height: '200px' }} onClick={()=>{
          console.log('clicked');
        }}>
          <div>
          <h1>Hello World</h1>
          </div>
        </div>
      </DraggableFrame>
      <DraggableFrame id="2" eventExhausted={true}>
        <div style={{ backgroundColor: 'yellow', width: '400px', height: '200px' }} onClick={()=>{
          console.log('clicked2');
        }}>
          <h1>Hello World</h1>
        </div>
      </DraggableFrame>
      <DraggableFrame id="3" eventExhausted={true} anchored={true}>
        <div style={{ backgroundColor: 'blue', width: '400px', height: '200px' }} onClick={()=>{
          console.log('clicked3');
        }}>
          <h1>Hello World</h1>
        </div>
      </DraggableFrame>
    </div>
  );
}

export default App
