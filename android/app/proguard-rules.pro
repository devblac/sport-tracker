# Sport Tracker - Production ProGuard Rules
# Optimized for Capacitor PWA with Supabase integration

# ===== CAPACITOR CORE RULES =====
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.sporttracker.fitness.** { *; }

# Keep Capacitor plugin classes and methods
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

# ===== WEBVIEW & JAVASCRIPT INTERFACE =====
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView related classes
-keep class android.webkit.** { *; }
-keep class androidx.webkit.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# ===== ANDROID FRAMEWORK =====
# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ===== NETWORKING & HTTP =====
# OkHttp and Retrofit (used by Supabase)
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn okio.**

# Keep HTTP client interfaces
-keep interface okhttp3.** { *; }
-keep interface retrofit2.** { *; }

# ===== JSON & SERIALIZATION =====
# Gson (if used)
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Jackson (if used)
-keep @com.fasterxml.jackson.annotation.JsonIgnoreProperties class * { *; }
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**

# ===== SUPABASE & DATABASE =====
# Keep Supabase client classes
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**

# Keep database model classes (if any)
-keep class **.model.** { *; }
-keep class **.dto.** { *; }
-keep class **.entity.** { *; }

# ===== DEBUGGING & CRASH REPORTING =====
# Keep attributes for stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep exception classes for crash reporting
-keep class * extends java.lang.Exception { *; }

# ===== OPTIMIZATION SETTINGS =====
# Enable aggressive optimizations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove logging in production (optional - uncomment if desired)
# -assumenosideeffects class android.util.Log {
#     public static boolean isLoggable(java.lang.String, int);
#     public static int v(...);
#     public static int i(...);
#     public static int w(...);
#     public static int d(...);
#     public static int e(...);
# }

# ===== WARNINGS SUPPRESSION =====
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn javax.inject.**
-dontwarn sun.misc.Unsafe
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ===== CAPACITOR PLUGINS =====
# Keep common Capacitor plugin classes
-keep class com.capacitorjs.plugins.** { *; }

# Splash Screen plugin
-keep class com.capacitorjs.plugins.splashscreen.** { *; }

# Status Bar plugin
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# Storage plugin
-keep class com.capacitorjs.plugins.storage.** { *; }

# Network plugin
-keep class com.capacitorjs.plugins.network.** { *; }

# Device plugin
-keep class com.capacitorjs.plugins.device.** { *; }

# ===== PWA SPECIFIC =====
# Keep service worker related classes
-keep class ** implements android.webkit.ServiceWorkerClient { *; }

# Keep manifest and PWA related classes
-keep class ** { 
    public void onManifest*(...);
}

# ===== FINAL CLEANUP =====
# Remove unused resources
-dontwarn **
-ignorewarnings
