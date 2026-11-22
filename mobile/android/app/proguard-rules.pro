# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Ascend's own native module (watcher service, boot receiver, Expo module).
# Expo's bundled rules already cover Records/Modules and the manifest keeps the
# service/receiver; keep the whole small package anyway so nothing it reaches
# by reflection gets renamed or stripped.
-keep class expo.modules.ascendnative.** { *; }
