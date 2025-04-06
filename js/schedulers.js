/**
 * CPU Scheduling Algorithms Module
 * Implements various CPU scheduling algorithms for process simulation
 */

const Schedulers = {
  /**
   * First Come First Served (FCFS) scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Result object containing selected process and status
   */
  fcfs: function (processes, currentTime) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Sort by arrival time (already done, but just to be sure)
    readyProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Select the first process that arrived
    return { selectedProcess: readyProcesses[0], status: "running" };
  },

  /**
   * Shortest Job First (SJF) scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Result object containing selected process and status
   */
  sjf: function (processes, currentTime) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Sort by remaining burst time (shortest first)
    readyProcesses.sort((a, b) => a.remainingTime - b.remainingTime);

    // Select the process with shortest remaining time
    return { selectedProcess: readyProcesses[0], status: "running" };
  },

  /**
   * Priority Scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Result object containing selected process and status
   */
  priority: function (processes, currentTime) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Sort by priority (lower number = higher priority)
    readyProcesses.sort((a, b) => a.priority - b.priority);

    // Select the process with highest priority
    return { selectedProcess: readyProcesses[0], status: "running" };
  },

  /**
   * Round Robin scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @param {number} timeQuantum - Time quantum for Round Robin
   * @param {number|null} currentRunningPid - PID of currently running process
   * @param {number} currentQuantumUsed - How much of current quantum is used
   * @returns {Object} Result object containing selected process, status and quantum info
   */
  roundRobin: function (
    processes,
    currentTime,
    timeQuantum,
    currentRunningPid,
    currentQuantumUsed
  ) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return {
        selectedProcess: null,
        status: "idle",
        quantumUsed: 0,
        quantumRemaining: timeQuantum,
      };
    }

    // If there's a running process and its quantum isn't expired, continue running it
    if (currentRunningPid !== null && currentQuantumUsed < timeQuantum) {
      const runningProcess = processes.find((p) => p.pid === currentRunningPid);

      // If process exists and is not completed
      if (runningProcess && runningProcess.status !== "completed") {
        return {
          selectedProcess: runningProcess,
          status: "running",
          quantumUsed: currentQuantumUsed + 1,
          quantumRemaining: timeQuantum - (currentQuantumUsed + 1),
        };
      }
    }

    // Time quantum expired or no running process, select next process in round robin fashion
    // Sort by arrival time first
    readyProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // If we had a running process, find the next one after it
    if (currentRunningPid !== null) {
      const currentIndex = readyProcesses.findIndex(
        (p) => p.pid === currentRunningPid
      );

      if (currentIndex !== -1 && currentIndex < readyProcesses.length - 1) {
        // Return the next process
        return {
          selectedProcess: readyProcesses[currentIndex + 1],
          status: "running",
          quantumUsed: 1,
          quantumRemaining: timeQuantum - 1,
        };
      }
    }

    // Either no current process or we reached the end of the ready queue, start from beginning
    return {
      selectedProcess: readyProcesses[0],
      status: "running",
      quantumUsed: 1,
      quantumRemaining: timeQuantum - 1,
    };
  },

  /**
   * Shortest Remaining Time (SRT) scheduling algorithm - Preemptive version of SJF
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Result object containing selected process and status
   */
  srt: function (processes, currentTime) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Sort by remaining time (shortest first)
    readyProcesses.sort((a, b) => a.remainingTime - b.remainingTime);

    // Select the process with shortest remaining time
    return { selectedProcess: readyProcesses[0], status: "running" };
  },

  /**
   * Highest Response Ratio Next (HRRN) scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Result object containing selected process and status
   */
  hrrn: function (processes, currentTime) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Calculate response ratio for each process: (W + S) / S
    // Where W is waiting time and S is service time (burst time)
    readyProcesses.forEach((process) => {
      const waitingTime = currentTime - process.arrivalTime;
      process.responseRatio =
        (waitingTime + process.burstTime) / process.burstTime;
    });

    // Sort by response ratio (highest first)
    readyProcesses.sort((a, b) => b.responseRatio - a.responseRatio);

    // Select the process with highest response ratio
    return { selectedProcess: readyProcesses[0], status: "running" };
  },

  /**
   * Multi-Level Queue (MLQ) scheduling algorithm
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @param {number} queueCount - Number of priority queues
   * @returns {Object} Result object containing selected process and status
   */
  mlq: function (processes, currentTime, queueCount = 3) {
    // Filter processes that have arrived and not completed
    const readyProcesses = processes.filter(
      (p) => p.arrivalTime <= currentTime && p.status !== "completed"
    );

    if (readyProcesses.length === 0) {
      return { selectedProcess: null, status: "idle" };
    }

    // Divide processes into queues based on priority
    const queues = [];
    for (let i = 0; i < queueCount; i++) {
      queues.push([]);
    }

    // Assign processes to queues (lower priority value = higher priority)
    readyProcesses.forEach((process) => {
      // Map priority to queue index (0 to queueCount-1)
      const queueIndex = Math.min(process.priority - 1, queueCount - 1);
      queues[queueIndex].push(process);
    });

    // Find the highest priority non-empty queue
    for (let i = 0; i < queueCount; i++) {
      if (queues[i].length > 0) {
        // Sort processes in this queue by arrival time (FCFS within queue)
        queues[i].sort((a, b) => a.arrivalTime - b.arrivalTime);
        return { selectedProcess: queues[i][0], status: "running" };
      }
    }

    // Should never reach here if readyProcesses is not empty
    return { selectedProcess: null, status: "idle" };
  },

  /**
   * Handle preemptive scheduling
   * @param {string} algorithm - Current algorithm name
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @param {number|null} currentRunningPid - PID of currently running process
   * @param {boolean} isPreemptive - Whether preemption is enabled
   * @returns {Object} Result object with selected process info
   */
  handlePreemption: function (
    algorithm,
    processes,
    currentTime,
    currentRunningPid,
    isPreemptive
  ) {
    // If not preemptive or no running process, just run the normal algorithm
    if (!isPreemptive || currentRunningPid === null) {
      switch (algorithm) {
        case "sjf":
          return this.sjf(processes, currentTime);
        case "srt":
          return this.srt(processes, currentTime);
        case "priority":
          return this.priority(processes, currentTime);
        case "hrrn":
          return this.hrrn(processes, currentTime);
        default:
          return this.fcfs(processes, currentTime);
      }
    }

    // For preemptive scheduling
    // Find the currently running process
    const runningProcess = processes.find((p) => p.pid === currentRunningPid);

    // If running process is completed, find next
    if (!runningProcess || runningProcess.status === "completed") {
      switch (algorithm) {
        case "sjf":
        case "srt":
          return this.srt(processes, currentTime);
        case "priority":
          return this.priority(processes, currentTime);
        default:
          return this.fcfs(processes, currentTime);
      }
    }

    // Calculate the best process according to the algorithm
    let bestProcess;
    switch (algorithm) {
      case "sjf":
      case "srt":
        // Find process with shortest remaining time
        const readyProcesses = processes.filter(
          (p) => p.arrivalTime <= currentTime && p.status !== "completed"
        );
        if (readyProcesses.length === 0) {
          return { selectedProcess: null, status: "idle" };
        }
        readyProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
        bestProcess = readyProcesses[0];
        break;

      case "priority":
        // Find process with highest priority
        const priorityProcesses = processes.filter(
          (p) => p.arrivalTime <= currentTime && p.status !== "completed"
        );
        if (priorityProcesses.length === 0) {
          return { selectedProcess: null, status: "idle" };
        }
        priorityProcesses.sort((a, b) => a.priority - b.priority);
        bestProcess = priorityProcesses[0];
        break;

      default:
        bestProcess = runningProcess;
    }

    // If the best process is different from currently running, preempt
    if (bestProcess.pid !== runningProcess.pid) {
      return {
        selectedProcess: bestProcess,
        status: "running",
        preempted: true,
      };
    }

    // Continue with current process
    return {
      selectedProcess: runningProcess,
      status: "running",
      preempted: false,
    };
  },

  /**
   * Calculate metrics for all processes
   * @param {Array} processes - Array of process objects
   * @param {number} currentTime - Current simulation time
   * @returns {Object} Metrics object with various performance indicators
   */
  calculateMetrics: function (processes, currentTime) {
    const completedProcesses = processes.filter(
      (p) => p.status === "completed"
    );
    const totalProcesses = processes.length;

    // Calculate waiting and turnaround times only for completed processes
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let totalBurstTime = 0;

    completedProcesses.forEach((process) => {
      totalWaitingTime += process.waitingTime;
      totalTurnaroundTime += process.turnaroundTime;
      totalBurstTime += process.burstTime;
    });

    // Count context switches from execution history of all processes
    let contextSwitches = 0;
    processes.forEach((process) => {
      if (process.executionHistory.length > 0) {
        // Each separate execution segment represents a context switch, minus first entry
        contextSwitches += Math.max(0, process.executionHistory.length - 1);
      }
    });

    // Calculate CPU utilization (busy time / total time)
    let busyTime = 0;
    processes.forEach((process) => {
      process.executionHistory.forEach((segment) => {
        busyTime += segment.endTime - segment.startTime;
      });
    });

    const cpuUtilization = currentTime > 0 ? (busyTime / currentTime) * 100 : 0;

    // Calculate throughput (completed processes / total time)
    const throughput =
      currentTime > 0 ? completedProcesses.length / currentTime : 0;

    return {
      avgWaitingTime:
        completedProcesses.length > 0
          ? totalWaitingTime / completedProcesses.length
          : 0,
      avgTurnaroundTime:
        completedProcesses.length > 0
          ? totalTurnaroundTime / completedProcesses.length
          : 0,
      cpuUtilization: Math.round(cpuUtilization * 100) / 100, // Round to 2 decimal places
      throughput: Math.round(throughput * 1000) / 1000, // Round to 3 decimal places
      contextSwitches: contextSwitches,
      completedProcesses: completedProcesses.length,
      totalProcesses: totalProcesses,
    };
  },

  /**
   * Compare multiple algorithms for the same process set
   * @param {Array} originalProcesses - Original array of processes
   * @returns {Object} Comparison results for different algorithms
   */
  compareAlgorithms: function (originalProcesses) {
    const algorithms = [
      "fcfs",
      "sjf",
      "srt",
      "priority",
      "round-robin",
      "hrrn",
      "mlq",
    ];
    const results = {};

    // For each algorithm, run a separate simulation
    for (const algorithm of algorithms) {
      // Deep copy processes to avoid modifying the original
      const processes = JSON.parse(JSON.stringify(originalProcesses));

      // Initialize necessary tracking variables
      let currentTime = 0;
      let currentRunningPid = null;
      let currentQuantumUsed = 0;
      let timeQuantum = 2; // Default
      let isPreemptive = algorithm === "srt"; // SRT is always preemptive
      let queueCount = 3; // Default for MLQ
      let allCompleted = false;

      // Run simulation until all processes complete
      while (!allCompleted) {
        // Update process states
        processes.forEach((process) => {
          if (
            process.arrivalTime <= currentTime &&
            process.status !== "running" &&
            process.status !== "completed"
          ) {
            process.status = "ready";
          }
        });

        // Select next process
        let schedulerResult;
        switch (algorithm) {
          case "fcfs":
            schedulerResult = this.fcfs(processes, currentTime);
            break;
          case "sjf":
            schedulerResult = this.sjf(processes, currentTime);
            break;
          case "srt":
            schedulerResult = this.srt(processes, currentTime);
            break;
          case "priority":
            schedulerResult = this.priority(processes, currentTime);
            break;
          case "round-robin":
            schedulerResult = this.roundRobin(
              processes,
              currentTime,
              timeQuantum,
              currentRunningPid,
              currentQuantumUsed
            );
            currentQuantumUsed = schedulerResult.quantumUsed;
            break;
          case "hrrn":
            schedulerResult = this.hrrn(processes, currentTime);
            break;
          case "mlq":
            schedulerResult = this.mlq(processes, currentTime, queueCount);
            break;
          default:
            schedulerResult = this.fcfs(processes, currentTime);
        }

        const selectedProcess = schedulerResult.selectedProcess;

        // Process the time unit
        if (selectedProcess) {
          // Set process to running if not already
          if (selectedProcess.status !== "running") {
            // Handle context switch
            if (
              currentRunningPid !== null &&
              currentRunningPid !== selectedProcess.pid
            ) {
              const previousProcess = processes.find(
                (p) => p.pid === currentRunningPid
              );
              if (previousProcess && previousProcess.status === "running") {
                previousProcess.status = "ready";
              }
            }

            selectedProcess.status = "running";
            currentRunningPid = selectedProcess.pid;
          }

          // Process execution
          selectedProcess.remainingTime--;

          // Check if process completed
          if (selectedProcess.remainingTime <= 0) {
            selectedProcess.status = "completed";
            selectedProcess.completionTime = currentTime + 1;
            selectedProcess.turnaroundTime =
              selectedProcess.completionTime - selectedProcess.arrivalTime;
            selectedProcess.waitingTime =
              selectedProcess.turnaroundTime - selectedProcess.burstTime;

            // Reset current running process
            currentRunningPid = null;
            currentQuantumUsed = 0;
          }
        } else {
          // No process selected, CPU is idle
          currentRunningPid = null;
          currentQuantumUsed = 0;
        }

        // Increment time
        currentTime++;

        // Check if all processes completed
        allCompleted = processes.every((p) => p.status === "completed");
      }

      // Calculate metrics for this algorithm
      const metrics = this.calculateMetrics(processes, currentTime);
      results[algorithm] = metrics;
    }

    return results;
  },
};
