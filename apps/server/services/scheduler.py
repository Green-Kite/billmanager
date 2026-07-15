"""
Background task scheduler for BillManager.

Handles periodic tasks like:
- Telemetry collection and sending
- Future: Auto-payment processing, reminders, etc.
"""

import logging
import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text

logger = logging.getLogger(__name__)

TELEMETRY_ADVISORY_LOCK_KEY = 1379967101


class TaskScheduler:
    """Background task scheduler using APScheduler."""

    def __init__(self, app=None):
        self.app = app
        self.scheduler = BackgroundScheduler(timezone=timezone.utc)
        self.started = False

        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize scheduler with Flask app."""
        self.app = app

    def start(self):
        """Start the background scheduler."""
        if self.started:
            logger.warning("Scheduler already started")
            return

        if self.app and (
            self.app.config.get("TESTING")
            or os.environ.get("FLASK_ENV", "").lower() == "testing"
        ):
            logger.info("Background scheduler disabled in the test environment")
            return

        logger.info("Starting background task scheduler")

        # Schedule telemetry collection (daily at 2 AM UTC)
        self.scheduler.add_job(
            func=self._send_telemetry,
            trigger=CronTrigger(hour=2, minute=0, timezone=timezone.utc),
            id='telemetry_daily',
            name='Send daily telemetry',
            replace_existing=True
        )

        # Run telemetry on startup (with 5 minute delay)
        self.scheduler.add_job(
            func=self._send_telemetry,
            trigger='date',
            run_date=datetime.now(timezone.utc).replace(microsecond=0)
            + timedelta(minutes=5),
            id='telemetry_startup',
            name='Send telemetry on startup'
        )

        self.scheduler.start()
        self.started = True
        logger.info("Background scheduler started")

    def stop(self):
        """Stop the background scheduler."""
        if not self.started:
            return

        logger.info("Stopping background task scheduler")
        self.scheduler.shutdown()
        self.started = False

    def _send_telemetry(self):
        """Send telemetry data (runs in background thread)."""
        from services.telemetry import telemetry

        # Use app context for database access
        with self.app.app_context():
            try:
                with self._telemetry_job_lock() as acquired:
                    if not acquired:
                        logger.debug(
                            "Another worker is already sending telemetry; skipping"
                        )
                        return

                    logger.info("Running scheduled telemetry collection")
                    success = telemetry.send_telemetry()
                    if success:
                        logger.info("Telemetry sent successfully")
                    else:
                        logger.debug(
                            "Telemetry was not sent; it may be disabled, opted out, "
                            "recently sent, or a send may have failed"
                        )

            except Exception as e:
                logger.error(f"Failed to send scheduled telemetry: {e}", exc_info=True)

    @contextmanager
    def _telemetry_job_lock(self):
        """Coordinate scheduler workers using the existing PostgreSQL database."""
        from models import db

        if db.engine.dialect.name != 'postgresql':
            yield True
            return

        with db.engine.connect() as connection:
            acquired = bool(
                connection.execute(
                    text('SELECT pg_try_advisory_lock(:lock_key)'),
                    {'lock_key': TELEMETRY_ADVISORY_LOCK_KEY},
                ).scalar()
            )
            try:
                yield acquired
            finally:
                if acquired:
                    connection.execute(
                        text('SELECT pg_advisory_unlock(:lock_key)'),
                        {'lock_key': TELEMETRY_ADVISORY_LOCK_KEY},
                    )


# Global instance
scheduler = TaskScheduler()
