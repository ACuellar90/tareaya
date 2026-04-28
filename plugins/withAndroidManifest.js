const { withAndroidManifest } = require('@expo/config-plugins')

module.exports = withAndroidManifest(async (config) => {
  const mainApplication = config.modResults.manifest.application[0]
  
  if (mainApplication['meta-data']) {
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      item => item.$['android:name'] !== 'com.google.firebase.messaging.default_notification_color'
    )
  }
  
  return config
})