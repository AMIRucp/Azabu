module.exports = new Proxy({}, {
  get: function(target, name) {
    if (name === '__esModule') return true;
    if (name === 'default') return {};
    return function() { throw new Error('Drift SDK is not available in browser'); };
  }
});
