"""Regression tests for tenant isolation and offline-sync data integrity."""

import datetime

from models import Bill, CategoryBudget, Database, Payment


def _create_isolated_database(db_session):
    database = Database(name="isolated", display_name="Isolated Database")
    db_session.add(database)
    db_session.commit()
    return database


def _create_isolated_bill(db_session, database):
    bill = Bill(
        database_id=database.id,
        name="Private Bill",
        amount=75.0,
        frequency="monthly",
        due_date="2026-08-01",
        type="expense",
    )
    db_session.add(bill)
    db_session.commit()
    return bill


class TestTenantMutationIsolation:
    """Writes must remain limited to the databases in the JWT user's access set."""

    def test_cannot_move_bill_to_an_inaccessible_database(
        self, client, auth_headers_with_db, db_session, test_bill
    ):
        isolated_database = _create_isolated_database(db_session)

        response = client.put(
            f"/api/v2/bills/{test_bill.id}",
            headers=auth_headers_with_db,
            json={"database_id": isolated_database.id},
        )

        assert response.status_code == 403
        db_session.refresh(test_bill)
        assert test_bill.database_id != isolated_database.id

    def test_cannot_create_budget_in_an_inaccessible_database(
        self, client, auth_headers_with_db, db_session
    ):
        isolated_database = _create_isolated_database(db_session)

        response = client.post(
            "/api/v2/budgets",
            headers=auth_headers_with_db,
            json={
                "database_id": isolated_database.id,
                "category": "Private",
                "monthly_limit": 100,
            },
        )

        assert response.status_code == 403
        assert CategoryBudget.query.filter_by(
            database_id=isolated_database.id
        ).count() == 0

    def test_cannot_update_or_delete_payment_in_another_database(
        self, client, auth_headers_with_db, db_session
    ):
        isolated_bill = _create_isolated_bill(
            db_session, _create_isolated_database(db_session)
        )
        payment = Payment(
            bill_id=isolated_bill.id,
            amount=75.0,
            payment_date="2026-08-01",
            notes="Original payment",
        )
        db_session.add(payment)
        db_session.commit()

        update_response = client.put(
            f"/api/v2/payments/{payment.id}",
            headers=auth_headers_with_db,
            json={"amount": 1.0, "notes": "Tampered"},
        )
        delete_response = client.delete(
            f"/api/v2/payments/{payment.id}", headers=auth_headers_with_db
        )

        assert update_response.status_code == 403
        assert delete_response.status_code == 403
        db_session.refresh(payment)
        assert payment.amount == 75.0
        assert payment.notes == "Original payment"


class TestSyncIntegrity:
    """Offline sync must not cross tenant boundaries or overwrite newer data."""

    def test_sync_rejects_mutations_for_records_in_another_database(
        self, client, auth_headers_with_db, db_session
    ):
        isolated_bill = _create_isolated_bill(
            db_session, _create_isolated_database(db_session)
        )
        payment = Payment(
            bill_id=isolated_bill.id,
            amount=75.0,
            payment_date="2026-08-01",
        )
        db_session.add(payment)
        db_session.commit()

        response = client.post(
            "/api/v2/sync/push",
            headers=auth_headers_with_db,
            json={
                "bills": [{"id": isolated_bill.id, "name": "Stolen Bill"}],
                "payments": [{"id": payment.id, "amount": 1.0}],
                "deleted_bills": [isolated_bill.id],
                "deleted_payments": [payment.id],
            },
        )

        assert response.status_code == 200
        data = response.get_json()["data"]
        assert data["rejected_bills"] == [
            {"id": isolated_bill.id, "reason": "not_found"}
        ]
        assert data["rejected_payments"] == [
            {"id": payment.id, "reason": "access_denied"}
        ]
        db_session.refresh(isolated_bill)
        db_session.refresh(payment)
        assert isolated_bill.name == "Private Bill"
        assert isolated_bill.archived is False
        assert payment.amount == 75.0

    def test_sync_rejects_stale_bill_updates_without_overwriting_server_data(
        self, client, auth_headers_with_db, db_session, test_bill
    ):
        test_bill.last_updated = datetime.datetime(2026, 7, 15, 12, 0, 0)
        db_session.commit()

        response = client.post(
            "/api/v2/sync/push",
            headers=auth_headers_with_db,
            json={
                "bills": [
                    {
                        "id": test_bill.id,
                        "name": "Stale client value",
                        "last_updated": "2026-07-15T11:59:59Z",
                    }
                ]
            },
        )

        assert response.status_code == 200
        rejected = response.get_json()["data"]["rejected_bills"]
        assert rejected[0]["id"] == test_bill.id
        assert rejected[0]["reason"] == "conflict"
        assert rejected[0]["server_data"]["name"] == "Test Bill"
        db_session.refresh(test_bill)
        assert test_bill.name == "Test Bill"
