/**
 * UI Module
 * Handles UI rendering and updates for the scheduler dashboard
 */

const UI = {
  /**
   * Initialize UI components
   */
  init: function () {
    // Set up algorithm select dropdown event
    document
      .getElementById("algorithm-select")
      .addEventListener("change", function () {
        // Update relevant configuration options based on algorithm selection
        const rrQuantumContainer = document.getElementById(
          "rr-quantum-container"
        );
        const mlqConfigContainer = document.getElementById(
          "mlq-config-container"
        );
        const preemptiveContainer = document.getElementById(
          "preemptive-container"
        );

        // Hide all algorithm-specific options first
        rrQuantumContainer.classList.add("hidden");
        mlqConfigContainer.classList.add("hidden");

        // Show/hide preemptive toggle based on algorithm
        if (["sjf", "priority"].includes(this.value)) {
          preemptiveContainer.classList.remove("hidden");
          document.getElementById("preemptive-toggle").disabled = false;
        } else if (this.value === "srt") {
          preemptiveContainer.classList.remove("hidden");
          document.getElementById("preemptive-toggle").checked = true;
          document.getElementById("preemptive-toggle").disabled = true;
        } else {
          preemptiveContainer.classList.add("hidden");
        }

        // Show relevant algorithm-specific options
        if (this.value === "round-robin") {
          rrQuantumContainer.classList.remove("hidden");
        } else if (this.value === "mlq") {
          mlqConfigContainer.classList.remove("hidden");
        }
      });

    // Initialize CPU utilization chart
    this.initCpuChart();
  },

  /**
   * Initialize CPU utilization chart
   */
  initCpuChart: function () {
    const ctx = document.getElementById("cpu-chart").getContext("2d");

    this.cpuChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "CPU Utilization (%)",
            data: [],
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            tension: 0.3,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Utilization %",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
        },
      },
    });
  },

  /**
   * Update CPU utilization chart with new data
   * @param {number} time - Current time
   * @param {number} utilization - Current CPU utilization percentage
   */
  updateCpuChart: function (time, utilization) {
    // Add new data point
    this.cpuChart.data.labels.push(time);
    this.cpuChart.data.datasets[0].data.push(utilization);

    // Keep chart size reasonable by removing old data if too many points
    if (this.cpuChart.data.labels.length > 50) {
      this.cpuChart.data.labels.shift();
      this.cpuChart.data.datasets[0].data.shift();
    }

    this.cpuChart.update();
  },

  /**
   * Render process table with current process data
   * @param {Array} processes - Array of process objects
   */
  renderProcessTable: function (processes) {
    const tableBody = document.getElementById("process-table-body");
    tableBody.innerHTML = "";

    processes.forEach((process) => {
      const row = document.createElement("tr");

      // Add highlight class to the currently running process
      if (process.status === "running") {
        row.classList.add("bg-yellow-100");
      } else if (process.status === "completed") {
        row.classList.add("bg-green-100");
      }

      row.innerHTML = `
                <td class="p-2 border">P${process.pid}</td>
                <td class="p-2 border">${process.arrivalTime}</td>
                <td class="p-2 border">${process.burstTime}</td>
                <td class="p-2 border">${process.priority}</td>
                <td class="p-2 border">
                    <span class="px-2 py-1 rounded text-xs ${this.getStatusClass(
                      process.status
                    )}">
                        ${
                          process.status.charAt(0).toUpperCase() +
                          process.status.slice(1)
                        }
                    </span>
                </td>
            `;

      tableBody.appendChild(row);
    });
  },

  /**
   * Get CSS class for process status
   * @param {string} status - Process status
   * @returns {string} CSS class for the status
   */
  getStatusClass: function (status) {
    switch (status) {
      case "waiting":
        return "bg-gray-200 text-gray-800";
      case "ready":
        return "bg-blue-200 text-blue-800";
      case "running":
        return "bg-yellow-200 text-yellow-800";
      case "completed":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  },

  /**
   * Update performance metrics display
   * @param {Object} metrics - Metrics object with performance data
   */
  updateMetrics: function (metrics) {
    document.getElementById(
      "avg-waiting-time"
    ).textContent = `${metrics.avgWaitingTime.toFixed(1)} ms`;
    document.getElementById(
      "avg-turnaround-time"
    ).textContent = `${metrics.avgTurnaroundTime.toFixed(1)} ms`;
    document.getElementById(
      "throughput"
    ).textContent = `${metrics.throughput.toFixed(3)} proc/ms`;
    document.getElementById(
      "cpu-utilization"
    ).textContent = `${metrics.cpuUtilization.toFixed(0)}%`;
    document.getElementById("context-switches").textContent =
      metrics.contextSwitches;
  },

  /**
   * Update current simulation time display
   * @param {number} time - Current simulation time
   */
  updateTime: function (time) {
    document.getElementById("current-time").textContent = `${time} ms`;
  },

  /**
   * Render Gantt chart with process execution data
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   */
  renderGanttChart: function (processes, currentTime) {
    const ganttChart = document.getElementById("gantt-chart");
    ganttChart.innerHTML = "";
    ganttChart.style.position = "relative";
    ganttChart.style.height = "60px";

    // Create a timeline with all execution segments from all processes
    const timelineSegments = [];

    processes.forEach((process) => {
      process.executionHistory.forEach((segment) => {
        timelineSegments.push({
          pid: process.pid,
          startTime: segment.startTime,
          endTime: segment.endTime,
          color: process.color,
        });
      });
    });

    // Sort segments by start time
    timelineSegments.sort((a, b) => a.startTime - b.startTime);

    // Calculate width percentage for each segment
    const maxTime = Math.max(currentTime, 1); // Avoid division by zero

    timelineSegments.forEach((segment) => {
      const segmentElement = document.createElement("div");
      const startPercent = (segment.startTime / maxTime) * 100;
      const widthPercent =
        ((segment.endTime - segment.startTime) / maxTime) * 100;

      segmentElement.style.position = "absolute";
      segmentElement.style.left = startPercent + "%";
      segmentElement.style.width = widthPercent + "%";
      segmentElement.style.height = "40px";
      segmentElement.style.top = "10px";
      segmentElement.style.backgroundColor = segment.color;
      segmentElement.style.borderRadius = "4px";
      segmentElement.style.display = "flex";
      segmentElement.style.alignItems = "center";
      segmentElement.style.justifyContent = "center";
      segmentElement.style.color = "#fff";
      segmentElement.style.fontSize = "12px";
      segmentElement.style.fontWeight = "bold";
      segmentElement.textContent = `P${segment.pid}`;

      // Add time label below
      const timeLabel = document.createElement("div");
      timeLabel.style.position = "absolute";
      timeLabel.style.left = startPercent + "%";
      timeLabel.style.bottom = "0";
      timeLabel.style.fontSize = "10px";
      timeLabel.textContent = segment.startTime;

      ganttChart.appendChild(segmentElement);
      ganttChart.appendChild(timeLabel);
    });

    // Add current time marker
    const currentTimeMarker = document.createElement("div");
    const currentTimePercent = (currentTime / maxTime) * 100;

    currentTimeMarker.style.position = "absolute";
    currentTimeMarker.style.left = currentTimePercent + "%";
    currentTimeMarker.style.height = "60px";
    currentTimeMarker.style.width = "2px";
    currentTimeMarker.style.backgroundColor = "red";
    currentTimeMarker.style.zIndex = "10";

    const timeLabel = document.createElement("div");
    timeLabel.style.position = "absolute";
    timeLabel.style.left = currentTimePercent + "%";
    timeLabel.style.bottom = "0";
    timeLabel.style.fontSize = "10px";
    timeLabel.style.fontWeight = "bold";
    timeLabel.style.color = "red";
    timeLabel.textContent = currentTime;

    ganttChart.appendChild(currentTimeMarker);
    ganttChart.appendChild(timeLabel);
  },

  /**
   * Update AI suggestions panel with optimization recommendations
   * @param {Object} suggestions - Suggestions object from AI analysis
   */
  updateAISuggestions: function (suggestions) {
    const suggestionsContainer = document.getElementById("ai-suggestions");
    let html = "";

    if (suggestions.bottlenecks.length > 0) {
      html +=
        '<h3 class="font-semibold text-red-600">Detected Bottlenecks:</h3>';
      html += '<ul class="list-disc pl-5 mb-2">';
      suggestions.bottlenecks.forEach((bottleneck) => {
        html += `<li>${bottleneck}</li>`;
      });
      html += "</ul>";
    }

    if (suggestions.recommendations.length > 0) {
      html += '<h3 class="font-semibold text-green-600">Recommendations:</h3>';
      html += '<ul class="list-disc pl-5">';
      suggestions.recommendations.forEach((recommendation) => {
        html += `<li>${recommendation}</li>`;
      });
      html += "</ul>";
    }

    suggestionsContainer.innerHTML = html;
  },

  /**
   * Update simulation control buttons based on simulation state
   * @param {boolean} isRunning - Whether simulation is currently running
   */
  updateControls: function (isRunning) {
    const startButton = document.getElementById("start-simulation");
    const pauseButton = document.getElementById("pause-simulation");
    const resetButton = document.getElementById("reset-simulation");
    const stepButton = document.getElementById("step-simulation");

    if (isRunning) {
      startButton.disabled = true;
      pauseButton.disabled = false;
      stepButton.disabled = true;

      startButton.classList.add("opacity-50", "cursor-not-allowed");
      pauseButton.classList.remove("opacity-50", "cursor-not-allowed");
      stepButton.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      startButton.disabled = false;
      pauseButton.disabled = true;
      stepButton.disabled = false;

      startButton.classList.remove("opacity-50", "cursor-not-allowed");
      pauseButton.classList.add("opacity-50", "cursor-not-allowed");
      stepButton.classList.remove("opacity-50", "cursor-not-allowed");
    }

    // Reset button is enabled if there's any simulation data
    if (document.getElementById("process-table-body").children.length > 0) {
      resetButton.disabled = false;
      resetButton.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      resetButton.disabled = true;
      resetButton.classList.add("opacity-50", "cursor-not-allowed");
    }
  },

  /**
   * Update algorithm visualization with current steps
   * @param {string} algorithm - Current scheduling algorithm
   * @param {Array} steps - Array of visualization steps
   */
  updateAlgorithmVisualization: function (algorithm, steps) {
    const visContainer = document.getElementById("algorithm-visualization");

    if (!algorithm || !steps || steps.length === 0) {
      visContainer.innerHTML = `
        <div class="text-center text-gray-500 py-10">
          Select an algorithm and start simulation to see visualization
        </div>
      `;
      return;
    }

    let html = `<h3 class="font-semibold mb-3">${this.getAlgorithmFullName(
      algorithm
    )} Visualization</h3>`;

    // Add algorithm explanation
    html += `<div class="mb-4 text-sm bg-blue-50 p-2 rounded">${this.getAlgorithmExplanation(
      algorithm
    )}</div>`;

    // Show recent steps (last 5 steps or fewer if not enough)
    html += `<div class="mb-3"><strong>Recent Steps:</strong></div>`;
    html += `<div class="overflow-y-auto max-h-32 mb-4">`;

    const recentSteps = steps.slice(-5);

    if (recentSteps.length === 0) {
      html += `<p class="text-gray-500">No steps yet. Start the simulation.</p>`;
    } else {
      recentSteps.forEach((step) => {
        const statusClass =
          step.status === "idle" ? "bg-gray-100" : "bg-green-100";
        html += `
          <div class="mb-2 p-2 rounded ${statusClass} text-sm">
            <strong>Time ${step.time}:</strong> 
            ${
              step.status === "idle"
                ? "CPU idle"
                : `Running P${step.selectedProcess}`
            }
            ${
              step.preempted
                ? " <span class='text-xs bg-yellow-200 px-1 rounded'>Preempted</span>"
                : ""
            }
            <div class="text-xs mt-1">
              Ready queue: ${this.formatReadyQueue(step.readyQueue, algorithm)}
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;

    visContainer.innerHTML = html;
  },

  /**
   * Format ready queue display based on algorithm
   * @param {Array} readyQueue - Array of ready processes
   * @param {string} algorithm - Current algorithm
   * @returns {string} Formatted ready queue HTML
   */
  formatReadyQueue: function (readyQueue, algorithm) {
    if (!readyQueue || readyQueue.length === 0) {
      return "<em>Empty</em>";
    }

    let formattedQueue = "";

    // Sort the queue based on algorithm to show expected execution order
    const sortedQueue = [...readyQueue];

    switch (algorithm) {
      case "fcfs":
        // Already sorted by arrival time (assumption)
        break;
      case "sjf":
      case "srt":
        sortedQueue.sort((a, b) => a.remainingTime - b.remainingTime);
        break;
      case "priority":
        sortedQueue.sort((a, b) => a.priority - b.priority);
        break;
      case "mlq":
        sortedQueue.sort((a, b) => a.priority - b.priority);
        break;
    }

    // Create queue representation
    formattedQueue = sortedQueue
      .map((p) => {
        let details = `P${p.pid}`;

        if (algorithm === "sjf" || algorithm === "srt") {
          details += `(${p.remainingTime})`;
        } else if (algorithm === "priority" || algorithm === "mlq") {
          details += `(pri:${p.priority})`;
        }

        return details;
      })
      .join(" → ");

    return formattedQueue;
  },

  /**
   * Get full name of algorithm
   * @param {string} algorithmKey - Algorithm key/id
   * @returns {string} Full algorithm name
   */
  getAlgorithmFullName: function (algorithmKey) {
    const names = {
      fcfs: "First Come First Served (FCFS)",
      sjf: "Shortest Job First (SJF)",
      srt: "Shortest Remaining Time (SRT)",
      priority: "Priority Scheduling",
      "round-robin": "Round Robin",
      mlq: "Multi-Level Queue (MLQ)",
    };

    return names[algorithmKey] || algorithmKey.toUpperCase();
  },

  /**
   * Get explanation of how algorithm works
   * @param {string} algorithm - Algorithm key/id
   * @returns {string} Algorithm explanation
   */
  getAlgorithmExplanation: function (algorithm) {
    const explanations = {
      fcfs: "Processes are executed in the order they arrive. Simple but can lead to convoy effect where short processes wait behind long ones.",

      sjf: "Non-preemptive algorithm that selects the process with shortest burst time. Minimizes average waiting time but may cause starvation of longer processes.",

      srt: "Preemptive version of SJF. If a new process arrives with shorter remaining time than current process, it gets CPU immediately.",

      priority:
        "Processes are selected based on priority value (lower number = higher priority). Can cause starvation of low priority processes.",

      "round-robin":
        "Each process gets a small time slice (quantum) in circular order. Good for time-sharing systems and better response time.",

      mlq: "Processes are assigned to different queues based on priority. Higher priority queues are serviced first, using FCFS within each queue.",
    };

    return (
      explanations[algorithm] || "No explanation available for this algorithm."
    );
  },

  /**
   * Update algorithm comparison panel with results
   * @param {Object} results - Comparison results object
   */
  updateAlgorithmComparison: function (results) {
    const compContainer = document.getElementById("algorithm-comparison");

    if (!results) {
      compContainer.innerHTML = `
        <div class="text-center text-gray-500 py-10">
          Click "Compare" to see results across algorithms
        </div>
      `;
      return;
    }

    let html = `<h3 class="font-semibold mb-3">Algorithm Comparison Results</h3>`;

    // Create comparison table
    html += `
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-200">
              <th class="p-2 text-left">Algorithm</th>
              <th class="p-2 text-right">Avg Wait</th>
              <th class="p-2 text-right">Avg Turnaround</th>
              <th class="p-2 text-right">CPU Util.</th>
              <th class="p-2 text-right">Context Switches</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Find best values for highlighting
    const bestWait = Math.min(
      ...Object.values(results).map((r) => r.avgWaitingTime)
    );
    const bestTurnaround = Math.min(
      ...Object.values(results).map((r) => r.avgTurnaroundTime)
    );
    const bestUtil = Math.max(
      ...Object.values(results).map((r) => r.cpuUtilization)
    );
    const bestSwitches = Math.min(
      ...Object.values(results).map((r) => r.contextSwitches)
    );

    // Add row for each algorithm
    Object.entries(results).forEach(([algo, metrics]) => {
      const isWaitBest = metrics.avgWaitingTime === bestWait;
      const isTurnaroundBest = metrics.avgTurnaroundTime === bestTurnaround;
      const isUtilBest = metrics.cpuUtilization === bestUtil;
      const isSwitchesBest = metrics.contextSwitches === bestSwitches;

      html += `
        <tr class="border-b">
          <td class="p-2">${this.getAlgorithmFullName(algo)}</td>
          <td class="p-2 text-right ${
            isWaitBest ? "bg-green-100 font-semibold" : ""
          }">${metrics.avgWaitingTime.toFixed(1)}</td>
          <td class="p-2 text-right ${
            isTurnaroundBest ? "bg-green-100 font-semibold" : ""
          }">${metrics.avgTurnaroundTime.toFixed(1)}</td>
          <td class="p-2 text-right ${
            isUtilBest ? "bg-green-100 font-semibold" : ""
          }">${metrics.cpuUtilization.toFixed(0)}%</td>
          <td class="p-2 text-right ${
            isSwitchesBest ? "bg-green-100 font-semibold" : ""
          }">${metrics.contextSwitches}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
      <div class="mt-3 text-xs text-gray-500">
        <p>Note: Green cells indicate best performance in that category</p>
      </div>
    `;

    compContainer.innerHTML = html;
  },
};
