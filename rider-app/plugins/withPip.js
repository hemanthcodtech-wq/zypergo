const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

function withPipManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    const mainActivity = mainApplication.activity[0];
    
    // 1. Manifest flags for Picture-in-Picture & Overlay
    mainActivity.$['android:supportsPictureInPicture'] = 'true';
    mainActivity.$['android:configChanges'] = 'keyboard|keyboardHidden|orientation|screenSize|screenLayout|smallestScreenSize|uiMode';
    
    return config;
  });
}

function withPipMainActivity(config) {
  return withMainActivity(config, async (config) => {
    let contents = config.modResults.contents;

    // 2. Check if already injected
    if (contents.includes('enterPictureInPictureMode')) {
      return config;
    }

    // 3. Inject automatic PiP trigger using fully-qualified Android classes (avoids import conflicts)
    const pipTrigger = `
  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      try {
        val aspectRatio = android.util.Rational(9, 16)
        val params = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
          android.app.PictureInPictureParams.Builder()
            .setAspectRatio(aspectRatio)
            .setAutoEnterEnabled(true)
            .build()
        } else {
          android.app.PictureInPictureParams.Builder()
            .setAspectRatio(aspectRatio)
            .build()
        }
        enterPictureInPictureMode(params)
      } catch (e: Exception) {
        // Safe fallback
      }
    }
  }
`;

    // Inject before the closing brace of MainActivity
    const lastBraceIndex = contents.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      contents = contents.substring(0, lastBraceIndex) + pipTrigger + '\n}';
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withPip(config) {
  config = withPipManifest(config);
  config = withPipMainActivity(config);
  return config;
};
