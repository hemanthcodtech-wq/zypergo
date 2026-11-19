const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

function withPipManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    
    // Explicitly configure MainActivity for Android Picture-in-Picture & Multi-window Resizing
    if (Array.isArray(mainApplication.activity)) {
      mainApplication.activity.forEach((act) => {
        const name = act.$ && act.$['android:name'];
        if (name && (name === '.MainActivity' || name.endsWith('MainActivity'))) {
          act.$['android:supportsPictureInPicture'] = 'true';
          act.$['android:resizeableActivity'] = 'true';
          act.$['android:configChanges'] = 'keyboard|keyboardHidden|orientation|screenSize|screenLayout|smallestScreenSize|uiMode';
        }
      });
    }
    
    return config;
  });
}

function withPipMainActivity(config) {
  return withMainActivity(config, async (config) => {
    let contents = config.modResults.contents;

    // Check if already injected
    if (contents.includes('enterPictureInPictureMode')) {
      return config;
    }

    // Modern Android 12+ (API 31+) Auto-Enter PiP on swipe-to-home gesture navigation + Android 8-11 fallback
    const pipTrigger = `
  override fun onResume() {
    super.onResume()
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      try {
        val aspectRatio = android.util.Rational(9, 16)
        val params = android.app.PictureInPictureParams.Builder()
          .setAspectRatio(aspectRatio)
          .setAutoEnterEnabled(true)
          .build()
        setPictureInPictureParams(params)
      } catch (e: Exception) {}
    }
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      try {
        val aspectRatio = android.util.Rational(9, 16)
        val builder = android.app.PictureInPictureParams.Builder()
          .setAspectRatio(aspectRatio)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
          builder.setAutoEnterEnabled(true)
        }
        enterPictureInPictureMode(builder.build())
      } catch (e: Exception) {}
    }
  }
  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: android.content.res.Configuration) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
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
