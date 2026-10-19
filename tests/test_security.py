import asyncio
import time
from unittest.mock import Mock

import pytest


@pytest.mark.parametrize('claims', [
    {'sub': 'test_admin'},
    {'exp': 4102444800},
    {'sub': 'other-admin', 'exp': 4102444800},
    {'sub': '', 'exp': 4102444800},
    {'sub': 123, 'exp': 4102444800},
    {'sub': 'test_admin', 'exp': 1},
    {'sub': 'test_admin', 'exp': None},
    {'sub': 'test_admin', 'exp': []},
    {'sub': 'test_admin', 'exp': 'invalid'},
])
def test_invalid_claims_rejected(client, claims):
    from config import settings
    from jose import jwt
    token = jwt.encode(claims, settings.SECRET_KEY, algorithm='HS256')
    response = client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 401
    assert response.headers['www-authenticate'] == 'Bearer'


@pytest.mark.parametrize('algorithm,secret', [('HS512', None), ('HS256', 'wrong-secret')])
def test_invalid_signature_or_algorithm(client, algorithm, secret):
    from config import settings
    from jose import jwt
    token = jwt.encode({'sub': settings.ADMIN_USERNAME, 'exp': int(time.time()) + 300}, secret or settings.SECRET_KEY, algorithm=algorithm)
    assert client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'}).status_code == 401


def test_login_token_still_grants_access(client):
    token = client.post('/api/v1/auth/login', data={'username': 'test_admin', 'password': 'test-password'}).json()['access_token']
    response = client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert response.json()['username'] == 'test_admin'


@pytest.mark.parametrize('secret', ['', 'change-me-in-production', 'short', ' ' * 40])
def test_bad_secret_stops_startup_before_database_changes(test_app, monkeypatch, secret):
    monkeypatch.setattr(test_app.settings, 'SECRET_KEY', secret)
    create = Mock()
    monkeypatch.setattr(test_app.models.Base.metadata, 'create_all', create)
    async def start():
        async with test_app.lifespan(test_app.app):
            pytest.fail('Startup should reject this secret')
    with pytest.raises(ValueError, match='SECRET_KEY'):
        asyncio.run(start())
    create.assert_not_called()


def test_startup_does_not_log_connection_string(test_app, monkeypatch, capsys):
    url = 'postgresql://audit:private-password@localhost/example'
    monkeypatch.setattr(test_app.settings, 'DATABASE_URL', url)
    monkeypatch.setattr(test_app.models.Base.metadata, 'create_all', Mock())
    async def start():
        async with test_app.lifespan(test_app.app):
            pass
    asyncio.run(start())
    output = capsys.readouterr()
    assert url not in output.out + output.err
    assert 'private-password' not in output.out + output.err
