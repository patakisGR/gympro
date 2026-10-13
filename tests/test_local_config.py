import asyncio
import importlib.util
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from passlib.hash import bcrypt


def load_launcher():
    path = Path(__file__).resolve().parents[1] / 'gym-backend/run_local.py'
    spec = importlib.util.spec_from_file_location('local_launcher', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_credentials_survive_reload_without_plaintext_password(tmp_path):
    launcher = load_launcher()
    first = launcher.load_local_credentials(tmp_path)
    raw = (tmp_path / 'credentials.json').read_bytes()
    second = load_launcher().load_local_credentials(tmp_path)
    assert first == second
    assert (tmp_path / 'credentials.json').read_bytes() == raw
    assert b'GymProLocal123!' not in raw
    assert bcrypt.verify('GymProLocal123!', first['ADMIN_PASSWORD_HASH'])
    assert len(first['SECRET_KEY']) >= 32


@pytest.mark.parametrize('content', ['broken json', '{}', '{"SECRET_KEY": "short"}'])
def test_bad_credentials_are_preserved(tmp_path, content):
    path = tmp_path / 'credentials.json'
    path.write_text(content)
    with pytest.raises(ValueError):
        load_launcher().load_local_credentials(tmp_path)
    assert path.read_text() == content


def test_disabled_email_never_calls_providers(test_app, monkeypatch):
    from utils import email
    monkeypatch.setattr(email.settings, 'EMAIL_PROVIDER', 'disabled')
    providers = [AsyncMock(), AsyncMock(), AsyncMock()]
    for name, mock in zip(['_send_via_gmail', '_send_via_sendgrid', '_send_via_mailersend'], providers):
        monkeypatch.setattr(email, name, mock)
    assert asyncio.run(email.send_welcome_email({}, '')) is False
    for mock in providers:
        mock.assert_not_called()
