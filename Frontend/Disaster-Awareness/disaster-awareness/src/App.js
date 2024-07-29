import "./App.css";
import Map from "./Map";
import React from "react";

const userPosition = { lat: 64.1472, lng: -21.9398 };
const apikey = process.env.REACT_APP_API_KEY_HERE_MAPS;

function App() {
  return (
    <div className="App">
      <Map apikey={apikey} userPosition={userPosition} />
    </div>
  );
}

export default App;
