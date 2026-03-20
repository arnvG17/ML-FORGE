// Simple test to verify playground state reset
const { useAgentStore } = require('./store/agent');
const { useOutputStore } = require('./store/output');
const { useSessionStore } = require('./store/session');

console.log('Testing playground state reset...');

// Simulate new session reset
try {
  useAgentStore.getState().reset();
  console.log('✓ Agent store reset successfully');
  
  useOutputStore.getState().reset();
  console.log('✓ Output store reset successfully');
  
  useSessionStore.getState().resetSession();
  console.log('✓ Session store reset successfully');
  
  console.log('All stores reset successfully - playground should show blank state');
} catch (error) {
  console.error('Error during reset:', error);
}
