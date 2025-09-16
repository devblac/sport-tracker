package com.gymtracker.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Apply WebView optimizations for better performance
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebViewOptimizer.optimizeWebView(webView);
            MemoryManager.optimizeMemoryUsage(this, webView);
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        // Ensure WebView optimizations are maintained
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Re-apply memory optimizations
            MemoryManager.optimizeMemoryUsage(this, webView);
            
            // Enable hardware acceleration if not already enabled
            if (webView.getLayerType() != WebView.LAYER_TYPE_HARDWARE) {
                webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            }
        }
    }
    
    @Override
    public void onLowMemory() {
        super.onLowMemory();
        
        // Handle low memory situations
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            MemoryManager.onLowMemory(webView);
        }
    }
    
    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        
        // Handle memory trim requests
        if (level >= TRIM_MEMORY_MODERATE) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                MemoryManager.clearMemoryCache(webView);
            }
        }
    }
}
