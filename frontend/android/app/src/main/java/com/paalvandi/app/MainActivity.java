package com.paalvandi.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Global crash guard to ensure background plugin errors never abruptly terminate the app
        Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "Caught unexpected background error gracefully: " + throwable.getMessage(), throwable);
            // If it's a non-fatal plugin error, don't crash the UI thread
            if (throwable instanceof IllegalStateException && throwable.getMessage() != null && throwable.getMessage().contains("FirebaseApp")) {
                Log.w(TAG, "Suppressed non-fatal Firebase initialization notice");
                return;
            }
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable);
            }
        });
    }
}
