/**
 * Dashboard Module
 * Manages the simulation state, CPU utilization tracking, and overall dashboard functionality
 */

const Dashboard = {
  // Simulation state
  processes: [],
  originalProcesses: [], // Keep original state for reset
  currentTime: 0,
  isRunning: false,
  simulationInterval: null,
  simulationSpeed: 5, // Default speed (1-10)
  currentAlgorithm: "fcfs",
  timeQuantum: 2, // For Round Robin
  isPreemptive: false, // For preemptive algorithms
  mlqQueueCount: 3, // For Multi-Level Queue

  // For visualization
  visualizationSteps: [],

  // For Round Robin specific tracking
  currentRunningPid: null,
  currentQuantumUsed: 0,

  // Performance metrics tracking
  utilizationHistory: [],
  metrics: {
    avgWaitingTime: 0,
    avgTurnaroundTime: 0,
    cpuUtilization: 0,
    throughput: 0,
    contextSwitches: 0,
    completedProcesses: 0,
    totalProcesses: 0,
  },

  // For algorithm comparison
  comparisonResults: null,

  /**
   * Initialize the dashboard and simulation
   */
  init: function () {
    this.setupEventListeners();
  },

  /**
   * Set up event listeners for simulation controls
   */
  setupEventListeners: function () {
    // Generate Processes button
    document
      .getElementById("generate-processes")
      .addEventListener("click", () => {
        this.generateProcesses();
      });

    // Start button
    document
      .getElementById("start-simulation")
      .addEventListener("click", () => {
        this.startSimulation();
      });

    // Pause button
    document
      .getElementById("pause-simulation")
      .addEventListener("click", () => {
        this.pauseSimulation();
      });

    // Reset button
    document
      .getElementById("reset-simulation")
      .addEventListener("click", () => {
        this.resetSimulation();
      });

    // Step button
    document.getElementById("step-simulation").addEventListener("click", () => {
      this.stepSimulation();
    });

    // Compare algorithms button
    document
      .getElementById("compare-algorithms")
      .addEventListener("click", () => {
        this.compareAlgorithms();
      });

    // Simulation speed slider
    document
      .getElementById("simulation-speed")
      .addEventListener("input", (e) => {
        this.simulationSpeed = parseInt(e.target.value);

        // If simulation is running, update the interval
        if (this.isRunning) {
          this.pauseSimulation();
          this.startSimulation();
        }
      });

    // Algorithm select
    document
      .getElementById("algorithm-select")
      .addEventListener("change", (e) => {
        this.currentAlgorithm = e.target.value;

        // Show/hide relevant configuration options
        this.updateAlgorithmOptions();

        // Reset simulation if algorithm changes
        if (this.processes.length > 0) {
          this.resetSimulation();
        }

        // Update algorithm visualization
        this.updateAlgorithmVisualization();
      });

    // Time quantum input (for Round Robin)
    document.getElementById("time-quantum").addEventListener("change", (e) => {
      this.timeQuantum = parseInt(e.target.value);

      // Reset simulation if time quantum changes and we're using Round Robin
      if (
        this.currentAlgorithm === "round-robin" &&
        this.processes.length > 0
      ) {
        this.resetSimulation();
      }
    });

    // Preemptive toggle
    document
      .getElementById("preemptive-toggle")
      .addEventListener("change", (e) => {
        this.isPreemptive = e.target.checked;

        // Reset simulation if preemptive mode changes and we have processes
        if (this.processes.length > 0) {
          this.resetSimulation();
        }
      });

    // MLQ Queue Count
    document
      .getElementById("mlq-queue-count")
      .addEventListener("change", (e) => {
        this.mlqQueueCount = parseInt(e.target.value);

        // Reset simulation if MLQ queue count changes and we're using MLQ
        if (this.currentAlgorithm === "mlq" && this.processes.length > 0) {
          this.resetSimulation();
        }
      });

    // Initialize algorithm options based on the default algorithm
    this.updateAlgorithmOptions();
  },

  /**
   * Update algorithm configuration options based on selected algorithm
   */
  updateAlgorithmOptions: function () {
    const rrQuantumContainer = document.getElementById("rr-quantum-container");
    const mlqConfigContainer = document.getElementById("mlq-config-container");
    const preemptiveContainer = document.getElementById("preemptive-container");

    // Hide all algorithm-specific options first
    rrQuantumContainer.classList.add("hidden");
    mlqConfigContainer.classList.add("hidden");

    // Show/hide preemptive toggle based on algorithm
    if (["sjf", "priority"].includes(this.currentAlgorithm)) {
      preemptiveContainer.classList.remove("hidden");
    } else if (this.currentAlgorithm === "srt") {
      preemptiveContainer.classList.remove("hidden");
      // SRT is always preemptive
      document.getElementById("preemptive-toggle").checked = true;
      document.getElementById("preemptive-toggle").disabled = true;
      this.isPreemptive = true;
    } else {
      preemptiveContainer.classList.add("hidden");
    }

    // Show relevant algorithm-specific options
    if (this.currentAlgorithm === "round-robin") {
      rrQuantumContainer.classList.remove("hidden");
    } else if (this.currentAlgorithm === "mlq") {
      mlqConfigContainer.classList.remove("hidden");
    }

    // Update algorithm visualization
    this.updateAlgorithmVisualization();
  },

  /**
   * Generate new processes for simulation
   */
  generateProcesses: function () {
    const count = parseInt(document.getElementById("process-count").value);

    // Generate processes using the API
    this.processes = API.getProcesses(count);

    // Initialize remaining time equal to burst time
    this.processes.forEach((process) => {
      process.remainingTime = process.burstTime;
    });

    // Store original state for reset
    this.originalProcesses = JSON.parse(JSON.stringify(this.processes));

    // Reset simulation state
    this.currentTime = 0;
    this.currentRunningPid = null;
    this.currentQuantumUsed = 0;
    this.utilizationHistory = [];
    this.visualizationSteps = [];

    // Update UI
    UI.renderProcessTable(this.processes);
    UI.renderGanttChart(this.processes, this.currentTime);
    UI.updateTime(this.currentTime);
    UI.updateControls(this.isRunning);

    // Update algorithm visualization
    this.updateAlgorithmVisualization();

    // Reset metrics
    this.metrics = Schedulers.calculateMetrics(
      this.processes,
      this.currentTime
    );
    UI.updateMetrics(this.metrics);

    // Reset AI suggestions
    const suggestions = API.getOptimizationSuggestions(
      this.metrics,
      this.currentAlgorithm
    );
    UI.updateAISuggestions(suggestions);

    // Reset comparison results
    this.comparisonResults = null;
    UI.updateAlgorithmComparison(null);
  },

  /**
   * Start the simulation
   */
  startSimulation: function () {
    if (this.processes.length === 0) {
      alert("Please generate processes first!");
      return;
    }

    this.isRunning = true;
    UI.updateControls(this.isRunning);

    // Calculate interval based on speed (faster = shorter interval)
    const interval = 1000 / this.simulationSpeed;

    // Clear any existing interval
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // Start the simulation loop
    this.simulationInterval = setInterval(() => {
      this.stepSimulation();

      // If all processes are complete, stop simulation
      if (this.processes.every((p) => p.status === "completed")) {
        this.pauseSimulation();
        console.log("All processes completed!");
      }
    }, interval);
  },

  /**
   * Pause the simulation
   */
  pauseSimulation: function () {
    this.isRunning = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    UI.updateControls(this.isRunning);
  },

  /**
   * Reset the simulation to initial state
   */
  resetSimulation: function () {
    this.pauseSimulation();

    // Restore processes from original state
    this.processes = JSON.parse(JSON.stringify(this.originalProcesses));

    // Reset simulation state
    this.currentTime = 0;
    this.currentRunningPid = null;
    this.currentQuantumUsed = 0;
    this.utilizationHistory = [];
    this.visualizationSteps = [];

    // Update UI
    UI.renderProcessTable(this.processes);
    UI.renderGanttChart(this.processes, this.currentTime);
    UI.updateTime(this.currentTime);
    UI.updateAlgorithmVisualization();

    // Reset CPU chart
    UI.cpuChart.data.labels = [];
    UI.cpuChart.data.datasets[0].data = [];
    UI.cpuChart.update();

    // Reset metrics
    this.metrics = Schedulers.calculateMetrics(
      this.processes,
      this.currentTime
    );
    UI.updateMetrics(this.metrics);

    // Reset AI suggestions
    const suggestions = API.getOptimizationSuggestions(
      this.metrics,
      this.currentAlgorithm
    );
    UI.updateAISuggestions(suggestions);

    // Reset comparison results
    this.comparisonResults = null;
    UI.updateAlgorithmComparison(null);
  },

  /**
   * Advance simulation by one time unit
   */
  stepSimulation: function () {
    if (this.processes.length === 0) {
      alert("Please generate processes first!");
      return;
    }

    // Update process states based on current time
    this.updateProcessStates();

    // Select next process based on current algorithm
    let schedulerResult;

    switch (this.currentAlgorithm) {
      case "fcfs":
        schedulerResult = Schedulers.fcfs(this.processes, this.currentTime);
        break;
      case "sjf":
        if (this.isPreemptive) {
          schedulerResult = Schedulers.handlePreemption(
            "sjf",
            this.processes,
            this.currentTime,
            this.currentRunningPid,
            this.isPreemptive
          );
        } else {
          schedulerResult = Schedulers.sjf(this.processes, this.currentTime);
        }
        break;
      case "srt":
        schedulerResult = Schedulers.srt(this.processes, this.currentTime);
        break;
      case "priority":
        if (this.isPreemptive) {
          schedulerResult = Schedulers.handlePreemption(
            "priority",
            this.processes,
            this.currentTime,
            this.currentRunningPid,
            this.isPreemptive
          );
        } else {
          schedulerResult = Schedulers.priority(
            this.processes,
            this.currentTime
          );
        }
        break;
      case "round-robin":
        schedulerResult = Schedulers.roundRobin(
          this.processes,
          this.currentTime,
          this.timeQuantum,
          this.currentRunningPid,
          this.currentQuantumUsed
        );
        this.currentQuantumUsed = schedulerResult.quantumUsed;
        break;
      case "hrrn":
        schedulerResult = Schedulers.hrrn(this.processes, this.currentTime);
        break;
      case "mlq":
        schedulerResult = Schedulers.mlq(
          this.processes,
          this.currentTime,
          this.mlqQueueCount
        );
        break;
      default:
        schedulerResult = Schedulers.fcfs(this.processes, this.currentTime);
    }

    const selectedProcess = schedulerResult.selectedProcess;

    // Process the time unit
    let wasIdle = true;

    // Record step for visualization
    const visualizationStep = {
      time: this.currentTime,
      selectedProcess: selectedProcess ? selectedProcess.pid : null,
      status: selectedProcess ? "running" : "idle",
      preempted: schedulerResult.preempted || false,
      readyQueue: this.processes
        .filter((p) => p.status === "ready" || p.status === "running")
        .map((p) => ({
          pid: p.pid,
          remainingTime: p.remainingTime,
          priority: p.priority,
        })),
    };
    this.visualizationSteps.push(visualizationStep);

    if (selectedProcess) {
      wasIdle = false;

      // If this is a context switch (different process from last step)
      if (
        this.currentRunningPid !== null &&
        this.currentRunningPid !== selectedProcess.pid
      ) {
        // Update previous running process status
        const previousProcess = this.processes.find(
          (p) => p.pid === this.currentRunningPid
        );
        if (previousProcess && previousProcess.status === "running") {
          previousProcess.status = "ready";

          // Close the execution history segment
          if (previousProcess.executionHistory.length > 0) {
            const lastSegment =
              previousProcess.executionHistory[
                previousProcess.executionHistory.length - 1
              ];
            lastSegment.endTime = this.currentTime;
          }
        }
      }

      // Update current running process
      this.currentRunningPid = selectedProcess.pid;

      // Set process to running if not already
      if (selectedProcess.status !== "running") {
        selectedProcess.status = "running";

        // Start a new execution history segment
        selectedProcess.executionHistory.push({
          startTime: this.currentTime,
          endTime: this.currentTime + 1, // Will be updated later if process continues
        });
      } else {
        // Update the end time of the current execution segment
        if (selectedProcess.executionHistory.length > 0) {
          const lastSegment =
            selectedProcess.executionHistory[
              selectedProcess.executionHistory.length - 1
            ];
          lastSegment.endTime = this.currentTime + 1;
        }
      }

      // Process execution
      selectedProcess.remainingTime--;

      // Check if process completed
      if (selectedProcess.remainingTime <= 0) {
        selectedProcess.status = "completed";
        selectedProcess.completionTime = this.currentTime + 1;
        selectedProcess.turnaroundTime =
          selectedProcess.completionTime - selectedProcess.arrivalTime;
        selectedProcess.waitingTime =
          selectedProcess.turnaroundTime - selectedProcess.burstTime;

        // Reset current running process
        this.currentRunningPid = null;
        this.currentQuantumUsed = 0;
      }
    } else {
      // No process selected, CPU is idle
      this.currentRunningPid = null;
      this.currentQuantumUsed = 0;
    }

    // Track CPU utilization for this time unit
    this.utilizationHistory.push(wasIdle ? 0 : 100);

    // Increment time
    this.currentTime++;

    // Update metrics
    this.metrics = Schedulers.calculateMetrics(
      this.processes,
      this.currentTime
    );

    // Get AI suggestions based on current metrics
    const suggestions = API.getOptimizationSuggestions(
      this.metrics,
      this.currentAlgorithm
    );

    // Update UI
    UI.renderProcessTable(this.processes);
    UI.renderGanttChart(this.processes, this.currentTime);
    UI.updateTime(this.currentTime);
    UI.updateMetrics(this.metrics);
    UI.updateCpuChart(this.currentTime, this.metrics.cpuUtilization);
    UI.updateAISuggestions(suggestions);
    UI.updateAlgorithmVisualization(
      this.currentAlgorithm,
      this.visualizationSteps
    );
  },

  /**
   * Update process states based on current time
   */
  updateProcessStates: function () {
    this.processes.forEach((process) => {
      // If process has arrived but not started or completed
      if (
        process.arrivalTime <= this.currentTime &&
        process.status !== "running" &&
        process.status !== "completed"
      ) {
        process.status = "ready";
      }

      // Update waiting time for ready processes
      if (process.status === "ready") {
        process.waitingTime++;
      }
    });
  },

  /**
   * Update algorithm visualization based on current algorithm and steps
   */
  updateAlgorithmVisualization: function () {
    UI.updateAlgorithmVisualization(
      this.currentAlgorithm,
      this.visualizationSteps
    );
  },

  /**
   * Compare all algorithms using the current process set
   */
  compareAlgorithms: function () {
    if (this.processes.length === 0) {
      alert("Please generate processes first!");
      return;
    }

    // Pause simulation if running
    if (this.isRunning) {
      this.pauseSimulation();
    }

    // Get comparison results
    this.comparisonResults = Schedulers.compareAlgorithms(
      this.originalProcesses
    );

    // Update comparison UI
    UI.updateAlgorithmComparison(this.comparisonResults);
  },
};
