package com.brdweb.billmanager.widget

import androidx.glance.appwidget.updateAll
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BillManagerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BillManagerWidget")

    AsyncFunction("updateSnapshot") Coroutine { snapshot: Map<String, Any?> ->
      val context = requireNotNull(appContext.reactContext)
      val preferences = context.getSharedPreferences(WIDGET_PREFERENCES, 0)
      preferences.edit()
        .putLong("billId", (snapshot["billId"] as? Number)?.toLong() ?: -1L)
        .putString("nextUpLabel", snapshot["nextUpLabel"] as? String ?: context.getString(R.string.billmanager_widget_next_up))
        .putString("title", snapshot["title"] as? String ?: context.getString(R.string.billmanager_widget_no_upcoming))
        .putString("dueLabel", snapshot["dueLabel"] as? String ?: context.getString(R.string.billmanager_widget_caught_up))
        .putString("amountLabel", snapshot["amountLabel"] as? String ?: "")
        .putString("remainingThisMonthLabel", snapshot["remainingThisMonthLabel"] as? String ?: "")
        .putBoolean("showAmounts", snapshot["showAmounts"] as? Boolean ?: false)
        .apply()
      BillManagerGlanceWidget().updateAll(context)
    }
  }
}

internal const val WIDGET_PREFERENCES = "billmanager_widget"
