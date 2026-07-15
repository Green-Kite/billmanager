package com.brdweb.billmanager.widget

import android.content.Context
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

private data class WidgetSnapshot(
  val billId: Long,
  val nextUpLabel: String,
  val title: String,
  val dueLabel: String,
  val amountLabel: String,
  val remainingThisMonthLabel: String,
  val showAmounts: Boolean,
)

class BillManagerGlanceWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val preferences = context.getSharedPreferences(WIDGET_PREFERENCES, 0)
    val legacyRemainingAmount = preferences.getString("remainingLabel", "") ?: ""
    val snapshot = WidgetSnapshot(
      billId = preferences.getLong("billId", -1L),
      nextUpLabel = preferences.getString("nextUpLabel", context.getString(R.string.billmanager_widget_next_up))
        ?: context.getString(R.string.billmanager_widget_next_up),
      title = preferences.getString("title", context.getString(R.string.billmanager_widget_no_upcoming))
        ?: context.getString(R.string.billmanager_widget_no_upcoming),
      dueLabel = preferences.getString("dueLabel", context.getString(R.string.billmanager_widget_caught_up))
        ?: context.getString(R.string.billmanager_widget_caught_up),
      amountLabel = preferences.getString("amountLabel", "") ?: "",
      remainingThisMonthLabel = preferences.getString("remainingThisMonthLabel", null)
        ?: if (legacyRemainingAmount.isNotEmpty()) {
          context.getString(R.string.billmanager_widget_remaining_this_month, legacyRemainingAmount)
        } else {
          ""
        },
      showAmounts = preferences.getBoolean("showAmounts", false),
    )

    provideContent {
      BillManagerWidgetContent(snapshot)
    }
  }
}

class BillManagerWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = BillManagerGlanceWidget()
}

@Composable
private fun BillManagerWidgetContent(snapshot: WidgetSnapshot) {
  val destination = if (snapshot.billId < 0) {
    "billmanager://home"
  } else {
    "billmanager://bills/${snapshot.billId}"
  }
  val intent = Intent(Intent.ACTION_VIEW, Uri.parse(destination))

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(
        ColorProvider(
          day = Color(AndroidColor.parseColor("#F7FBF8")),
          night = Color(AndroidColor.parseColor("#F7FBF8")),
        ),
      )
      .clickable(actionStartActivity(intent))
      .padding(16.dp),
    verticalAlignment = Alignment.Vertical.CenterVertically,
    horizontalAlignment = Alignment.Horizontal.Start,
  ) {
    Row(modifier = GlanceModifier.fillMaxWidth()) {
      Text(
        text = "BILLMANAGER",
        style = TextStyle(
          color = ColorProvider(
            day = Color(AndroidColor.parseColor("#00875A")),
            night = Color(AndroidColor.parseColor("#00875A")),
          ),
          fontSize = 11.sp,
          fontWeight = FontWeight.Bold,
        ),
      )
      Spacer(modifier = GlanceModifier.defaultWeight())
      Text(
        text = snapshot.nextUpLabel,
        style = TextStyle(
          color = ColorProvider(
            day = Color(AndroidColor.parseColor("#65736D")),
            night = Color(AndroidColor.parseColor("#65736D")),
          ),
          fontSize = 11.sp,
        ),
        maxLines = 1,
      )
    }
    Spacer(modifier = GlanceModifier.height(10.dp))
    Text(
      text = snapshot.title,
      style = TextStyle(
        color = ColorProvider(
          day = Color(AndroidColor.parseColor("#14231D")),
          night = Color(AndroidColor.parseColor("#14231D")),
        ),
        fontSize = 19.sp,
        fontWeight = FontWeight.Bold,
      ),
      maxLines = 2,
    )
    Spacer(modifier = GlanceModifier.height(4.dp))
    Text(
      text = snapshot.dueLabel,
      style = TextStyle(
        color = ColorProvider(
          day = Color(AndroidColor.parseColor("#65736D")),
          night = Color(AndroidColor.parseColor("#65736D")),
        ),
        fontSize = 13.sp,
      ),
      maxLines = 1,
    )
    if (snapshot.showAmounts && snapshot.amountLabel.isNotEmpty()) {
      Spacer(modifier = GlanceModifier.height(10.dp))
      Text(
        text = snapshot.amountLabel,
        style = TextStyle(
          color = ColorProvider(
            day = Color(AndroidColor.parseColor("#00875A")),
            night = Color(AndroidColor.parseColor("#00875A")),
          ),
          fontSize = 22.sp,
          fontWeight = FontWeight.Bold,
        ),
        maxLines = 1,
      )
    }
    if (snapshot.showAmounts && snapshot.remainingThisMonthLabel.isNotEmpty()) {
      Spacer(modifier = GlanceModifier.height(3.dp))
      Text(
        text = snapshot.remainingThisMonthLabel,
        style = TextStyle(
          color = ColorProvider(
            day = Color(AndroidColor.parseColor("#65736D")),
            night = Color(AndroidColor.parseColor("#65736D")),
          ),
          fontSize = 11.sp,
        ),
        maxLines = 1,
      )
    }
  }
}
