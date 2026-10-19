def test_login_success(client):
    # Arrange: credentials belonging only to the test environment.
    credentials = {
        "username": "test_admin",
        "password": "test-password",
    }

    # Act: the login endpoint expects form data, not a JSON body.
    response = client.post("/api/v1/auth/login", data=credentials)

    # Assert: successful status and the expected login response.
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "test_admin"
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str)
    assert body["access_token"]

def test_login_wrong_password(client):
    # Arrange: keep the username correct and change only the password.
    credentials = {
        "username": "test_admin",
        "password": "wrong-password",
    }

    # Act: attempt to log in with invalid credentials.
    response = client.post("/api/v1/auth/login", data=credentials)

    # Assert: access is denied and no authentication token is returned.
    assert response.status_code == 401
    body = response.json()
    assert "access_token" not in body
    assert isinstance(body["detail"], str)
    assert body["detail"].strip()


def test_login_locks_after_five_failures(client):
    # Arrange: the fixture starts with no previous failed attempts.
    wrong_credentials = {
        "username": "test_admin",
        "password": "wrong-password",
    }

    # Attempts 1-4: invalid credentials, but the account is not locked yet.
    for attempt in range(1, 5):
        response = client.post("/api/v1/auth/login", data=wrong_credentials)
        assert response.status_code == 401, f"Unexpected status on attempt {attempt}"
        assert "access_token" not in response.json()

    # Attempt 5: the account becomes locked.
    response = client.post("/api/v1/auth/login", data=wrong_credentials)
    assert response.status_code == 429
    assert "access_token" not in response.json()
    assert "κλειδώθηκε" in response.json()["detail"]

    # Even correct credentials must be rejected while the lockout is active.
    correct_credentials = {
        "username": "test_admin",
        "password": "test-password",
    }
    response = client.post("/api/v1/auth/login", data=correct_credentials)
    assert response.status_code == 429
    assert "access_token" not in response.json()
    assert "Δοκιμάστε ξανά" in response.json()["detail"]

