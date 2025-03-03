/**
 * Custom module resolver for nexus-js
 * This file redirects imports of 'nexus-js' to our mock implementation
 */
const path = require('path');
const Module = require('module');

// Save the original require
const originalRequire = Module.prototype.require;

// Override the require function
Module.prototype.require = function(id) {
  // If trying to require nexus-js, return our mock implementation
  if (id === 'nexus-js') {
    return require(path.resolve(__dirname, 'mocks/nexus-js'));
  }
  
  // Otherwise, use the original require
  return originalRequire.apply(this, arguments);
};

console.log('Custom module resolver for nexus-js has been loaded'); 