import pytest


@pytest.fixture
def existing_member(client):
    token = client.post('/api/v1/auth/login', data={'username': 'test_admin', 'password': 'test-password'}).json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/api/v1/members/', headers=headers, json={
        'first_name': 'Test', 'last_name': 'Member', 'phone': '6912345678',
        'email': 'member@example.com', 'membership_type': 'monthly',
        'birth_date': '2000-01-01', 'gender': 'other', 'notes': 'Sample',
    })
    assert response.status_code == 201
    url = f"/api/v1/members/{response.json()['id']}"
    return url, headers


@pytest.mark.parametrize('patch', [
    *[{field: None} for field in ['first_name', 'last_name', 'phone', 'email', 'membership_type']],
    {'first_name': ''}, {'first_name': '   '}, {'last_name': '\t '},
    {'phone': '123'}, {'email': 'invalid'}, {'membership_type': 'invalid'},
])
def test_invalid_update_is_rejected_without_changing_member(client, existing_member, patch):
    url, headers = existing_member
    before = client.get(url, headers=headers).json()
    response = client.patch(url, headers=headers, json=patch)
    assert response.status_code == 422
    assert response.json()['detail'][0]['loc'][1] == next(iter(patch))
    assert client.get(url, headers=headers).json() == before


def test_partial_update_trims_names_and_preserves_omitted_fields(client, existing_member):
    url, headers = existing_member
    before = client.get(url, headers=headers).json()
    response = client.patch(url, headers=headers, json={'first_name': '  Updated  '})
    assert response.status_code == 200
    assert response.json() == {**before, 'first_name': 'Updated'}


def test_optional_fields_can_be_cleared(client, existing_member):
    url, headers = existing_member
    patch = {'birth_date': None, 'gender': None, 'notes': None}
    response = client.patch(url, headers=headers, json=patch)
    assert response.status_code == 200
    saved = client.get(url, headers=headers).json()
    assert all(saved[field] is None for field in patch)


def test_empty_patch_keeps_member(client, existing_member):
    url, headers = existing_member
    before = client.get(url, headers=headers).json()
    response = client.patch(url, headers=headers, json={})
    assert response.status_code == 200
    assert response.json() == before
