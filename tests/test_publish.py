import os

from .dataset_fixtures import *

import datalad_service.tasks.publish
from datalad.api import create_sibling_github
from datalad_service.tasks.publish import publish_snapshot, create_github_repo


def mock_create_github(dataset, repo_name):
    return True


@pytest.fixture
def github_dryrun(monkeypatch):
    monkeypatch.setattr(datalad_service.tasks.publish,
                        'create_github_repo',
                        mock_create_github)


@pytest.fixture(autouse=True)
def no_publish(monkeypatch):
    monkeypatch.setattr(datalad_service.tasks.publish,
                        'publish_target', lambda dataset, target: True)


def test_publish(annex_path, new_dataset):
    ds_id = os.path.basename(new_dataset.path)
    published = publish_snapshot.run(
        annex_path, ds_id, 'test_version')


def test_publish_github_remote(monkeypatch, github_dryrun, annex_path, new_dataset):
    monkeypatch.setenv('DATALAD_GITHUB_ORG', 'test')
    monkeypatch.setenv('DATALAD_GITHUB_LOGIN', 'user')
    monkeypatch.setenv('DATALAD_GITHUB_PASS', 'password')
    ds_id = os.path.basename(new_dataset.path)
    published = publish_snapshot.run(
        annex_path, ds_id, 'test_version', github=True)


def test_publish_s3_remote(monkeypatch, annex_path, new_dataset):
    monkeypatch.setattr('datalad_service.config.AWS_S3_PUBLIC_BUCKET', 'a-fake-test-public-bucket')
    monkeypatch.setattr('datalad_service.config.AWS_S3_PRIVATE_BUCKET', 'a-fake-test-private-bucket')
    ds_id = os.path.basename(new_dataset.path)
    published = publish_snapshot.run(
        annex_path, ds_id, 'test_version', s3=True)
