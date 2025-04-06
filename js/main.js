/**
 * Main Application Module
 * Initializes the application and ties components together
 */

// Initialize application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("ProcessOptimizeAI Dashboard loaded.");

  // Make sure UI is defined before initializing it
  if (typeof UI !== "undefined") {
    // Initialize UI components
    UI.init();
  } else {
    console.error("UI module not loaded properly");
  }

  // Make sure Dashboard is defined before initializing it
  if (typeof Dashboard !== "undefined") {
    // Initialize Dashboard
    Dashboard.init();
  } else {
    console.error("Dashboard module not loaded properly");
  }

  // Display welcome message
  const aiSuggestions = document.getElementById("ai-suggestions");
  if (aiSuggestions) {
    aiSuggestions.innerHTML = `
          <p class="font-semibold">Welcome to ProcessOptimizeAI Dashboard!</p>
          <ol class="list-decimal pl-5 mt-2">
              <li>Select a scheduling algorithm</li>
              <li>Click "Generate Processes" to create a random process queue</li>
              <li>Use the simulation controls to start/pause or step through the simulation</li>
              <li>Observe the metrics and AI suggestions for optimizing your CPU scheduling</li>
              <li>Compare different algorithms using the comparison tool</li>
          </ol>
      `;
  }
});
