import React from "react";
import "./styles/styles.css";
import { TimeSlider } from "./components/TimeSlider";

const demoTimes = [
  2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036,
  2037, 2038, 2039, 2040, 2041, 2042, 2043,
];

function App() {
  const setSelectedTime = (selectedTime: number) => {
    console.log({ selectedTime });
  };

  return (
    <div className="App">
      <header className="App-header">
        <TimeSlider times={demoTimes} setSelectedTime={setSelectedTime} />
      </header>
    </div>
  );
}

export default App;
