package com.gymtracker.app;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Debug;
import android.util.Log;
import android.webkit.WebView;


public class MemoryManager {
    private static final String TAG = "MemoryManager";
    private static final long LOW_MEMORY_THRESHOLD = 50 * 1024 * 1024; // 50MB
    
    public static void optimizeMemoryUsage(Context context, WebView webView) {
        // Get memory info
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
        activityManager.getMemoryInfo(memoryInfo);
        
        // Log memory status in debug builds
        logMemoryStatus(memoryInfo);
        
        // Apply memory optimizations based on available memory
        if (memoryInfo.availMem < LOW_MEMORY_THRESHOLD) {
            applyLowMemoryOptimizations(webView);
        } else {
            applyStandardOptimizations(webView);
        }
    }
    
    private static void applyLowMemoryOptimizations(WebView webView) {
        if (webView != null) {
            // Reduce cache size for low memory devices
            webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
            
            // Disable hardware acceleration on low memory devices
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
            
            Log.d(TAG, "Applied low memory optimizations");
        }
    }
    
    private static void applyStandardOptimizations(WebView webView) {
        if (webView != null) {
            // Standard cache settings
            webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
            
            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            Log.d(TAG, "Applied standard memory optimizations");
        }
    }
    
    public static void clearMemoryCache(WebView webView) {
        if (webView != null) {
            webView.clearCache(true);
            webView.clearHistory();
            webView.clearFormData();
            
            // Force garbage collection
            System.gc();
            
            Log.d(TAG, "Cleared WebView memory cache");
        }
    }
    
    public static void onLowMemory(WebView webView) {
        Log.w(TAG, "Low memory warning received");
        
        if (webView != null) {
            // Clear caches to free memory
            clearMemoryCache(webView);
            
            // Apply low memory optimizations
            applyLowMemoryOptimizations(webView);
        }
    }
    
    private static void logMemoryStatus(ActivityManager.MemoryInfo memoryInfo) {
        long availableMemory = memoryInfo.availMem / (1024 * 1024); // Convert to MB
        long totalMemory = memoryInfo.totalMem / (1024 * 1024); // Convert to MB
        long usedMemory = totalMemory - availableMemory;
        
        Log.d(TAG, String.format("Memory Status - Total: %dMB, Used: %dMB, Available: %dMB, Low Memory: %s",
                totalMemory, usedMemory, availableMemory, memoryInfo.lowMemory ? "YES" : "NO"));
        
        // Log heap memory
        Debug.MemoryInfo debugMemoryInfo = new Debug.MemoryInfo();
        Debug.getMemoryInfo(debugMemoryInfo);
        Log.d(TAG, String.format("Heap Memory - Total: %dKB, Used: %dKB",
                debugMemoryInfo.getTotalPss(), debugMemoryInfo.getTotalPrivateDirty()));
    }
    
    public static boolean isLowMemoryDevice(Context context) {
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        return activityManager.isLowRamDevice();
    }
}