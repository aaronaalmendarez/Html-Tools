(function() {
  // Flags to disable tools during loading & tutorial
  let loadingActive = true;
  let tutorialActive = false;
  // Stack to hold undo actions
  let undoStack = [];

  // Create a top-level container so we don't overwrite your page's body
  const container = document.createElement('div');
  container.id = 'spooky-tools-container';
  // High z-index so it floats above your page
  // but pointer-events is 'none' so clicks pass through,
  // we'll selectively enable pointer-events: auto on child overlays
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '999999999';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  // ─────────────────────────────────────────────────────────
  // 1. GLOBAL STYLES (only for our overlays/tools)
  // ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* LOADING OVERLAY */
    #spooky-loading-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: #000;
      display: flex; 
      align-items: center; 
      justify-content: center;
      pointer-events: auto; /* We want to block clicks behind it */
      transition: opacity 0.6s ease;
    }
    #spooky-loading-overlay.hidden { opacity: 0; }

    .loading-content {
      text-align: center;
      color: #fff;
    }
    .loading-title {
      font-size: 2em;
      margin-bottom: 20px;
    }
    .loading-bar-container {
      width: 300px; 
      height: 20px; 
      border: 2px solid #fff; 
      border-radius: 10px;
      overflow: hidden; 
      margin: 0 auto 10px auto;
    }
    .loading-bar {
      width: 0%; 
      height: 100%; 
      background: linear-gradient(90deg, #ff7e5f, #feb47b);
      border-radius: 10px; 
      transition: width 0.5s ease-out;
    }
    .phase-label {
      font-size: 1.1em; 
      color: #fff;
    }

    /* WELCOME (HERO) OVERLAY */
    #spooky-welcome-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex; 
      align-items: center; 
      justify-content: center;
      pointer-events: auto; /* so user can click the button */
      transition: opacity 0.3s ease;
    }
    #spooky-welcome-overlay.hidden { opacity: 0; pointer-events: none; }

    .welcome-content {
      text-align: center;
      color: #fff;
    }
    .welcome-content h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
    }
    .welcome-content p {
      font-size: 1.1em;
      margin-bottom: 1em;
      opacity: 0.9;
    }
    .welcome-content .cta-button {
      display: inline-block;
      padding: 12px 25px;
      font-size: 1em;
      background: linear-gradient(90deg, #aa00ff, #ff00e6);
      border: none;
      border-radius: 30px;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.3s ease;
      text-decoration: none;
    }
    .welcome-content .cta-button:hover {
      opacity: 0.8;
    }

    /* MENU TOGGLE (Hamburger) */
    #spooky-menu-toggle {
      position: absolute;
      top: 20px;
      left: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background-color: #555;
      color: #fff;
      font-size: 1.5em;
      cursor: pointer;
      line-height: 40px;
      text-align: center;
      transition: background-color 0.2s ease;
      pointer-events: auto; /* clickable */
      z-index: 1;
    }
    #spooky-menu-toggle:hover {
      background-color: #777;
    }

    /* SIDEBAR (slides in/out) */
    #spooky-sidebar {
      position: absolute;
      top: 0; left: 0;
      width: 60px;
      height: 100%;
      background: rgba(34,34,34,0.9);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      pointer-events: auto; /* clickable */
      padding-top: 70px; /* so icons start below the toggle button */
      z-index: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #spooky-sidebar.visible {
      transform: translateX(0);
    }
    #spooky-sidebar .nav-item {
      width: 40px; 
      height: 40px; 
      margin: 10px 0;
      background-color: #555; 
      border-radius: 6px;
      display: flex; 
      align-items: center; 
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    #spooky-sidebar .nav-item:hover {
      background-color: #777;
    }
    #spooky-sidebar .nav-item.active {
      background-color: #aa00ff;
    }
    #spooky-sidebar .nav-item.highlight {
      box-shadow: 0 0 0 3px #ff00e6;
      z-index: 9999991;
    }
    #spooky-sidebar .nav-item span {
      font-size: 1.2em;
      pointer-events: none;
    }
    #spooky-sidebar .nav-item:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 60px;
      background: #333;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.85em;
      white-space: nowrap;
      opacity: 1;
      pointer-events: none;
    }

    /* REPHRASE BOX */
    #spooky-rephrase-box {
      position: absolute;
      background-color: rgba(255, 255, 255, 0.95);
      border: 2px solid #333;
      padding: 10px;
      border-radius: 5px;
      z-index: 999999;
      pointer-events: auto;
    }
    #spooky-rephrase-box textarea {
      width: 300px;
      height: 100px;
      display: block;
      margin-bottom: 5px;
    }
    #spooky-rephrase-box button {
      margin-right: 5px;
      background: #555;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
    }
    #spooky-rephrase-box button:hover {
      background: #777;
    }

    /* TUTORIAL OVERLAY */
    #spooky-tutorial-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: none;
      align-items: center; 
      justify-content: center;
      flex-direction: column;
      pointer-events: auto;
      z-index: 999999;
      transition: opacity 0.3s ease;
    }
    #spooky-tutorial-overlay.visible { display: flex; }
    #spooky-tutorial-box {
      max-width: 600px;
      background: #222;
      padding: 20px;
      border-radius: 8px;
      position: relative;
      text-align: center;
      color: #fff;
    }
    #spooky-tutorial-box h2 {
      margin-top: 0;
    }
    .tutorial-buttons {
      margin-top: 20px;
      text-align: right;
    }
    .tutorial-buttons button {
      background: #555;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      margin-left: 10px;
      cursor: pointer;
    }
    .tutorial-buttons button:hover {
      background: #777;
    }
  `;
  container.appendChild(style);

  // ─────────────────────────────────────────────────────────
  // 2. LOADING OVERLAY
  // ─────────────────────────────────────────────────────────
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'spooky-loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-title">Html Tool</div>
      <div class="loading-bar-container">
        <div class="loading-bar"></div>
      </div>
      <div class="phase-label">Loading</div>
    </div>
  `;
  container.appendChild(loadingOverlay);

  const loadingBar = loadingOverlay.querySelector('.loading-bar');
  const phaseLabel = loadingOverlay.querySelector('.phase-label');

  // Animate the loading overlay over 6s
  setTimeout(() => { loadingBar.style.width = '25%'; }, 0);
  setTimeout(() => { phaseLabel.textContent = 'Injecting'; loadingBar.style.width = '50%'; }, 1500);
  setTimeout(() => { phaseLabel.textContent = 'Initialization'; loadingBar.style.width = '75%'; }, 3000);
  setTimeout(() => { phaseLabel.textContent = 'Finished'; loadingBar.style.width = '100%'; }, 4500);
  setTimeout(() => {
    loadingActive = false; // Tools can be used after tutorial, but only if tutorialActive is also false
    loadingOverlay.classList.add('hidden');
    // Show the welcome overlay once loading is finished
    welcomeOverlay.classList.remove('hidden');
    setTimeout(() => { loadingOverlay.remove(); }, 600);
  }, 6000);

  // ─────────────────────────────────────────────────────────
  // 3. WELCOME (HERO) OVERLAY
  // ─────────────────────────────────────────────────────────
  const welcomeOverlay = document.createElement('div');
  welcomeOverlay.id = 'spooky-welcome-overlay';
  // Initially hidden until loading completes
  welcomeOverlay.classList.add('hidden');
  welcomeOverlay.innerHTML = `
    <div class="welcome-content">
      <h1>Welcome to fast Tools</h1>
      <p>Start your spooky unlocking journey today!</p>
      <button class="cta-button" id="spooky-get-started">Get Started</button>
    </div>
  `;
  container.appendChild(welcomeOverlay);

  // ─────────────────────────────────────────────────────────
  // 4. MENU TOGGLE (Hamburger)
  // ─────────────────────────────────────────────────────────
  const menuToggle = document.createElement('button');
  menuToggle.id = 'spooky-menu-toggle';
  menuToggle.innerHTML = '&#9776;';
  container.appendChild(menuToggle);

  // ─────────────────────────────────────────────────────────
  // 5. SIDEBAR (sliding in/out)
  // ─────────────────────────────────────────────────────────
  const sidebar = document.createElement('div');
  sidebar.id = 'spooky-sidebar';
  // Added a spacer div so that the undo button appears at the bottom
  sidebar.innerHTML = `
    <div class="nav-item" data-tooltip="Element Vanisher" data-mode="delete"><span>🗑</span></div>
    <div class="nav-item" data-tooltip="Text Rephraser" data-mode="rephrase"><span>✏️</span></div>
    <div class="nav-item" data-tooltip="Ghost Mode" data-mode="ghost"><span>👻</span></div>
    <div class="nav-item" data-tooltip="Confetti Mode" data-mode="confetti"><span>🎉</span></div>
    <div class="nav-item" data-tooltip="Reset" data-mode="reset"><span>🔄</span></div>
    <div style="flex-grow: 1;"></div>
    <div class="nav-item" data-tooltip="Undo" data-mode="undo"><span>↩️</span></div>
  `;
  container.appendChild(sidebar);

  let sidebarVisible = false;
  menuToggle.addEventListener('click', () => {
    sidebarVisible = !sidebarVisible;
    if (sidebarVisible) {
      sidebar.classList.add('visible');
    } else {
      sidebar.classList.remove('visible');
    }
  });

  // Mode switching (including the new undo mode)
  const navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Handle Reset immediately
      if (item.dataset.mode === 'reset') {
        location.reload();
        return;
      }
      // Handle Undo action
      if (item.dataset.mode === 'undo') {
        if (undoStack.length > 0) {
          const undoAction = undoStack.pop();
          if (undoAction.type === 'delete') {
            // Reinsert the removed element at its previous position
            if (undoAction.nextSibling && undoAction.nextSibling.parentNode) {
              undoAction.parent.insertBefore(undoAction.element, undoAction.nextSibling);
            } else {
              undoAction.parent.appendChild(undoAction.element);
            }
            console.log("Undo: restored deleted element.");
          } else if (undoAction.type === 'rephrase') {
            undoAction.element.textContent = undoAction.oldText;
            console.log("Undo: reverted text change.");
          }
        } else {
          console.log("Nothing to undo.");
        }
        return;
      }
      // For other modes, mark active and set current mode
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentMode = item.dataset.mode;
      console.log("Current mode set to:", currentMode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 6. TUTORIAL OVERLAY
  // ─────────────────────────────────────────────────────────
  const tutorialOverlay = document.createElement('div');
  tutorialOverlay.id = 'spooky-tutorial-overlay';
  tutorialOverlay.innerHTML = `
    <div id="spooky-tutorial-box">
      <!-- dynamic steps go here -->
    </div>
  `;
  container.appendChild(tutorialOverlay);

  // ─────────────────────────────────────────────────────────
  // 7. SPOOKY TOOLS LOGIC
  // ─────────────────────────────────────────────────────────
  console.log("🎃 Spooky Tools Activated!");

  let currentMode = null;
  let rephraseBoxActive = false;
  let currentRephraseBox = null;

  // Confetti spawner
  function spawnConfetti(x, y) {
    for (let i = 0; i < 10; i++) {
      const confetti = document.createElement('div');
      Object.assign(confetti.style, {
        position: 'absolute',
        left: x + 'px',
        top: y + 'px',
        width: '8px',
        height: '8px',
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
        borderRadius: '50%',
        opacity: '1',
        pointerEvents: 'none',
        transform: 'translate(0, 0)',
        transition: 'transform 1s ease-out, opacity 1s ease-out',
        zIndex: '999999'
      });
      container.appendChild(confetti);
      setTimeout(() => {
        confetti.style.transform = `translate(${(Math.random()-0.5) * 200}px, ${Math.random() * 200}px)`;
        confetti.style.opacity = '0';
      }, 20);
      setTimeout(() => {
        if (confetti.parentNode) confetti.parentNode.removeChild(confetti);
      }, 1020);
    }
  }

  // Global click handler (tools only work if not loadingActive or tutorialActive)
  document.addEventListener('click', (e) => {
    if (loadingActive || tutorialActive) return;

    // If user clicks inside the sidebar or toggle, ignore
    if (sidebar.contains(e.target) || menuToggle.contains(e.target)) return;
    // If no mode selected, do nothing
    if (!currentMode) return;

    // If rephrase mode is active and a box is open, ignore clicks inside that box
    if (currentMode === 'rephrase' && rephraseBoxActive) {
      if (currentRephraseBox && currentRephraseBox.contains(e.target)) {
        return;
      }
    }

    const clickedElement = document.elementFromPoint(e.clientX, e.clientY);
    if (!clickedElement) return;

    if (currentMode === 'delete') {
      console.log("💥 Vanishing element:", clickedElement);
      const parent = clickedElement.parentNode;
      const nextSibling = clickedElement.nextSibling;
      // Save undo action
      undoStack.push({ type: 'delete', element: clickedElement, parent: parent, nextSibling: nextSibling });
      clickedElement.remove();
      e.preventDefault();
      e.stopPropagation();
    } else if (currentMode === 'rephrase') {
      if (rephraseBoxActive) return;
      const textContent = clickedElement.textContent.trim();
      if (textContent) {
        rephraseBoxActive = true;
        console.log("📝 Rephrasing text in element:", clickedElement);

        const rephraseBox = document.createElement('div');
        rephraseBox.id = 'spooky-rephrase-box';
        currentRephraseBox = rephraseBox;
        // Position near the click
        rephraseBox.style.left = (e.clientX) + 'px';
        rephraseBox.style.top = (e.clientY) + 'px';

        const textarea = document.createElement('textarea');
        textarea.value = textContent;

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.marginRight = '5px';

        const discardBtn = document.createElement('button');
        discardBtn.textContent = 'Discard';

        rephraseBox.appendChild(textarea);
        rephraseBox.appendChild(confirmBtn);
        rephraseBox.appendChild(discardBtn);
        container.appendChild(rephraseBox);

        confirmBtn.addEventListener('click', (evt) => {
          rephraseBoxActive = false;
          currentRephraseBox = null;
          // Save undo action for rephrase
          const oldText = clickedElement.textContent;
          undoStack.push({ type: 'rephrase', element: clickedElement, oldText: oldText });
          clickedElement.textContent = textarea.value;
          rephraseBox.remove();
          evt.stopPropagation();
        });
        discardBtn.addEventListener('click', (evt) => {
          rephraseBoxActive = false;
          currentRephraseBox = null;
          rephraseBox.remove();
          evt.stopPropagation();
        });
        textarea.focus();
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (currentMode === 'ghost') {
      console.log("👻 Ghosting element:", clickedElement);
      const parent = clickedElement.parentNode;
      const nextSibling = clickedElement.nextSibling;
      // Save undo action
      undoStack.push({ type: 'delete', element: clickedElement, parent: parent, nextSibling: nextSibling });
      clickedElement.style.transition = 'opacity 1s ease';
      clickedElement.style.opacity = '0';
      setTimeout(() => {
        if (clickedElement.parentNode) clickedElement.parentNode.removeChild(clickedElement);
      }, 1000);
      e.preventDefault();
      e.stopPropagation();
    } else if (currentMode === 'confetti') {
      console.log("🎉 Confetti at:", e.clientX, e.clientY);
      spawnConfetti(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // ─────────────────────────────────────────────────────────
  // 9. TUTORIAL LOGIC
  // ─────────────────────────────────────────────────────────
  const getStartedBtn = welcomeOverlay.querySelector('#spooky-get-started');
  const tutorialBox = tutorialOverlay.querySelector('#spooky-tutorial-box');

  getStartedBtn.addEventListener('click', (e) => {
    e.preventDefault();
    tutorialActive = true;
    // Show the tutorial overlay
    tutorialOverlay.classList.add('visible');
    // Hide the welcome overlay
    welcomeOverlay.classList.add('hidden');
    setTimeout(() => {
      welcomeOverlay.remove();
    }, 300);

    tutorialBox.innerHTML = `
      <h2>Welcome to the Spooky Tools Guide</h2>
      <p>We’ll walk you through each tool so you can master them quickly!</p>
      <div class="tutorial-buttons">
        <button id="spooky-guide-start-btn">Start Guide</button>
      </div>
    `;
  });

  const tutorialSteps = [
    {
      title: "Element Vanisher",
      text: "Use this tool to remove any element on the page with a single click.",
      highlightIndex: 0
    },
    {
      title: "Text Rephraser",
      text: "Click text to open a box and rewrite it on the fly.",
      highlightIndex: 1
    },
    {
      title: "Ghost Mode",
      text: "Watch elements fade away slowly, leaving no trace behind.",
      highlightIndex: 2
    },
    {
      title: "Confetti Mode",
      text: "Spawn colorful confetti bursts wherever you click.",
      highlightIndex: 3
    },
    {
      title: "Reset",
      text: "Reload the page to restore everything to default.",
      highlightIndex: 4
    }
  ];
  let currentStep = -1;

  function showNextStep() {
    // Un-highlight previous step
    if (currentStep >= 0) {
      navItems[tutorialSteps[currentStep].highlightIndex].classList.remove('highlight');
    }
    currentStep++;
    if (currentStep < tutorialSteps.length) {
      navItems[tutorialSteps[currentStep].highlightIndex].classList.add('highlight');
      const isLast = (currentStep === tutorialSteps.length - 1);
      tutorialBox.innerHTML = `
        <h2>${tutorialSteps[currentStep].title}</h2>
        <p>${tutorialSteps[currentStep].text}</p>
        <div class="tutorial-buttons">
          <button id="spooky-next-step-btn">${isLast ? 'Finish' : 'Next'}</button>
        </div>
      `;
    } else {
      // Done => hide tutorial overlay, allow tool usage
      tutorialOverlay.classList.remove('visible');
      tutorialActive = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'spooky-guide-start-btn') {
      showNextStep();
    } else if (e.target && e.target.id === 'spooky-next-step-btn') {
      showNextStep();
    }
  });
})();
