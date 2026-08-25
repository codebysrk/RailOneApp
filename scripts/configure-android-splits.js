const fs = require('fs');
const path = require('path');

// 1. Configure android/gradle.properties
const propsPath = path.join(__dirname, '..', 'android', 'gradle.properties');
if (fs.existsSync(propsPath)) {
  let props = fs.readFileSync(propsPath, 'utf8');
  props = props.replace(/expo\.gif\.enabled=true/g, 'expo.gif.enabled=false');
  if (!props.includes('android.enableProguardInReleaseBuilds')) {
    props += '\nandroid.enableProguardInReleaseBuilds=true\n';
  }
  if (!props.includes('android.enableShrinkResourcesInReleaseBuilds')) {
    props += '\nandroid.enableShrinkResourcesInReleaseBuilds=true\n';
  }
  fs.writeFileSync(propsPath, props, 'utf8');
  console.log('✅ Updated android/gradle.properties');
}

// 2. Configure android/app/build.gradle
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let bg = fs.readFileSync(buildGradlePath, 'utf8');

  // Replace enableMinifyInReleaseBuilds definition
  bg = bg.replace(
    /def enableMinifyInReleaseBuilds = .*/,
    'def enableMinifyInReleaseBuilds = (findProperty("android.enableProguardInReleaseBuilds") ?: findProperty("android.enableMinifyInReleaseBuilds") ?: "true").toBoolean()'
  );

  // Replace shrinkResources in release block
  bg = bg.replace(
    /def enableShrinkResources = .*/,
    'def enableShrinkResources = (findProperty("android.enableShrinkResourcesInReleaseBuilds") ?: "true").toBoolean()\n            shrinkResources enableShrinkResources'
  );

  // Add splits block inside android { ... } if not present
  if (!bg.includes('splits {')) {
    const splitsBlock = '\n    splits {\n        abi {\n            reset()\n            enable true\n            universalApk false\n            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"\n        }\n    }\n';
    if (bg.includes('packagingOptions {')) {
      bg = bg.replace('packagingOptions {', splitsBlock + '\n    packagingOptions {');
    } else if (bg.includes('packaging {')) {
      bg = bg.replace('packaging {', splitsBlock + '\n    packaging {');
    }
  }

  fs.writeFileSync(buildGradlePath, bg, 'utf8');
  console.log('✅ Updated android/app/build.gradle');
}

// 3. Configure android/app/src/main/AndroidManifest.xml
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:hardwareAccelerated')) {
    manifest = manifest.replace(
      '<application ',
      '<application android:hardwareAccelerated="true" android:largeHeap="true" '
    );
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('✅ Updated AndroidManifest.xml with hardware acceleration');
  }
}
