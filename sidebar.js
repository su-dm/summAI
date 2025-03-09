function createSidebar() {
  // Check if sidebar already exists
  if (document.getElementById('claude-summary-sidebar')) {
    return;
  }
  
  const sidebar = document.createElement('div');
  sidebar.id = 'claude-summary-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background-color: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    z-index: 9999;
    padding: 15px;
    overflow-y: auto;
    font-family: Arial, sans-serif;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => {
    document.body.removeChild(sidebar);
  };
  
  const title = document.createElement('h2');
  title.textContent = 'Page Summary';
  
  const content = document.createElement('div');
  content.id = 'claude-summary-content';
  content.style.marginTop = '20px';
  
  sidebar.appendChild(closeBtn);
  sidebar.appendChild(title);
  sidebar.appendChild(content);
  
  document.body.appendChild(sidebar);
  
  return content;
}
