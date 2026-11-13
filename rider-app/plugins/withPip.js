const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPip(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    const mainActivity = mainApplication.activity[0];
    
    // Enable Android Picture-in-Picture mode for floating window
    mainActivity.$['android:supportsPictureInPicture'] = 'true';
    mainActivity.$['android:configChanges'] = 'keyboard|keyboardHidden|orientation|screenSize|screenLayout|smallestScreenSize|uiMode';
    
    return config;
  });
};
