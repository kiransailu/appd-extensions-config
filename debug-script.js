// Simple test script to debug login button
console.log('Debug script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Test if elements exist
    var loginBtn1 = document.getElementById('github-login');
    var loginBtn2 = document.getElementById('github-login-2');
    
    console.log('Login button 1:', loginBtn1);
    console.log('Login button 2:', loginBtn2);
    
    // Add simple click handlers for testing
    if (loginBtn1) {
        loginBtn1.addEventListener('click', function() {
            console.log('Login button 1 clicked!');
            alert('Login button 1 works! JavaScript is functional.');
            showSimpleModal();
        });
    }
    
    if (loginBtn2) {
        loginBtn2.addEventListener('click', function() {
            console.log('Login button 2 clicked!');
            alert('Login button 2 works! JavaScript is functional.');
            showSimpleModal();
        });
    }
});

function showSimpleModal() {
    console.log('Creating simple modal...');
    
    // Remove existing modal if any
    var existingModal = document.querySelector('.debug-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create simple modal
    var modal = document.createElement('div');
    modal.className = 'debug-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    
    var content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 20px; border-radius: 8px; max-width: 400px; text-align: center;';
    content.innerHTML = '<h3>Debug Modal Works!</h3><p>JavaScript is functioning correctly.</p><button onclick="this.parentElement.parentElement.remove()">Close</button>';
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    console.log('Simple modal created and added to page');
}