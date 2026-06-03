/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'withinrange',
  deploymentTarget: '17.0',
  // Shared container so the app (JS) and the widget (Swift) read the same data.
  entitlements: {
    'com.apple.security.application-groups': ['group.com.withinrange.app'],
  },
};
