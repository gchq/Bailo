# Release Notes

## 3.0.0 - <DATE>

### Breaking changes

- Change minimum supported Python version to 3.9 (was 3.8).
- Remove all `Client` team (`post_team`, `get_all_teams`, `gey_user_teams`, `get_team` and `patch_team`) methods.
- Remove `kind` param from `Client.get_models`.

### Changelist

- Change maximum supported Python version to 3.13 (was 3.11).
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
