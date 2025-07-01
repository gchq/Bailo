# Release Notes

All dates are formatted dd/mm/yyyy.

## 3.1.0 - [DATE]

### Changes

- Rename `Client.post_review` -> `Client.post_release_review` endpoint.
- Add `Client.post_access_request_review` endpoint.
- Add `Entry.collaborators` attribute (inherited by `Model` and `DataCard`), and add associated optional parameter
  `collaborators` to helper `Model.__init__`, `Model.create`, `Model.from_mlflow`, `DataCard.__init__` &
  `DataCard.create` and core `Client.post_model` & `Client.patch_model` methods.
- Add required `Schema.review_roles` property and add associated parameter `review_roles` to helper `Schema.__init__`,
  `Schema.create` and core `Client.post_schema`
- API endpoint for `get_user_roles` has been removed as it was never fully implemented and is no longer needed.

## 3.0.0 - 02/04/2025

### Breaking Changes

- Change minimum supported Python version to 3.9 (was 3.8).
- Remove all `Client` team methods (`post_team`, `get_all_teams`, `get_user_teams`, `get_team` and `patch_team`).
- Remove `kind` param from `Client.get_models`.

### Changes

- Change maximum supported Python version to 3.13 (was 3.11).
- Update package dependencies.
- Add optional `**kwargs` to `PkiAgent` & `TokenAgent`'s `__init__` methods to override `Agent` default params.
- Add optional `organisation` & `state` params to `Client`'s `post_model`, `patch_model` methods.
- Add `Client.model_card_from_template` method.
- Change `Entry.card_from_schema` validation of `self.kind` when `schema_id is None`.
- Implement `Entry.card_from_template` method.
- Add `Experiment.published` property to prevent duplicate publications of a single `Experiment`.
- Propagate optional `organisation` & `state` params addition to `Datacard`'s `__init__` & `create`, `Models`'s
  `__init__`, `create` & `from_mlflow`, and `Entry`'s `__init__` & `update` methods.
- Propagate `team_id` param removal from `Datacard`'s `create`, and `Model`'s `create` & `from_mlflow` methods.
- Propagate optional `organisation` & `state` returned keys to `Datacard`'s `from_id`, and `Model`'s `from_id` methods.
- Fix `Client.delete_file` endpoint.

---

<!-- prettier-ignore-start -->
> [!NOTE]
> Changelog officially introduced. Any older release notes may be missing/abbreviated.
<!-- prettier-ignore-end -->

---

## 2.5.0 - 17/07/2024

### Changes

- Rewrite experiment_tracking_demo.ipynb and models_and_releases_demo_pytorch.ipynb to improve clarity.
- Remove `kind` param from `Client.get_models`.
- Remove `MinimalSchema` enum.
- Make `AccessRequest.create`'s and `Entry.card_from_schema`'s `schema_id` param required.
- Remove optional `select_by`, and require `run_id` `Experiment.publish` params.
- Remove `Experiment.__select_run` method.

## 2.4.0 - 28/06/2024

### Changes

- Remove `Schema.get_all_schema_ids` method.
- Change `Entry.get_card_latest` to throw a `BailoException` rather than raise a warning.
- Reduce logging to be less noisy.
- Minor tweaks to documentation Notebooks formatting.

## 2.3.4 - 11/06/2024

### Changes

- Rework `Release.version` property and associated methods.
- Change `Entry.get_card_latest` to raise a warning rather than throw a `BailoException`.
- Increase logging.

## 2.3.3 - 11/06/2024

### Changes

- Change `Entry.get_card_latest` to throw a `BailoException` rather than raise a warning.

## 2.3.2 - 06/06/2024

### Changes

- Reduce logging to be less noisy.

## 2.3.1 - 23/05/2024

### Changes

- Rework TokenAgent `__init__` method to not get values from env vars or getpass.

## 2.3.0 - 21/05/2024

## 2.2.1 - 17/05/2024

## 2.2.0 - 08/05/2024
