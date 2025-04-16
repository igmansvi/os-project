/**
 * API Simulation Module
 * This module simulates an API that generates random processes for the scheduling simulation.
 */

const API = {
  /**
   * Generate a list of random processes with different attributes
   * @param {number} count - Number of processes to generate
   * @returns {Array} Array of process objects
   */
  getProcesses: function (count) {
    const processes = [];

    for (let i = 0; i < count; i++) {
      const process = {
        pid: i + 1,
        arrivalTime: Math.floor(Math.random() * 10),
        burstTime: Math.floor(Math.random() * 10) + 1, // Minimum burst time of 1
        priority: Math.floor(Math.random() * 5) + 1, // Priority 1-5 (lower is higher priority)
        remainingTime: 0, // Will be set equal to burstTime during initialization
        waitingTime: 0,
        turnaroundTime: 0,
        completionTime: 0,
        startTime: -1, // -1 indicates not started yet
        status: "waiting", // waiting, ready, running, completed
        executionHistory: [],
        color: this.getRandomColor(),
      };

      processes.push(process);
    }

    // Sort by arrival time to simulate real-world process arrival
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    return processes;
  },

  /**
   * Generate a random color for process visualization
   * @returns {string} HEX color code
   */
  getRandomColor: function () {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA69E",
      "#9FA4C4",
      "#B5EAD7",
      "#C7CEEA",
      "#E2F0CB",
      "#FFDAC1",
      "#FF9AA2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  /**
   * Generate AI-based optimization suggestions based on simulation results
   * @param {Object} metrics - Current simulation metrics
   * @param {string} algorithm - Current algorithm being used
   * @returns {Object} Suggestions object with bottlenecks and recommendations
   */
  getOptimizationSuggestions: function (metrics, algorithm) {
    // Default suggestion when not enough data
    if (!metrics || metrics.avgWaitingTime === 0) {
      return {
        bottlenecks: ["Not enough simulation data to analyze."],
        recommendations: [
          "Run the simulation to get optimization suggestions.",
        ],
      };
    }

    const suggestions = {
      bottlenecks: [],
      recommendations: [],
    };

    // Check CPU utilization
    if (metrics.cpuUtilization < 70) {
      suggestions.bottlenecks.push("Low CPU utilization detected.");
      suggestions.recommendations.push(
        "Consider using a more efficient scheduling algorithm to increase CPU utilization."
      );
    }

    // Check waiting time
    if (metrics.avgWaitingTime > 10) {
      suggestions.bottlenecks.push("High average waiting time detected.");

      if (algorithm === "fcfs") {
        suggestions.recommendations.push(
          "Consider using Shortest Job First (SJF) to reduce waiting time for shorter processes."
        );
      } else if (algorithm === "sjf") {
        suggestions.recommendations.push(
          "Consider using Round Robin for better responsiveness if the system has many interactive processes."
        );
      } else if (algorithm === "priority") {
        suggestions.recommendations.push(
          "Your priority values might need adjustment, or consider aging mechanisms to prevent starvation."
        );
      } else if (algorithm === "round-robin") {
        suggestions.recommendations.push(
          "Try adjusting the time quantum: smaller for better responsiveness, larger for less context switching overhead."
        );
      }
    }

    // Check turnaround time
    if (metrics.avgTurnaroundTime > 10) {
      suggestions.bottlenecks.push("High average turnaround time detected.");
      suggestions.recommendations.push(
        "Processes are taking too long to complete. Consider reordering process execution or increasing resources."
      );
    }

    // Check context switches
    if (metrics.contextSwitches > metrics.completedProcesses * 2) {
      suggestions.bottlenecks.push("Excessive context switching detected.");

      if (algorithm === "round-robin") {
        suggestions.recommendations.push(
          "Increase the time quantum to reduce context switching overhead."
        );
      } else {
        suggestions.recommendations.push(
          "Review process priorities or consider batching similar processes together."
        );
      }
    }

    // If no specific issues found
    if (suggestions.bottlenecks.length === 0) {
      suggestions.bottlenecks.push("No significant bottlenecks detected.");
      suggestions.recommendations.push(
        `Current ${algorithm.toUpperCase()} configuration is performing well.`
      );
    }

    return suggestions;
  },
};
